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
      className={`bg-white dark:bg-midnight-800/90 rounded-2xl border border-stone-200/90 dark:border-midnight-700/70 shadow-storybook-sm dark:shadow-storybook transition-all duration-200 text-stone-900 dark:text-slate-100 backdrop-blur-xs ${
        hoverEffect
          ? 'hover:shadow-storybook dark:hover:shadow-storybook-hover hover:border-stone-300 dark:hover:border-midnight-600 active:scale-[0.995]'
          : ''
      } ${pad} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
