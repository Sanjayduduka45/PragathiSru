import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message,
  details,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 sm:p-8 bg-rose-50/50 border border-rose-200/80 rounded-3xl text-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-rose-950 font-display uppercase">{title}</h3>
        <p className="text-xs sm:text-sm text-rose-800 font-medium leading-relaxed">{message}</p>
        {details && (
          <p className="text-[11px] text-slate-500 font-mono bg-white/80 p-2.5 rounded-xl border border-rose-100/60 mt-2 text-left overflow-x-auto">
            {details}
          </p>
        )}
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
