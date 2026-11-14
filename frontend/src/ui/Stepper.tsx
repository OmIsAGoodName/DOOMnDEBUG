import React from 'react';

export const STAGES = [
  { key: 'understanding', label: 'Understanding your story' },
  { key: 'writing', label: 'Writing the script' },
  { key: 'planning', label: 'Planning the scenes' },
  { key: 'preparing', label: 'Preparing characters and locations' },
  { key: 'checking', label: 'Checking continuity and safety' },
  { key: 'narration', label: 'Generating narration' },
  { key: 'ready', label: 'Your episode is ready' }
] as const;

export interface StepperProps {
  currentStage?: string;
  progress?: number | null;
}

export const Stepper: React.FC<StepperProps> = ({ currentStage = 'understanding', progress }) => {
  const currentIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.key === currentStage)
  );

  return (
    <div className="w-full space-y-4">
      {progress != null && progress > 0 && (
        <div className="w-full bg-stone-100 dark:bg-midnight-900 rounded-full h-2 overflow-hidden border border-stone-200/60 dark:border-midnight-700/60">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-300 shadow-lantern-glow-sm"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      <div className="space-y-2.5">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-meadow-500 text-white shadow-storybook-sm'
                    : isCurrent
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/25 dark:ring-amber-400/20 shadow-lantern-glow-sm font-extrabold'
                    : 'bg-stone-200 dark:bg-midnight-800 text-stone-500 dark:text-slate-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-bold text-stone-900 dark:text-slate-100'
                    : isDone
                    ? 'font-medium text-stone-600 dark:text-slate-300'
                    : 'text-stone-400 dark:text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
