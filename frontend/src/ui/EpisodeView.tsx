/**
 * VoxFable Shared Episode View
 * Used by Quick Story (/quick) and Library Player (/episode/:id)
 */

import React, { useState, useRef } from 'react';
import type { EpisodeRecord, EpisodePlayerHandle, EpisodePlan, AudioManifest } from '@contracts';
import { EpisodePlayer } from '../engine';
import { exportEpisode } from '../engine/exportFlow';
import { LiveController } from '../live';
import { api } from '../lib/api';
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
      characters: [],
      props: [],
      beats: [
        {
          beat_id: 'b1',
          speech: { type: 'NARRATE', text: 'Welcome to VoxFable!' },
          actions: []
        }
      ]
    }
  ]
};

export function EpisodeView({ episode, onReset, className = '' }: EpisodeViewProps) {
  const playerRef = useRef<EpisodePlayerHandle | null>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(episode.video_url || null);

  const plan: EpisodePlan = episode.plan || DEFAULT_FALLBACK_PLAN;
  const audio: AudioManifest | null = episode.audio_manifest || null;
  const isInteractive = Boolean(plan.interactive);

  const handleStartPlayback = () => {
    setHasStarted(true);
    playerRef.current?.play();
  };

  const handleReplay = () => {
    playerRef.current?.seek(0);
    playerRef.current?.play();
  };

  const handleDownloadMp4 = async () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }

    if (!playerRef.current) return;

    try {
      setIsExporting(true);
      setExportProgressText('Recording canvas stream at 720p...');

      const result = await exportEpisode({
        handle: playerRef.current,
        episodeId: episode.id,
        uploader: async (blob, epId) => {
          setExportProgressText('Uploading WebM to server converter...');
          const exp = await api.exportEpisode(epId, blob);
          return { exportId: exp.export_id };
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
            window.open(status.mp4_url, '_blank');
          } else if (status.status === 'failed' || attempts > 60) {
            clearInterval(pollInterval);
            setIsExporting(false);
            alert('Export failed during MP4 conversion.');
          }
        } catch {
          clearInterval(pollInterval);
          setIsExporting(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900">{plan.title || episode.title}</h2>
            {isInteractive && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-300">
                🎙 Interactive
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Age Band: <strong className="text-slate-700">{plan.age_band || '4-6'}</strong> &bull; Cast:{' '}
            <strong className="text-slate-700">
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

      {/* Main Video Canvas Area */}
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-800">
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
              onEnd={() => setHasStarted(false)}
            />

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
          </>
        )}
      </div>

      {/* Export status bar */}
      {isExporting && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2 animate-pulse">
          <p className="text-sm font-bold text-amber-900">{exportProgressText}</p>
          <p className="text-xs text-amber-700">Please keep this browser tab active during recording.</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
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
