import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 z-0" />

        {/* Animated Active Fill Line */}
        <motion.div
          className="absolute top-4 left-6 h-0.5 bg-[#004182] z-0"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%`,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />

        {/* Step Nodes */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                onClick={() => onStepClick && isCompleted && onStepClick(index)}
                disabled={!onStepClick || !isCompleted}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer sru-focus-ring ${
                  isCompleted
                    ? 'bg-[#004182] text-white shadow-xs'
                    : isActive
                    ? 'bg-white border-2 border-[#004182] text-[#004182] shadow-md ring-4 ring-blue-50'
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
              </button>

              <span
                className={`mt-2 text-xs font-bold text-center max-w-[90px] hidden sm:block ${
                  isActive
                    ? 'text-[#004182]'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  className = '',
}) => {
  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-[#004182]">{clampedProgress}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightStyles[size]}`}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[#004182] to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
