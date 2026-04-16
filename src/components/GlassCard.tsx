import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  hover = true,
  glow = false,
  padding = 'md',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`glass-card ${paddingClasses[padding]} ${hover ? '' : 'hover:border-[rgba(198,169,105,0.15)] hover:shadow-none'} ${glow ? 'animate-pulse-glow' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
