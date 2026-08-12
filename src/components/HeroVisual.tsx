import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Subtle Soft Ambient Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/15 via-blue-400/10 to-transparent rounded-[36px] blur-2xl -z-10 pointer-events-none" />

      {/* Hero Visual Container with Photographic Background & Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full rounded-[28px] sm:rounded-[32px] overflow-hidden border border-slate-200/80 shadow-2xl shadow-blue-950/20 bg-slate-900 min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex flex-col justify-end p-6 sm:p-8 lg:p-10 group"
      >
        {/* Real Event Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transform group-hover:scale-[1.015] transition-transform duration-700 ease-out"
          style={{ backgroundImage: `url('/event-memories/IMG_7368.JPG')` }}
        />

        {/* Translucent Navy Blue Gradient Overlay for High Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/90 via-[#002852]/40 to-[#00152e]/30 transition-opacity duration-300" />

        {/* Crisp Overlayed Content */}
        <div className="relative z-10 space-y-3.5 text-white max-w-lg">
          {/* Subtle Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>NATIONAL EXPO HIGHLIGHTS</span>
          </div>

          {/* Overlay Main Heading */}
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase font-display drop-shadow-md">
            PRAGATHI 2K26
          </h3>

          {/* Subtitle / Event Description */}
          <p className="text-sm sm:text-base font-semibold text-blue-100/90 leading-snug drop-shadow-xs">
            National Level Project Expo • SR University
          </p>

          {/* Tagline Quote */}
          <div className="pt-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 italic tracking-wide">
            <span>“ Innovate. Create. Inspire. ”</span>
          </div>
        </div>

        {/* Subtle Inset Outline */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-[28px] sm:rounded-[32px] pointer-events-none" />
      </motion.div>
    </div>
  );
};
