import React from 'react';
import { haptic } from '@/lib/haptics';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  style,
  onClick,
  ...props
}) => {
  const variantCls = {
    primary: 'ev-btn ev-btn-primary',
    secondary: 'ev-btn ev-btn-secondary',
    ghost: 'ev-btn ev-btn-ghost',
    danger: 'ev-btn ev-btn-danger',
  }[variant];

  const sizeCls = { sm: 'ev-btn-sm', md: '', lg: 'ev-btn-lg' }[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptic.medium();
    if (onClick) onClick(e);
  };

  return (
    <button
      className={[variantCls, sizeCls, fullWidth ? 'ev-btn-full' : '', className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      style={style}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <svg width={15} height={15} viewBox="0 0 40 40" fill="none" style={{ animation: 'ev-spin 1s linear infinite', flexShrink: 0 }}>
          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth={3} strokeOpacity={0.25} />
          <path d="M20 4 A16 16 0 0 1 36 20" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
        </svg>
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
