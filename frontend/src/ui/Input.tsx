import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 dark:text-slate-100 bg-white dark:bg-midnight-900/90 placeholder:text-stone-400 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-rose-400 focus:ring-rose-400/50 focus:border-rose-500'
            : 'border-stone-300 dark:border-midnight-700 focus:ring-amber-500/30 focus:border-amber-500 dark:focus:ring-amber-400/25 dark:focus:border-amber-400'
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};
