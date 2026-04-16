import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helper,
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
      <textarea
        id={id}
        className={`input-field resize-none ${error ? 'border-[#F87171]' : ''} ${className}`}
        rows={4}
        {...props}
      />
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
