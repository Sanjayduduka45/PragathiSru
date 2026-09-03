import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useContent } from '../context/ContentContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC = React.memo(() => {
  const { eventSettings } = useContent();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const targetIso = eventSettings.targetDateISO || "2026-10-09T09:00:00+05:30";
      const targetDate = new Date(targetIso).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (isNaN(targetDate) || difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [eventSettings.targetDateISO]);

  const timeBlocks = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="w-full max-w-xl mx-auto lg:mx-0 my-2.5 sm:my-3.5">
      {/* Main Container */}
      <div className="relative bg-white rounded-[18px] sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-md shadow-slate-900/5 border-b-2 border-b-amber-400/80">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#004182] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span>EVENT STARTS IN</span>
          </div>
          {/* Subtle gold decorative divider */}
          <div className="w-20 sm:w-24 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-1.5 sm:mt-2" />
        </div>

        {/* 4 Time Unit Cards */}
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          {timeBlocks.map((block, idx) => (
            <React.Fragment key={block.label}>
              {/* Time Card */}
              <div className="flex-1 min-w-0 bg-slate-50/70 hover:bg-white rounded-[10px] sm:rounded-xl p-2 sm:p-3 text-center border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all duration-200 group">
                <div className="text-xl sm:text-3xl font-extrabold text-[#004182] font-display tracking-tight leading-tight">
                  {String(block.value).padStart(2, '0')}
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#004182]/80 mt-0.5 sm:mt-1 truncate">
                  {block.label}
                </div>
                {/* Gold Accent Line */}
                <div className="w-4 sm:w-6 h-[2px] bg-amber-400/80 rounded-full mx-auto mt-1 sm:mt-1.5" />
              </div>

              {/* Colon Separator (between cards) */}
              {idx < timeBlocks.length - 1 && (
                <div className="text-slate-300 font-bold text-sm sm:text-lg select-none px-0.5">
                  :
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
});
