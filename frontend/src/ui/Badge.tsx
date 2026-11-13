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
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isReview
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-rose-100 text-rose-800 border-rose-300';

  const label = isPass ? '✓ Child-Safe' : isReview ? '⚠️ Needs Review' : '✕ Safety Flagged';

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
    ? 'bg-sky-100 text-sky-800 border-sky-300'
    : 'bg-amber-100 text-amber-800 border-amber-300';

  return (
    <div
      title={
        violations.length > 0
          ? `Continuity checks: ${violations.join('; ')}`
          : 'Zero continuity violations detected'
      }
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-help ${color}`}
    >
      <span>{isClean ? '✨ Continuity Verified' : `🔧 ${violations.length} Continuity Checks`}</span>
    </div>
  );
};
