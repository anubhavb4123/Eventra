import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold tracking-widest uppercase text-[#9A9A9A]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-[#F87171] focus:border-[#F87171]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-[#F87171]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-[11px] text-[#6a6a6a]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {helper}
        </p>
      )}
    </div>
  );
};
