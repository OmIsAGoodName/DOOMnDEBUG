import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  }[size];

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClass} animate-spin rounded-full border-stone-200 dark:border-midnight-700 border-t-amber-500 dark:border-t-amber-400`}
      />
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = '📖'
}) => {
  return (
    <div className="text-center py-12 px-6 max-w-md mx-auto space-y-3.5">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 flex items-center justify-center text-3xl select-none shadow-storybook-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold font-display text-stone-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export const VoxFableLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Speech bubble */}
      <path
        d="M24 6C13.5 6 5 13.6 5 23C5 28.5 7.9 33.3 12.5 36.3L10 43L18 39.5C19.9 40 21.9 40.2 24 40.2C34.5 40.2 43 32.5 43 23.1C43 13.6 34.5 6 24 6Z"
        fill="#4F46E5"
      />
      {/* Golden star sparkle inside */}
      <path
        d="M24 14L26.5 20.5L33 21.5L28 26L29.5 32.5L24 29L18.5 32.5L20 26L15 21.5L21.5 20.5L24 14Z"
        fill="#FBBF24"
      />
    </svg>
  );
};
