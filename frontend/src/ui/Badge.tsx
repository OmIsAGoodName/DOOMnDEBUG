import React from 'react';

export interface SafetyBadgeProps {
  status?: 'pass' | 'needs_review' | 'fail' | string;
  ageFit?: number | string;
  scary?: number;
  notes?: string;
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
  status = 'pass',
  ageFit,
  scary,
  notes
}) => {
  const isPass = status === 'pass';
  const isReview = status === 'needs_review';

  const color = isPass
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
    : isReview
    ? 'bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
    : 'bg-rose-50 text-rose-800 border-rose-300/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60';

  const label = isPass ? '✓ Child-Safe' : isReview ? 'Needs Review' : 'Safety Flagged';

  const tooltip = notes
    ? `Safety Notes: ${notes}`
    : `Age Fit: ${ageFit ?? 'Appropriate'} • Scary: ${scary ?? '0'}/10`;

  return (
    <div
      title={tooltip}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-help ${color}`}
    >
      <span>{label}</span>
      {ageFit != null && <span className="opacity-75 font-normal">({String(ageFit)})</span>}
    </div>
  );
};

export interface ContinuityBadgeProps {
  violations?: string[];
}

export const ContinuityBadge: React.FC<ContinuityBadgeProps> = ({
  violations = []
}) => {
  const isClean = violations.length === 0;

  const color = isClean
    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-midnight-750 dark:text-indigo-300 dark:border-indigo-800/60'
    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';

  return (
    <div
      title={
        violations.length > 0
          ? `Continuity checks: ${violations.join('; ')}`
          : 'Zero continuity violations detected'
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-help ${color}`}
    >
      <span>{isClean ? 'Continuity Verified' : `${violations.length} Continuity Checks`}</span>
    </div>
  );
};
