import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const px = size === 'sm' ? 24 : size === 'lg' ? 56 : 40;
  const sw = size === 'sm' ? 2.5 : 3;

  return (
    <div className="ev-spinner-wrap">
      <svg width={px} height={px} viewBox="0 0 40 40" fill="none" className="ev-spinner">
        <circle cx="20" cy="20" r="16" stroke="rgba(198,169,105,0.15)" strokeWidth={sw} />
        <path
          d="M20 4 A16 16 0 0 1 36 20"
          stroke="url(#spinner-grad)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C6A969" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
      </svg>
      {text && (
        <p className="ev-spinner-text">{text}</p>
      )}
    </div>
  );
};
