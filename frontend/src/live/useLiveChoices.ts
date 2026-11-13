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

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isResolvedRef = useRef(false);

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setHasMicSupport(false);
    }
  }, []);

  const handleResolveOption = useCallback(
    (optionId: string, reason = 'tap') => {
      if (isResolvedRef.current) return;
      isResolvedRef.current = true;

      // Stop speech recognition
      try {
        recognitionRef.current?.stop();
      } catch {}

      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }

      setIsListening(false);
      setIsThinking(false);
      onResolve(optionId);
    },
    [onResolve]
  );

  // Process heard transcript
  const processTranscript = useCallback(
    async (spokenText: string, options: ChoiceOption[]) => {
      setTranscript(spokenText);

      // 1. Client keyword match first
      const clientMatch = matchChoice(spokenText, options);
      if (clientMatch.matchedId) {
        setStatusMessage(`I heard "${spokenText}"!`);
        handleResolveOption(clientMatch.matchedId, 'keyword');
        return;
      }

      // 2. Fallback to api.matchLive with 2.5s timeout
      setIsThinking(true);
      setStatusMessage('Thinking...');

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
          handleResolveOption(res.option_id, 'api');
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
        setStatusMessage('Say it again or tap a choice!');
      } else {
        const defaultOpt = choiceInfo?.choice.default || options[0].id;
        const defaultLabel = options.find((o) => o.id === defaultOpt)?.label || 'Continue';
        setStatusMessage(`Let's go with ${defaultLabel}!`);
        handleResolveOption(defaultOpt, 'default');
      }
    },
    [promptText, choiceInfo, handleResolveOption]
  );

  // Start listening when choice point is active
  useEffect(() => {
    if (!choiceInfo) {
      setIsListening(false);
      setTranscript('');
      setInterimTranscript('');
      setStatusMessage(null);
      isResolvedRef.current = false;
      retryCountRef.current = 0;
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      return;
    }

    isResolvedRef.current = false;
    retryCountRef.current = 0;
    const options = choiceInfo.choice.options;

    // Set 12s overall choice timeout -> falls back to choice.default
    timeoutTimerRef.current = setTimeout(() => {
      if (!isResolvedRef.current) {
        const defaultOpt = choiceInfo.choice.default || options[0].id;
        const defaultLabel = options.find((o) => o.id === defaultOpt)?.label || 'Continue';
        setStatusMessage(`Time's up! Let's go with ${defaultLabel}.`);
        handleResolveOption(defaultOpt, 'timeout');
      }
    }, 12000);

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition: SpeechRecognitionInstance = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptChunk;
            } else {
              interim += transcriptChunk;
            }
          }

          if (interim) setInterimTranscript(interim);
          if (final) {
            setInterimTranscript('');
            processTranscript(final, options);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('[useLiveChoices] Speech recognition error:', e.error);
          setIsListening(false);
          setStatusMessage('Tap a choice button below!');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('[useLiveChoices] Could not start speech recognition:', err);
      }
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [choiceInfo, language, processTranscript, handleResolveOption]);

  return {
    isListening,
    transcript: interimTranscript || transcript,
    statusMessage,
    isThinking,
    hasMicSupport,
    handleResolveOption,
  };
}

