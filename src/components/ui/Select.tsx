import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      options,
      children,
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`flex flex-col space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-bold text-slate-700 font-sans">
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

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full text-sm font-medium text-slate-900 bg-white border rounded-xl appearance-none transition-all duration-150 sru-focus-ring disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } pr-10 py-2.5 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-200 focus:border-[#004182] focus:ring-1 focus:ring-[#004182]'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3.5 text-slate-400 pointer-events-none shrink-0 flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
