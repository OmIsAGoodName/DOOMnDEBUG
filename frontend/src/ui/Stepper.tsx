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
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-bold text-slate-900'
                    : isDone
                    ? 'font-medium text-slate-600'
                    : 'text-slate-400'
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
