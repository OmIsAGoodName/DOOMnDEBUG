import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'big-kid';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5 min-h-[48px]'
  }[size];

  const variantClasses = {
    primary:
      'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold shadow-storybook-sm hover:shadow-lantern-glow-sm active:scale-[0.98] border-t border-amber-300/50 focus:ring-amber-400',
    secondary:
      'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/90 dark:bg-midnight-800 dark:hover:bg-midnight-750 dark:text-slate-100 dark:border-midnight-700/80 shadow-storybook-sm active:scale-[0.98] focus:ring-stone-400',
    ghost:
      'bg-transparent hover:bg-stone-200/60 dark:hover:bg-midnight-750/70 text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white active:scale-[0.98] focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-storybook-sm active:scale-[0.98] focus:ring-rose-500',
    'big-kid':
      'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-lg px-8 py-4 rounded-2xl shadow-storybook hover:shadow-lantern-glow active:scale-[0.98] border-t border-white/40 border-b-2 border-amber-600 focus:ring-amber-400 min-h-[58px]'
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
