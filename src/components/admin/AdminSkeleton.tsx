import React from 'react';

/**
 * Centered Auth Loading screen displayed while verifying user session.
 */
export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      {/* Brand Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[#004182] text-white flex items-center justify-center font-bold font-display text-xl shadow-md shadow-blue-900/10 animate-pulse">
        SR
      </div>

      <div className="space-y-1">
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#004182] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
          PRAGATHI 2K26
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 font-display">
          Admin Portal
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Loading admin dashboard...
        </p>
      </div>

      {/* Spinner */}
      <div className="pt-2">
        <div className="w-8 h-8 border-3 border-blue-100 border-t-[#004182] rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
};

/**
 * Skeleton placeholder for individual Stat Card on Dashboard.
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-slate-100" />
        <div className="w-4 h-4 rounded bg-slate-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-7 w-16 bg-slate-200 rounded-lg" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
    </div>
  );
};

/**
 * Fallback loader for Lazy-Loaded Admin Routes inside AdminLayout.
 */
export const AdminPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-2">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-8 w-3/4 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
