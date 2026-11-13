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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
        selected
          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      } ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
