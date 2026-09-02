import React from 'react';
import { getDomainTheme, DomainTheme } from './DomainThemes';

export interface DomainCardProps {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  iconName?: string;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  id,
  title,
  description,
  badgeText,
}) => {
  const theme: DomainTheme = getDomainTheme(id, title);

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] p-6 sm:p-7 border ${theme.borderColor} ${theme.cardBg} ${theme.hoverBorder} shadow-xs hover:shadow-xl hover:-translate-y-1.5 active:translate-y-0 motion-reduce:hover:translate-y-0 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default h-full`}
    >
      {/* Subtle Domain-Specific Background Illustration */}
      <div
        className="absolute -bottom-2 -right-2 w-36 h-36 sm:w-40 sm:h-40 pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity duration-300 z-0 select-none"
        aria-hidden="true"
      >
        {theme.illustration}
      </div>

      {/* Ambient Soft Radial Glow */}
      <div
        className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300 z-0 ${theme.accentGlow}`}
        aria-hidden="true"
      />

      {/* Foreground Content */}
      <div className="relative z-10 space-y-4">
        {/* Top Header: Icon Container + Track Badge */}
        <div className="flex items-center justify-between gap-3">
          <div
            className={`w-12 h-12 rounded-2xl ${theme.iconBg} ${theme.iconColor} ${theme.iconHoverBg} flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 shrink-0`}
          >
            {theme.icon}
          </div>

          <span
            className={`text-[11px] font-bold ${theme.badgeBg} ${theme.badgeColor} ${theme.badgeBorder} px-3 py-1 rounded-full border shadow-2xs text-right whitespace-nowrap`}
          >
            {badgeText}
          </span>
        </div>

        {/* Domain Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#004182] transition-colors leading-snug font-display">
          {title}
        </h3>

        {/* Domain Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Bottom Accent Highlight Strip */}
      <div className="relative z-10 pt-4 mt-4 border-t border-slate-100/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${theme.accentBar} opacity-60 group-hover:opacity-100 transition-opacity`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
            National Track
          </span>
        </div>
        <div className={`w-8 h-1 rounded-full ${theme.accentBar} opacity-20 group-hover:opacity-70 group-hover:w-12 transition-all duration-300`} />
      </div>
    </div>
  );
};
