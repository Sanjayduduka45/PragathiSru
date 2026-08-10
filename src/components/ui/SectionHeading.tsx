import React from 'react';
import { motion } from 'motion/react';

export interface SectionHeadingProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const alignmentStyles = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  return (
    <div className={`flex flex-col max-w-3xl space-y-2.5 ${alignmentStyles[align]} ${className}`}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100/70"
        >
          {eyebrowIcon && <span className="shrink-0">{eyebrowIcon}</span>}
          <span>{eyebrow}</span>
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-2xl sm:text-4xl font-extrabold text-[#004182] font-display tracking-tight leading-none uppercase"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
