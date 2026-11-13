import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const pad = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[padding];

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all text-slate-900 dark:text-slate-100 ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${pad} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
