/**
 * VoxFable Shared Episode View
 * Used by Quick Story (/quick) and Library Player (/episode/:id)
 */

import React, { useState, useRef, useEffect } from 'react';
import type { EpisodeRecord, EpisodePlayerHandle, EpisodePlan, AudioManifest } from '@contracts';
import { EpisodePlayer } from '../engine';
import { exportEpisode } from '../engine/exportFlow';
import { LiveController } from '../live';
import { api, triggerFileDownload } from '../lib/api';
import { Button } from './Button';
import { SafetyBadge, ContinuityBadge } from './Badge';

export interface EpisodeViewProps {
  episode: EpisodeRecord;
  onReset?: () => void;
  className?: string;
}

const DEFAULT_FALLBACK_PLAN: EpisodePlan = {
  schema_version: '1.0',
  episode_id: 'ep_fallback',
  title: 'Untitled Episode',
  age_band: '4-6',
  start_scene: 'sc1',
  interactive: false,
  cast: [],
  scenes: [
    {
      scene_id: 'sc1',
      background_id: 'forest_day',
      mood: 'day',
      beats: [
        {
          beat_id: 'b1',
          speech: {
            type: 'NARRATE',
            text: 'Welcome to VoxFable! Creating your magical story...'
          },
          actions: []
        }
      ]
    }
  ]
};

export function EpisodeView({ episode, onReset, className = '' }: EpisodeViewProps) {
  const playerRef = useRef<EpisodePlayerHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(episode.video_url || null);

  const plan: EpisodePlan = episode.plan || DEFAULT_FALLBACK_PLAN;
  const audio: AudioManifest | null = episode.audio_manifest || null;
  const isInteractive = Boolean(plan.interactive);

  // Poll player handle for time and duration while playing
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      if (playerRef.current) {
        const t = playerRef.current.getTime();
        const d = playerRef.current.getDuration();
        setCurrentTime(t);
        if (d > 0) setDuration(d);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [hasStarted]);

  const handleStartPlayback = () => {
    setHasStarted(true);
    setIsPlaying(true);
    playerRef.current?.play();
  };

  const handleTogglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      if (duration > 0 && currentTime >= duration) {
        playerRef.current.seek(0);
        setCurrentTime(0);
      }
      playerRef.current.play();
      setIsPlaying(true);
      setHasStarted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newT = parseFloat(e.target.value);
    setCurrentTime(newT);
    playerRef.current?.seek(newT);
  };

  const handleReplay = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    setHasStarted(true);
    playerRef.current?.seek(0);
    playerRef.current?.play();
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadMp4 = async () => {
    if (downloadUrl) {
      triggerFileDownload(downloadUrl, `${plan.title || episode.title || 'episode'}.mp4`);
      return;
    }

    if (!playerRef.current) return;

    try {
      setIsExporting(true);
      setExportProgressText('Recording canvas stream at 720p...');

      let capturedBlob: Blob | null = null;
      const result = await exportEpisode({
        handle: playerRef.current,
        episodeId: episode.id,
        uploader: async (blob, epId) => {
          capturedBlob = blob;
          setExportProgressText('Uploading WebM to server converter...');
          try {
            const exp = await api.exportEpisode(epId, blob);
            return { exportId: exp.export_id };
          } catch (uploadErr) {
            console.warn('[EpisodeView] Server upload failed, offering direct WebM download:', uploadErr);
            triggerFileDownload(blob, `${plan.title || episode.title || 'episode'}.webm`);
            setExportProgressText('Downloaded 720p WebM directly to your device!');
            return { exportId: 'local_direct' };
          }
        },
        onProgress: (p) => {
          if (p.stage === 'recording' && p.totalSeconds) {
            const pct = Math.round((p.progress || 0) * 100);
            setExportProgressText(`Recording episode (${pct}% - this takes as long as the episode)...`);
          } else if (p.stage === 'uploading') {
            setExportProgressText('Sending video to FFmpeg...');
          }
        }
      });

      if (result.exportId === 'local_direct') {
        setTimeout(() => setIsExporting(false), 3000);
        return;
      }

      setExportProgressText('Converting to high-compatibility MP4...');
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const status = await api.getExportStatus(result.exportId);
          if (status.status === 'done' && status.mp4_url) {
            clearInterval(pollInterval);
            setIsExporting(false);
            setDownloadUrl(status.mp4_url);
            triggerFileDownload(status.mp4_url, `${plan.title || episode.title || 'episode'}.mp4`);
          } else if (status.status === 'failed' || attempts > 60) {
            clearInterval(pollInterval);
            setIsExporting(false);
            if (capturedBlob) {
              triggerFileDownload(capturedBlob, `${plan.title || episode.title || 'episode'}.webm`);
              alert(`MP4 conversion issue: ${status.error || 'Conversion timed out'}. Direct WebM downloaded instead!`);
            } else {
              alert('Export failed during MP4 conversion.');
            }
          }
        } catch {
          clearInterval(pollInterval);
          setIsExporting(false);
          if (capturedBlob) {
            triggerFileDownload(capturedBlob, `${plan.title || episode.title || 'episode'}.webm`);
          }
        }
      }, 1500);
    } catch (err: any) {
      setIsExporting(false);
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div className={`space-y-6 w-full max-w-4xl mx-auto ${className}`}>
      {/* Episode Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{plan.title || episode.title}</h2>
            {isInteractive && (
              <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                🎙 Interactive
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Age Band: <strong className="text-slate-700 dark:text-slate-200">{plan.age_band || '4-6'}</strong> &bull; Cast:{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {plan.cast?.map((c) => c.name).join(', ') || 'Pip the Owl'}
            </strong>
          </p>
        </div>

        {/* Quality Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <SafetyBadge
            status={episode.safety?.verdict || 'pass'}
            ageFit={episode.safety?.age_fit}
            scary={episode.safety?.scary}
            notes={episode.safety?.notes}
          />
          <ContinuityBadge
            violations={episode.continuity?.violations || []}
          />
        </div>
      </div>

      {/* Main Video Canvas Area & Media Container */}
      <div
        ref={containerRef}
        className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-800 group"
      >
        {isLiveMode ? (
          <LiveController plan={plan} audio={audio} className="h-full" />
        ) : (
          <>
            <EpisodePlayer
              ref={playerRef}
              plan={plan}
              audio={audio}
              mode="watch"
              captions={true}
              muted={isMuted}
              onEnd={() => {
                setIsPlaying(false);
              }}
            />

            {/* Play Overlay */}
            {!hasStarted && (
              <div
                onClick={handleStartPlayback}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer transition-opacity z-20"
              >
                <div className="w-20 h-20 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 text-white">
                  <svg className="w-10 h-10 ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-white font-extrabold text-lg mt-4 tracking-wide drop-shadow">
                  Tap to Start Story
                </span>
                <span className="text-slate-300 text-xs mt-1">Audio enabled</span>
              </div>
            )}

            {/* In-Canvas Hover Media Controls Bar */}
            {hasStarted && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2 z-20 transition-opacity duration-300 opacity-90 group-hover:opacity-100">
                {/* Timeline Scrubber */}
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between text-white text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={handleTogglePlayPause}
                      className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Replay */}
                    <button
                      type="button"
                      onClick={handleReplay}
                      className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none"
                      title="Replay from start"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                      </svg>
                    </button>

                    {/* Time Counter */}
                    <span className="font-mono text-slate-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mute/Unmute */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <svg className="w-5 h-5 fill-current text-rose-400" viewBox="0 0 24 24">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      )}
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none"
                      title="Fullscreen"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export status bar */}
      {isExporting && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-center space-y-2 animate-pulse">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-300">{exportProgressText}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">Please keep this browser tab active during recording.</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          {!isLiveMode && (
            <Button variant="secondary" size="md" onClick={handleReplay}>
              ↺ Replay Story
            </Button>
          )}

          {isInteractive && (
            <Button
              variant={isLiveMode ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setIsLiveMode(!isLiveMode)}
            >
              {isLiveMode ? '📺 Watch Mode' : '🎙 Live Interactive Mode'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            loading={isExporting}
            onClick={handleDownloadMp4}
          >
            📥 {downloadUrl ? 'Download MP4' : 'Export MP4'}
          </Button>

          {onReset && (
            <Button variant="ghost" size="md" onClick={onReset}>
              ✨ Create Another
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
