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
    <div className="ev-field-wrap">
      {label && (
        <label htmlFor={id} className="ev-label">
          {label}
        </label>
      )}
      <div className={icon ? 'ev-input-icon-wrap' : ''} style={{ position: icon ? 'relative' : undefined }}>
        {icon && (
          <span className="ev-input-icon">{icon}</span>
        )}
        <input
          id={id}
          className={['ev-input', error ? 'ev-input-error' : '', className].filter(Boolean).join(' ')}
          style={icon ? { paddingLeft: 38 } : undefined}
          {...props}
        />
      </div>
      {error && <p className="ev-field-error">{error}</p>}
      {helper && !error && <p className="ev-field-hint">{helper}</p>}
    </div>
  );
};
