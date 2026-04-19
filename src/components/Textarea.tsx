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
    <div className="ev-field-wrap">
      {label && (
        <label htmlFor={id} className="ev-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={['ev-input', error ? 'ev-input-error' : '', className].filter(Boolean).join(' ')}
        rows={4}
        style={{ resize: 'vertical' }}
        {...props}
      />
      {error && <p className="ev-field-error">{error}</p>}
      {helper && !error && <p className="ev-field-hint">{helper}</p>}
    </div>
  );
};
