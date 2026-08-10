import React from 'react';

export interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Display: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h1' }) => (
  <Component className={`font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#004182] uppercase tracking-tight leading-tight ${className}`}>
    {children}
  </Component>
);

export const Heading: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h2' }) => (
  <Component className={`font-display font-bold text-2xl sm:text-3xl text-[#004182] uppercase tracking-tight leading-snug ${className}`}>
    {children}
  </Component>
);

export const Subheading: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h3' }) => (
  <Component className={`font-display font-semibold text-lg sm:text-xl text-slate-800 tracking-tight ${className}`}>
    {children}
  </Component>
);

export const Body: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p' }) => (
  <Component className={`font-sans text-sm sm:text-base text-slate-600 leading-relaxed ${className}`}>
    {children}
  </Component>
);

export const Caption: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span' }) => (
  <Component className={`font-sans text-xs text-slate-400 font-medium ${className}`}>
    {children}
  </Component>
);

export const Label: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span' }) => (
  <Component className={`font-sans text-xs font-bold text-slate-700 tracking-wide ${className}`}>
    {children}
  </Component>
);
