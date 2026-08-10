import React from 'react';
import { Clock } from 'lucide-react';

interface AdminComingSoonProps {
  module: string;
}

export const AdminComingSoon: React.FC<AdminComingSoonProps> = ({ module }) => (
  <div className="max-w-lg mx-auto pt-16 text-center space-y-5">
    <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto">
      <Clock className="w-8 h-8 text-amber-500" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-extrabold text-slate-900">{module}</h2>
      <p className="text-sm text-slate-500 leading-relaxed">
        This module is under development and will be available in a future release. The foundation
        for this feature has been planned and will be implemented when ready.
      </p>
    </div>
    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
      <Clock className="w-3.5 h-3.5" />
      Coming Soon
    </span>
  </div>
);
