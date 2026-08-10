import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'standard' | 'glass' | 'glassDark' | 'outlined';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  hoverEffect = true,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8 sm:p-10',
  };

  const variantStyles = {
    standard:
      'bg-white border border-slate-100 rounded-3xl sru-depth-shadow-sm text-slate-900',
    glass:
      'glass-panel rounded-3xl text-slate-900 shadow-sm',
    glassDark:
      'glass-panel-dark rounded-3xl shadow-xl',
    outlined:
      'bg-white border border-slate-200 rounded-3xl text-slate-900',
  };

  const hoverMotion = hoverEffect
    ? {
        whileHover: { y: -2, transition: { duration: 0.2, ease: 'easeOut' } },
      }
    : {};

  return (
    <motion.div
      {...hoverMotion}
      className={`transition-shadow duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hoverEffect ? 'hover:shadow-md' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StandardCard = Card;

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="glass" {...props} />
);

export const GlassDarkCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="glassDark" {...props} />
);
