import React, { useRef, useState, useEffect } from 'react';
import type { ChoiceInfo, EpisodePlan } from '@contracts';
import { EpisodePlayer, type EpisodePlayerHandle, resolveTimeline } from '../index';
import quickDemoPlan from '@fixtures/episode_quick_demo.json';
import liveDemoPlan from '@fixtures/episode_live_demo.json';

export default function EngineHarness() {
  const playerRef = useRef<EpisodePlayerHandle | null>(null);

  const [selectedFixture, setSelectedFixture] = useState<'quick' | 'live' | 'custom'>('quick');
  const [customJson, setCustomJson] = useState('');
  const [useAudio, setUseAudio] = useState(false);
  const [mode, setMode] = useState<'watch' | 'live'>('watch');
  const [captions, setCaptions] = useState(true);
  const [muted, setMuted] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChoice, setActiveChoice] = useState<ChoiceInfo | null>(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(1.2);

  // Compute active plan
  let activePlan: EpisodePlan = quickDemoPlan as unknown as EpisodePlan;
  if (selectedFixture === 'live') {
    activePlan = liveDemoPlan as unknown as EpisodePlan;
  } else if (selectedFixture === 'custom') {
    try {
      if (customJson) activePlan = JSON.parse(customJson);
    } catch {
      // fallback
    }
  }

  // Pre-resolve timeline for markers
  const timeline = resolveTimeline(activePlan, null);

  useEffect(() => {
    setDuration(timeline.totalDuration);
    setCurrentTime(0);
    setActiveChoice(null);
  }, [selectedFixture, customJson]);

  // Polling clock for UI scrub slider & metrics
  useEffect(() => {
    let lastT = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const interval = setInterval(() => {
      if (playerRef.current) {
        const t = playerRef.current.getTime();
        setCurrentTime(t);
        setDuration(playerRef.current.getDuration());

        const now = performance.now();
        const delta = now - lastT;
        lastT = now;
        setFrameTimeMs(Number(delta.toFixed(1)));
        frameCount++;

        if (now - lastFpsUpdate >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastFpsUpdate = now;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (newT: number) => {
    playerRef.current?.seek(newT);
    setCurrentTime(newT);
  };

  const handleStartRecording = () => {
    setRecordedBlobUrl(null);
    setIsRecording(true);
    playerRef.current?.startRecording();
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const blob = await playerRef.current?.stopRecording();
    if (blob) {
      const url = URL.createObjectURL(blob);
      setRecordedBlobUrl(url);
    }
  };

  const handleLogTimeline = () => {
    console.log('[Dev Harness] Resolved Timeline:', timeline);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-amber-400">
            Engine Dev Harness (/dev/engine)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pure Canvas 2D engine testing: timeline resolution, scrubbing, audio sync, and recording.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogTimeline}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition"
          >
            Log Resolved Timeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Player Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <EpisodePlayer
              ref={playerRef}
              plan={activePlan}
              audio={null}
              mode={mode}
              captions={captions}
              muted={muted}
              onChoice={(c) => {
                console.log('[Harness] Choice requested:', c);
                setActiveChoice(c);
              }}
              onEnd={() => {
                console.log('[Harness] Episode ended');
                setIsPlaying(false);
              }}
            />

            {/* In-canvas Debug Overlay */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1 shadow-lg pointer-events-none">
              <div className="text-amber-400 font-bold">Engine Debug Overlay</div>
              <div>t: <span className="text-white font-semibold">{currentTime.toFixed(2)}s</span> / {duration.toFixed(2)}s</div>
              <div>fps: <span className="text-emerald-400">{fps}</span> | frame: {frameTimeMs}ms</div>
              <div>scenes: {timeline.scenes.length} | beats: {timeline.beats.length}</div>
              <div>mode: {mode} | choice: {activeChoice ? 'LISTENING' : 'idle'}</div>
            </div>
          </div>

          {/* Playback Controls & Scrubber */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{currentTime.toFixed(2)}s</span>
                <span className="font-semibold text-slate-300">{activePlan.title}</span>
                <span>{duration.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.05"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              {/* Scene / Beat tick marks */}
              <div className="relative h-2 w-full flex">
                {timeline.scenes.map((sc, i) => (
                  <div
                    key={sc.sceneId}
                    style={{
                      left: `${(sc.startTime / (duration || 1)) * 100}%`,
                      width: `${(sc.duration / (duration || 1)) * 100}%`,
                    }}
                    className={`absolute top-0 h-1 border-r border-slate-700 ${
                      i % 2 === 0 ? 'bg-amber-500/20' : 'bg-blue-500/20'
                    }`}
                    title={`${sc.sceneId} (${sc.duration.toFixed(1)}s)`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={() => handleSeek(0)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
                >
                  Restart
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captions}
                    onChange={(e) => setCaptions(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Captions</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={muted}
                    onChange={(e) => setMuted(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Mute</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-slate-400">Mode:</span>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'watch' | 'live')}
                    className="bg-slate-800 text-white rounded px-2 py-1 border border-slate-700"
                  >
                    <option value="watch">Watch (Auto-resolve)</option>
                    <option value="live">Live (Interactive)</option>
                  </select>
                </label>
              </div>

              {/* Recording controls */}
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Record WebM
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-rose-300 font-semibold rounded-lg text-xs"
                  >
                    Stop Recording
                  </button>
                )}
                {recordedBlobUrl && (
                  <a
                    href={recordedBlobUrl}
                    download="voxfable-episode.webm"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
                  >
                    Download WebM
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Choice Prompt when listening */}
          {activeChoice && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 space-y-3">
              <div className="text-amber-300 font-bold text-sm">
                Live Choice Point Active:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeChoice.choice.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      playerRef.current?.resolveChoice(opt.id);
                      setActiveChoice(null);
                      setIsPlaying(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow transition"
                  >
                    {opt.label} ({opt.id})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configuration Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Episode Fixture
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="fixture"
                  value="quick"
                  checked={selectedFixture === 'quick'}
                  onChange={() => setSelectedFixture('quick')}
                  className="accent-amber-500"
                />
                <span>Quick Demo (Pip Learns to Share)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="fixture"
                  value="live"
                  checked={selectedFixture === 'live'}
                  onChange={() => setSelectedFixture('live')}
                  className="accent-amber-500"
                />
                <span>Live Demo (Pip and the Glowing Door)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="fixture"
                  value="custom"
                  checked={selectedFixture === 'custom'}
                  onChange={() => setSelectedFixture('custom')}
                  className="accent-amber-500"
                />
                <span>Paste Custom JSON</span>
              </label>
            </div>

            {selectedFixture === 'custom' && (
              <textarea
                value={customJson}
                onChange={(e) => setCustomJson(e.target.value)}
                placeholder="Paste EpisodePlan JSON here..."
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300"
              />
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-slate-400">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Cast &amp; Scenes Breakdown
            </h2>
            <div>
              <span className="font-semibold text-slate-200">Cast:</span>{' '}
              {activePlan.cast.map((c) => `${c.name} (${c.species})`).join(', ')}
            </div>
            <div>
              <span className="font-semibold text-slate-200">Scenes:</span>{' '}
              {timeline.scenes.map((s) => s.sceneId).join(' -> ')}
            </div>
            <div>
              <span className="font-semibold text-slate-200">Estimated Duration:</span>{' '}
              {timeline.totalDuration.toFixed(1)}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
