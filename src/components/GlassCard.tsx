import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: boolean;
  accent?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  hover = true,
  glow = false,
  accent = false,
  padding = 'md',
}) => {
  const paddingMap = { none: '', sm: 'ev-card-p-sm', md: 'ev-card-p-md', lg: 'ev-card-p-lg', xl: 'ev-card-p-xl' };

  return (
    <div
      className={[
        'ev-card',
        paddingMap[padding],
        accent ? 'ev-card-accent' : '',
        glow ? 'ev-pulse-dot' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        cursor: hover ? undefined : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
