import React, { useRef, useState } from 'react';
import type { AudioManifest, ChoiceInfo, EpisodePlan } from '@contracts';
import { EpisodePlayer, type EpisodePlayerHandle } from '../engine';
import { useLiveChoices } from './useLiveChoices';

export interface LiveControllerProps {
  plan: EpisodePlan;
  audio: AudioManifest | null;
  onChoiceSelected?: (optionId: string) => void;
  onEnd?: () => void;
  className?: string;
}

export function LiveController({
  plan,
  audio,
  onChoiceSelected,
  onEnd,
  className = '',
}: LiveControllerProps) {
  const playerRef = useRef<EpisodePlayerHandle | null>(null);

  const [activeChoiceInfo, setActiveChoiceInfo] = useState<ChoiceInfo | null>(null);
  const [chosenHistory, setChosenHistory] = useState<string[]>([]);

  const handleChoiceReached = (choiceInfo: ChoiceInfo) => {
    setActiveChoiceInfo(choiceInfo);
  };

  const handleResolve = (optionId: string) => {
    setChosenHistory((prev) => [...prev, optionId]);
    playerRef.current?.resolveChoice(optionId);
    setActiveChoiceInfo(null);
    onChoiceSelected?.(optionId);
  };

  const {
    isListening,
    transcript,
    statusMessage,
    isThinking,
    hasMicSupport,
    handleResolveOption,
  } = useLiveChoices({
    choiceInfo: activeChoiceInfo,
    promptText: activeChoiceInfo?.choice.options.map((o) => o.label).join(' or ') || '',
    language: plan.language || 'en-US',
    onResolve: handleResolve,
  });

  const options = activeChoiceInfo?.choice.options || [];

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl mx-auto space-y-4 ${className}`}>
      {/* Visual Canvas Player */}
      <div className="w-full relative">
        <EpisodePlayer
          ref={playerRef}
          plan={plan}
          audio={audio}
          mode="live"
          onChoice={handleChoiceReached}
          onEnd={onEnd}
        />
      </div>

      {/* Choice & Speech Interaction Panel */}
      {activeChoiceInfo && (
        <div className="w-full bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              {/* Mic Status Ring */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-lg animate-pulse ring-4 ring-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="font-extrabold text-amber-400 text-base sm:text-lg">
                  {isThinking ? 'Listening to you...' : 'What should happen next?'}
                </p>
                <p className="text-xs text-slate-400">
                  {hasMicSupport
                    ? 'Say your choice into your microphone, or tap below!'
                    : 'Tap a button below to choose!'}
                </p>
              </div>
            </div>

            {/* Progress dot trail */}
            {chosenHistory.length > 0 && (
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className="text-xs text-slate-500 mr-1">Path:</span>
                {chosenHistory.map((ch, idx) => (
                  <span
                    key={idx}
                    className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"
                    title={`Choice ${idx + 1}: ${ch}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Heard Transcript Speech Bubble */}
          {transcript && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wide">
                I heard:
              </span>
              <span className="text-white font-medium text-sm italic">
                "{transcript}"
              </span>
            </div>
          )}

          {/* Status Alert Message */}
          {statusMessage && (
            <div className="text-xs font-semibold text-amber-300">
              {statusMessage}
            </div>
          )}

          {/* Big, Child-Friendly Tap Buttons (min-height 64px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {options.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => handleResolveOption(opt.id, 'tap')}
                className={`min-h-[64px] px-6 py-4 rounded-xl font-black text-base sm:text-lg tracking-wide shadow-xl flex items-center justify-between gap-3 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  i === 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 focus:ring-4 focus:ring-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 focus:ring-4 focus:ring-emerald-300'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-xl">
                  {i === 0 ? '✨' : '🚪'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveController;
