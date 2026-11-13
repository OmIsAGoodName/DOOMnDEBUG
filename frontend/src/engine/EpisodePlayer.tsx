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

    // Plan Validation Guard
    const [validationError, setValidationError] = useState<string | null>(null);

    // Timeline state
    const [timeline, setTimeline] = useState<ResolvedTimeline>(() => {
      try {
        if (!plan || !plan.scenes || !plan.start_scene) {
          return resolveTimeline(
            {
              schema_version: '1.0',
              episode_id: 'ep_fallback',
              age_band: '4-6',
              title: 'Empty Episode',
              start_scene: 'sc_empty',
              interactive: false,
              cast: [],
              scenes: [
                {
                  scene_id: 'sc_empty',
                  background_id: 'forest_day',
                  mood: 'day',
                  beats: [{ beat_id: 'b1', min_duration: 1.0 }],
                },
              ],
            },
            null
          );
        }
        return resolveTimeline(plan, audio, choicePath || []);
      } catch (err) {
        console.warn('[EpisodePlayer] Timeline initialization error:', err);
        return resolveTimeline(
          {
            schema_version: '1.0',
            episode_id: 'ep_fallback',
            age_band: '4-6',
            title: 'Fallback',
            start_scene: 'sc_fallback',
            interactive: false,
            cast: [],
            scenes: [
              {
                scene_id: 'sc_fallback',
                background_id: 'forest_day',
                mood: 'day',
                beats: [{ beat_id: 'b1', min_duration: 1.0 }],
              },
            ],
          },
          null
        );
      }
    });

    useEffect(() => {
      if (!plan || !plan.scenes || plan.scenes.length === 0 || !plan.start_scene) {
        const msg = 'Invalid EpisodePlan: missing scenes or start_scene';
        setValidationError(msg);
        onError?.(new Error(msg));
        return;
      }
      setValidationError(null);

      try {
        const tl = resolveTimeline(plan, audio, choicePath || []);
        setTimeline(tl);
        audioEngineRef.current?.loadManifest(audio).catch((err) => {
          console.warn('[EpisodePlayer] Audio load error:', err);
        });
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setValidationError(e.message);
        onError?.(e);
      }
    }, [plan, audio, choicePath, onError]);

    // Clock state refs
    const timeRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isListeningRef = useRef(false);
    const activeChoicePointRef = useRef<string | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);

    const [hasInteracted, setHasInteracted] = useState(false);
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

        const deltaSeconds = Math.min((now - lastTimestampRef.current) / 1000, 0.1);
        lastTimestampRef.current = now;

        const nextTime = timeRef.current + deltaSeconds;
        timeRef.current = nextTime;

        // Check for choices
        const choicePoint = timeline.choicePoints.find(
          (cp) =>
            nextTime >= cp.listeningStartTime &&
            activeChoicePointRef.current !== cp.choiceBeatId
        );

        if (choicePoint) {
          activeChoicePointRef.current = choicePoint.choiceBeatId;

          if (mode === 'live') {
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
              choicePath && choicePath.length > 0
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

    // Play
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

    // Pause
    const pause = useCallback(() => {
      isPlayingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
      audioEngineRef.current?.pause();
    }, []);

    // Seek
    const seek = useCallback(
      (t: number) => {
        const clampedT = Math.max(0, Math.min(t, timeline.totalDuration));
        timeRef.current = clampedT;
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

    // Resolve choice
    const resolveChoice = useCallback(
      (optionId: string) => {
        const choiceBeatId = activeChoicePointRef.current;
        if (!choiceBeatId) return;

        // Resolve choice (supports 'default' as alias)
        const reResolved = resolveFrom(timeline, choiceBeatId, optionId);
        setTimeline(reResolved);
        isListeningRef.current = false;
        setIsChoiceActive(false);

        play();
      },
      [timeline, play]
    );

    // Recording: startRecording
    const startRecording = useCallback((opts?: { muteLocal?: boolean }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(30);

      const audioCtx = audioEngineRef.current?.initContext();
      if (audioCtx) {
        const audioDest = audioCtx.createMediaStreamDestination();
        audioEngineRef.current?.setRecordingDestination(audioDest);
        const audioTracks = audioDest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      }

      if (opts?.muteLocal) {
        audioEngineRef.current?.setMuted(true);
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = 'video/webm';
      for (const mime of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      recordedChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMime,
          videoBitsPerSecond: 4000000,
        });

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
        recorder.start(100);
      } catch (err) {
        console.warn('[EpisodePlayer] MediaRecorder initialization failed:', err);
      }
    }, []);

    // Recording: stopRecording
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

    // Tab visibility handling (pause on background, resume on foreground)
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (isPlayingRef.current) {
            pause();
            isPlayingRef.current = true; // flag to resume
          }
        } else {
          if (isPlayingRef.current) {
            play();
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [pause, play]);

    const handleUserStart = () => {
      setHasInteracted(true);
      audioEngineRef.current?.initContext();
      play();
    };

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

    useEffect(() => {
      drawCurrentFrame(timeRef.current);
    }, [drawCurrentFrame]);

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

        {/* Validation Error Message */}
        {validationError && (
          <div className="absolute inset-0 bg-rose-950/90 text-white flex flex-col items-center justify-center p-6 text-center z-30">
            <p className="text-lg font-bold text-rose-300">Player Notice</p>
            <p className="text-sm text-slate-300 mt-2 max-w-md">{validationError}</p>
          </div>
        )}

        {/* Tap to start overlay */}
        {!hasInteracted && !validationError && (
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

        {/* Live Choice Indicator with animated thinking dots */}
        {isChoiceActive && (
          <div className="absolute top-4 right-4 bg-amber-500/95 text-slate-950 px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 z-10 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
            Listening...
          </div>
        )}
      </div>
    );
  }
);

EpisodePlayer.displayName = 'EpisodePlayer';
export default EpisodePlayer;
