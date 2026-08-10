import React from 'react';
import { motion } from 'motion/react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-8 sm:p-12 text-center bg-white border border-slate-100 rounded-3xl sru-depth-shadow-sm flex flex-col items-center max-w-lg mx-auto space-y-5 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-blue-50/80 border border-blue-100/70 text-[#004182] flex items-center justify-center shadow-xs">
        {icon || <Inbox className="w-8 h-8 text-[#004182]" />}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-xl font-bold text-[#004182] font-display uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};
