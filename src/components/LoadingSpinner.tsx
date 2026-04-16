import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
}) => {
  const sizeMap = { sm: 24, md: 40, lg: 60 };
  const px = sizeMap[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        fill="none"
        className="animate-spin"
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          stroke="rgba(198,169,105,0.2)"
          strokeWidth="3"
        />
        <path
          d="M20 3 A17 17 0 0 1 37 20"
          stroke="#C6A969"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {text && (
        <p
          className="text-xs text-[#9A9A9A] tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {text}
        </p>
      )}
    </div>
  );
};
