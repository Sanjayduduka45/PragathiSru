import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Variant classes using SRU brand identity
    const variantStyles = {
      primary:
        'bg-[#004182] hover:bg-[#003366] text-white shadow-md shadow-blue-950/10 border border-transparent focus-visible:ring-2 focus-visible:ring-[#004182] focus-visible:ring-offset-2',
      secondary:
        'bg-[#F0F5FA] hover:bg-blue-100/70 text-[#004182] font-semibold border border-blue-100 focus-visible:ring-2 focus-visible:ring-[#004182] focus-visible:ring-offset-2',
      outline:
        'bg-white hover:bg-blue-50/50 text-[#004182] border border-[#004182]/30 hover:border-[#004182] focus-visible:ring-2 focus-visible:ring-[#004182] focus-visible:ring-offset-2',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-[#004182] focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2',
    };

    // Size classes conforming to exact padding ratios
    const sizeStyles = {
      sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5 font-semibold',
      md: 'px-5 py-2.5 text-sm rounded-full gap-2 font-bold',
      lg: 'px-7 py-3.5 text-base rounded-full gap-2.5 font-bold',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { y: -1, scale: 1.005 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-colors duration-150 sru-focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span className="whitespace-nowrap">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
