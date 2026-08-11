import React, { useState, useEffect } from 'react';
import { useContent } from '../context/ContentContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC = () => {
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
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        {timeBlocks.map((block) => (
          <div
            key={block.label}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="text-xl sm:text-3xl font-extrabold text-blue-900 font-display tracking-tight">
              {String(block.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-600/80 mt-0.5">
              {block.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
