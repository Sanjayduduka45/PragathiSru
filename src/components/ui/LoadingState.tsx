import React from 'react';
import { motion } from 'motion/react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
      <div className="relative">
        {/* Outer Ring */}
        <div
          className={`rounded-full border-slate-200 border-t-[#004182] animate-spin ${sizeStyles[size]}`}
        />
        {/* Inner SR Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-extrabold text-[#004182] font-display uppercase tracking-wider">
            SR
          </span>
        </div>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-bold text-slate-500 font-sans tracking-wide"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-slate-200/70 animate-pulse rounded-xl ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
};
