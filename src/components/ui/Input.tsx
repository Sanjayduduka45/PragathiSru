import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`flex flex-col space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold text-slate-700 font-sans">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full text-sm font-medium text-slate-900 bg-white border rounded-xl transition-all duration-150 sru-focus-ring placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-200 focus:border-[#004182] focus:ring-1 focus:ring-[#004182]'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
