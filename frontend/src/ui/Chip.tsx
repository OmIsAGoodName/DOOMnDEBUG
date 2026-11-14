import React from 'react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none active:scale-[0.97] ${
        selected
          ? 'bg-amber-500 text-slate-950 font-bold shadow-storybook-sm ring-2 ring-amber-400/40'
          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-midnight-800 dark:hover:bg-midnight-750 dark:text-slate-300 border border-stone-200/80 dark:border-midnight-700/80'
      } ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
