import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChoiceInfo, ChoiceOption } from '@contracts';
import { api } from '../lib/api';
import { matchChoice } from './matchChoice';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export interface UseLiveChoicesOptions {
  choiceInfo: ChoiceInfo | null;
  promptText?: string;
  language?: string;
  onResolve: (optionId: string) => void;
}

export function useLiveChoices({
  choiceInfo,
  promptText = '',
  language = 'en-US',
  onResolve,
}: UseLiveChoicesOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [hasMicSupport, setHasMicSupport] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isHearingAudio, setIsHearingAudio] = useState<boolean>(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [matchedOptionLabel, setMatchedOptionLabel] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isResolvedRef = useRef(false);

  // Audio analyzer refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec && !navigator.mediaDevices?.getUserMedia) {
      setHasMicSupport(false);
      setMicPermissionState('unsupported');
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setIsHearingAudio(false);
  }, []);

  const handleResolveOption = useCallback(
    (optionId: string, reason = 'tap') => {
      if (isResolvedRef.current) return;
      isResolvedRef.current = true;

      // Stop speech recognition and audio analysis
      try {
        recognitionRef.current?.stop();
      } catch {}

      cleanupAudio();

      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }

      setIsListening(false);
      setIsThinking(false);
      onResolve(optionId);
    },
    [onResolve, cleanupAudio]
  );

  // Process heard transcript
  const processTranscript = useCallback(
    async (spokenText: string, options: ChoiceOption[]) => {
      setTranscript(spokenText);

      // 1. Client keyword / ordinal match first
      const clientMatch = matchChoice(spokenText, options);
      if (clientMatch.matchedId) {
        const chosen = options.find((o) => o.id === clientMatch.matchedId);
        const label = chosen?.label || spokenText;
        setMatchedOptionLabel(label);
        setStatusMessage(`I heard "${label}"!`);
        setTimeout(() => {
          handleResolveOption(clientMatch.matchedId!, 'keyword');
        }, 500);
        return;
      }

      // 2. Fallback to api.matchLive with 2.5s timeout
      setIsThinking(true);
      setStatusMessage('Understanding your choice...');

      try {
        const timeoutPromise = new Promise<{ option_id: string; confidence: number }>((_, reject) =>
          setTimeout(() => reject(new Error('Live match timeout')), 2500)
        );

        const matchPromise = api.matchLive(
          promptText,
          options.map((o) => ({ id: o.id, label: o.label, keywords: o.keywords })),
          spokenText
        );

        const res = await Promise.race([matchPromise, timeoutPromise]);
        if (res && res.option_id && res.confidence >= 0.5) {
          const chosen = options.find((o) => o.id === res.option_id);
          const label = chosen?.label || spokenText;
          setMatchedOptionLabel(label);
          setStatusMessage(`I heard "${label}"!`);
          setTimeout(() => {
            handleResolveOption(res.option_id, 'api');
          }, 500);
          return;
        }
      } catch (err) {
        console.warn('[useLiveChoices] api.matchLive fallback or timeout:', err);
      } finally {
        setIsThinking(false);
      }

      // If still unclear, prompt to try again or tap
      retryCountRef.current++;
      if (retryCountRef.current === 1) {
        setStatusMessage(`Heard: "${spokenText}" - say it again or tap below!`);
      } else {
        const defaultOpt = choiceInfo?.choice.default || options[0].id;
        const defaultLabel = options.find((o) => o.id === defaultOpt)?.label || 'Continue';
        setStatusMessage(`Let's go with ${defaultLabel}!`);
        handleResolveOption(defaultOpt, 'default');
      }
    },
    [promptText, choiceInfo, handleResolveOption]
  );

  // Start listening and audio level analysis when choice point is active
  useEffect(() => {
    if (!choiceInfo) {
      setIsListening(false);
      setTranscript('');
      setInterimTranscript('');
      setStatusMessage(null);
      setMatchedOptionLabel(null);
      isResolvedRef.current = false;
      retryCountRef.current = 0;
      cleanupAudio();
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      return;
    }

    isResolvedRef.current = false;
    retryCountRef.current = 0;
    let shouldBeListening = true;
    const options = choiceInfo.choice.options;

    // Set 14s overall choice timeout -> falls back to choice.default
    timeoutTimerRef.current = setTimeout(() => {
      if (!isResolvedRef.current) {
        const defaultOpt = choiceInfo.choice.default || options[0].id;
        const defaultLabel = options.find((o) => o.id === defaultOpt)?.label || 'Continue';
        setStatusMessage(`Time's up! Let's go with ${defaultLabel}.`);
        handleResolveOption(defaultOpt, 'timeout');
      }
    }, 14000);

    // 1. Explicitly request microphone stream for volume level & permissions
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!shouldBeListening || isResolvedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          setMicPermissionState('granted');

          // Initialize Web Audio Analyzer
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              audioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 64;
              analyser.smoothingTimeConstant = 0.4;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const sampleLoop = () => {
                if (!shouldBeListening || isResolvedRef.current || !analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / (dataArray.length * 255);
                setAudioLevel(avg);
                setIsHearingAudio(avg > 0.04);
                animFrameRef.current = requestAnimationFrame(sampleLoop);
              };
              animFrameRef.current = requestAnimationFrame(sampleLoop);
            }
          } catch (e) {
            console.warn('[useLiveChoices] AudioContext analysis error:', e);
          }
        })
        .catch((err) => {
          console.warn('[useLiveChoices] Microphone access denied or unavailable:', err);
          setMicPermissionState('denied');
        });
    }

    // 2. Initialize Speech Recognition
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition: SpeechRecognitionInstance = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += chunk;
            } else {
              interim += chunk;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
          }
          if (final) {
            setInterimTranscript('');
            processTranscript(final, options);
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'no-speech') {
            // Keep listening even if user pauses
            return;
          }
          if (e.error === 'not-allowed') {
            setMicPermissionState('denied');
            setIsListening(false);
            return;
          }
          console.warn('[useLiveChoices] Speech recognition error:', e.error);
        };

        recognition.onend = () => {
          // Keep continuous recognition running while choice is active
          if (shouldBeListening && !isResolvedRef.current) {
            try {
              recognition.start();
            } catch {}
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
          setIsListening(true);
        } catch (err) {
          console.warn('[useLiveChoices] Could not start speech recognition:', err);
        }
      } catch (err) {
        console.warn('[useLiveChoices] Could not initialize speech recognition:', err);
      }
    }

    return () => {
      shouldBeListening = false;
      try {
        recognitionRef.current?.stop();
        recognitionRef.current?.abort();
      } catch {}
      cleanupAudio();
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [choiceInfo, language, processTranscript, handleResolveOption, cleanupAudio]);

  return {
    isListening,
    transcript: interimTranscript || transcript,
    statusMessage,
    isThinking,
    hasMicSupport,
    audioLevel,
    isHearingAudio,
    micPermissionState,
    matchedOptionLabel,
    handleResolveOption,
  };
}
