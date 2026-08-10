import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      showCount = false,
      maxLength,
      fullWidth = true,
      className = '',
      id,
      value,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`flex flex-col space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="text-xs font-bold text-slate-700 font-sans">
              {label}
              {props.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[10px] font-semibold text-slate-400">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          className={`w-full text-sm font-medium text-slate-900 bg-white border rounded-xl p-3.5 transition-all duration-150 sru-focus-ring placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-200 focus:border-[#004182] focus:ring-1 focus:ring-[#004182]'
          } ${className}`}
          {...props}
        />

        {error ? (
          <span className="text-xs font-semibold text-rose-600 animate-in fade-in duration-150">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 font-medium">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
