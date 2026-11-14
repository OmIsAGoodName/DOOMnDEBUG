import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  children,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-900 dark:text-slate-100 bg-white dark:bg-midnight-900 shadow-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-rose-400 focus:ring-rose-400/50 focus:border-rose-500'
            : 'border-stone-300 dark:border-midnight-700 focus:ring-amber-500/30 focus:border-amber-500 dark:focus:ring-amber-400/25 dark:focus:border-amber-400'
        } ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
};
