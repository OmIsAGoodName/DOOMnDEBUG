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
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${pad} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
