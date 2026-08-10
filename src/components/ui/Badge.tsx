import React from 'react';

export interface BadgeProps {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'info' | 'purple' | 'amber';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'brand',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const variantStyles = {
    brand: 'bg-blue-50 text-[#004182] border-blue-100',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    amber: 'bg-amber-100/80 text-amber-950 border-amber-300',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-bold',
    md: 'text-xs px-2.5 py-1 rounded-full font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border whitespace-nowrap tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export interface StatusBadgeProps {
  status: 'verified' | 'active' | 'pending' | 'completed' | 'failed' | 'warning';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const config = {
    verified: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      defaultLabel: 'Verified SRU Student',
    },
    active: {
      bg: 'bg-blue-50 text-[#004182] border-blue-200',
      dot: 'bg-[#004182]',
      defaultLabel: 'Active',
    },
    pending: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
      defaultLabel: 'Pending Approval',
    },
    completed: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      dot: 'bg-emerald-600',
      defaultLabel: 'Completed',
    },
    failed: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      defaultLabel: 'Action Required',
    },
    warning: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      dot: 'bg-orange-500',
      defaultLabel: 'Warning',
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${current.bg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      <span>{label || current.defaultLabel}</span>
    </span>
  );
};
