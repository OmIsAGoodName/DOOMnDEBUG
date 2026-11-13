import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { EpisodePlayerHandle, EpisodePlayerProps } from '@contracts';
import { resolveFrom, resolveTimeline } from './resolveTimeline';
import { renderAt } from './renderAt';
import { AudioEngine } from './audio/engine';
import type { ResolvedTimeline } from './types';

export const EpisodePlayer = forwardRef<EpisodePlayerHandle, EpisodePlayerProps>(
  (props, ref) => {
    const {
      plan,
      audio,
      mode = 'watch',
      choicePath,
      captions = true,
      muted = false,
      onChoice,
      onEnd,
      onError,
    } = props;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Audio Engine instance
    const audioEngineRef = useRef<AudioEngine | null>(null);
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine();
    }

    // MediaRecorder state
    const recorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const stopRecordingResolverRef = useRef<((blob: Blob) => void) | null>(null);

    // Timeline state
    const [timeline, setTimeline] = useState<ResolvedTimeline>(() =>
      resolveTimeline(plan, audio, choicePath || [])
    );

    // Re-resolve timeline if plan or audio changes
    useEffect(() => {
      if (plan) {
        const tl = resolveTimeline(plan, audio, choicePath || []);
        setTimeline(tl);
        audioEngineRef.current?.loadManifest(audio).catch((err) => {
          console.warn('[EpisodePlayer] Audio load error:', err);
        });
      }
    }, [plan, audio, choicePath]);

    // Clock state refs
    const timeRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isListeningRef = useRef(false);
    const activeChoicePointRef = useRef<string | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);

    const [hasInteracted, setHasInteracted] = useState(false);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);
    const [isChoiceActive, setIsChoiceActive] = useState(false);

    // Mute handling
    useEffect(() => {
      audioEngineRef.current?.setMuted(muted);
    }, [muted]);

    // Render current frame
    const drawCurrentFrame = useCallback(
      (t: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Render pure at time t
        renderAt(ctx, timeline, t, { showCaptions: captions });
      },
      [timeline, captions]
    );

    // Master Clock tick loop
    const tick = useCallback(
      (now: number) => {
        if (!isPlayingRef.current) return;

        if (lastTimestampRef.current === null) {
          lastTimestampRef.current = now;
        }

        // Clamp delta to avoid big jumps (tab sleep/unfocus)
        const deltaSeconds = Math.min((now - lastTimestampRef.current) / 1000, 0.1);
        lastTimestampRef.current = now;

        const nextTime = timeRef.current + deltaSeconds;
        timeRef.current = nextTime;
        setCurrentTimeDisplay(nextTime);

        // Check for choices
        const choicePoint = timeline.choicePoints.find(
          (cp) =>
            nextTime >= cp.listeningStartTime &&
            activeChoicePointRef.current !== cp.choiceBeatId
        );

        if (choicePoint) {
          activeChoicePointRef.current = choicePoint.choiceBeatId;

          if (mode === 'live') {
            // Live mode: pause clock, enter listening
            isPlayingRef.current = false;
            isListeningRef.current = true;
            setIsChoiceActive(true);
            audioEngineRef.current?.pause();

            drawCurrentFrame(choicePoint.listeningStartTime);
            onChoice?.({
              choice: {
                options: choicePoint.options,
                default: choicePoint.defaultOptionId,
              },
              sceneId: choicePoint.sceneId,
              beatId: choicePoint.choiceBeatId,
            });
            return;
          } else {
            // Watch mode: auto-resolve
            const chosenId =
              (choicePath && choicePath.length > 0)
                ? choicePath[0]
                : choicePoint.defaultOptionId;

            const reResolved = resolveFrom(timeline, choicePoint.choiceBeatId, chosenId);
            setTimeline(reResolved);
          }
        }

        // Check for end of episode
        if (nextTime >= timeline.totalDuration) {
          timeRef.current = timeline.totalDuration;
          isPlayingRef.current = false;
          drawCurrentFrame(timeline.totalDuration);
          audioEngineRef.current?.stopAll();
          onEnd?.();
          return;
        }

        drawCurrentFrame(nextTime);
        animFrameRef.current = requestAnimationFrame(tick);
      },
      [timeline, mode, choicePath, onChoice, onEnd, drawCurrentFrame]
    );

    // Start / resume playback
    const play = useCallback(() => {
      if (timeRef.current >= timeline.totalDuration) {
        timeRef.current = 0;
      }
      isPlayingRef.current = true;
      isListeningRef.current = false;
      setIsChoiceActive(false);
      lastTimestampRef.current = null;

      audioEngineRef.current?.initContext();
      audioEngineRef.current?.syncPlayback(timeline, timeRef.current, true);

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    }, [timeline, tick]);

    // Pause playback
    const pause = useCallback(() => {
      isPlayingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
      audioEngineRef.current?.pause();
    }, []);

    // Seek to time t
    const seek = useCallback(
      (t: number) => {
        const clampedT = Math.max(0, Math.min(t, timeline.totalDuration));
        timeRef.current = clampedT;
        setCurrentTimeDisplay(clampedT);
        lastTimestampRef.current = null;

        drawCurrentFrame(clampedT);

        if (isPlayingRef.current) {
          audioEngineRef.current?.syncPlayback(timeline, clampedT, true);
        } else {
          audioEngineRef.current?.stopAll();
        }
      },
      [timeline, drawCurrentFrame]
    );

    // Resolve choice branch
    const resolveChoice = useCallback(
      (optionId: string) => {
        const choiceBeatId = activeChoicePointRef.current;
        if (!choiceBeatId) return;

        const reResolved = resolveFrom(timeline, choiceBeatId, optionId);
        setTimeline(reResolved);
        isListeningRef.current = false;
        setIsChoiceActive(false);

        // Resume playback immediately
        play();
      },
      [timeline, play]
    );

    // Start recording client stream
    const startRecording = useCallback((opts?: { muteLocal?: boolean }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(30);

      // Connect audio destination if present
      const audioCtx = audioEngineRef.current?.initContext();
      if (audioCtx) {
        const audioDest = audioCtx.createMediaStreamDestination();
        audioEngineRef.current?.setRecordingDestination(audioDest);
        const audioTracks = audioDest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = 'video/webm';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
        if (stopRecordingResolverRef.current) {
          stopRecordingResolverRef.current(blob);
          stopRecordingResolverRef.current = null;
        }
      };

      recorderRef.current = recorder;
      recorder.start(100); // 100ms chunks
    }, []);

    // Stop recording and return Blob
    const stopRecording = useCallback((): Promise<Blob> => {
      return new Promise<Blob>((resolve) => {
        if (!recorderRef.current || recorderRef.current.state === 'inactive') {
          resolve(new Blob([], { type: 'video/webm' }));
          return;
        }
        stopRecordingResolverRef.current = resolve;
        recorderRef.current.stop();
      });
    }, []);

    // Handle initial user interaction (Tap to start)
    const handleUserStart = () => {
      setHasInteracted(true);
      audioEngineRef.current?.initContext();
      play();
    };

    // Forward ref implementation
    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        seek,
        resolveChoice,
        startRecording,
        stopRecording,
        getTime: () => timeRef.current,
        getDuration: () => timeline.totalDuration,
        getChosenPath: () => timeline.chosenPath,
      }),
      [play, pause, seek, resolveChoice, startRecording, stopRecording, timeline]
    );

    // Initial frame draw on mount / timeline change
    useEffect(() => {
      drawCurrentFrame(timeRef.current);
    }, [drawCurrentFrame]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioEngineRef.current?.dispose();
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none"
      >
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />

        {/* Tap to start overlay (AudioContext unlocked on click) */}
        {!hasInteracted && (
          <div
            onClick={handleUserStart}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-950/60 z-20"
          >
            <div className="w-20 h-20 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110">
              <svg className="w-10 h-10 ml-1 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-semibold text-white tracking-wide">
              Tap to start story
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {plan?.title || 'VoxFable Animation'}
            </p>
          </div>
        )}

        {/* Live Choice Indicator */}
        {isChoiceActive && (
          <div className="absolute top-4 right-4 bg-amber-500/90 text-slate-950 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
            Listening for your choice...
          </div>
        )}
      </div>
    );
  }
);

EpisodePlayer.displayName = 'EpisodePlayer';
export default EpisodePlayer;

