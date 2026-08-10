import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Shield, Sparkles, Layers, Award, CheckCircle2 } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto h-[420px] sm:h-[480px] flex items-center justify-center select-none perspective-1000">
      
      {/* Subtle Blueprint & Grid Background Layer */}
      <div 
        className="absolute inset-0 rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 opacity-90 shadow-xl overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(#004182 0.75px, transparent 0.75px), radial-gradient(#004182 0.75px, #ffffff 0.75px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 15px 15px',
          opacity: 0.15
        }}
      />

      {/* Outer Soft Light Glow Ring */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-blue-400/10 blur-3xl -z-10 animate-pulse pointer-events-none" />

      {/* 3D Geometric Depth Layer 1 - Tilted Canvas Base */}
      <motion.div
        initial={{ rotateX: 15, rotateY: -12, scale: 0.9, opacity: 0 }}
        animate={{ rotateX: [12, 16, 12], rotateY: [-10, -14, -10], scale: 1, opacity: 1 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-80 sm:w-96 h-80 sm:h-96 rounded-3xl bg-white/90 backdrop-blur-md border border-blue-200/80 shadow-2xl p-6 flex flex-col justify-between transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Top Header inside 3D Card */}
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono font-bold text-slate-400 ml-2">SRU-EXPO-2K26</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            09 OCT 2026
          </span>
        </div>

        {/* Center Blueprint Diagram */}
        <div className="my-auto space-y-4 text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#004182] to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Cpu className="w-10 h-10 animate-pulse" />
            </div>
            {/* Orbiting Ring */}
            <div className="absolute inset-0 -m-3 border-2 border-dashed border-blue-300 rounded-full animate-spin-slow opacity-60 pointer-events-none" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-[#004182] font-display uppercase tracking-tight">
              PRAGATHI 2K26
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              National Innovation Showcase
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              SRU Verified Free
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <Award className="w-3 h-3 text-amber-600" />
              ₹1.5 Lakh Prizes
            </span>
          </div>
        </div>

        {/* Bottom Specs Bar */}
        <div className="pt-3 border-t border-blue-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>SR University Campus</span>
          <span className="text-[#004182] font-bold">1–5 Members / Team</span>
        </div>
      </motion.div>

      {/* Floating Card 1 - Top Left: Neutral Event Details */}
      <motion.div
        initial={{ y: -20, x: -30, opacity: 0 }}
        animate={{ y: [-10, -22, -10], x: [-30, -25, -30], opacity: 1 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100 shadow-xl max-w-[200px] sm:max-w-[220px] pointer-events-none"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#004182]" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-[#004182] uppercase tracking-wide">PRAGATHI 2K26</div>
            <div className="text-xs font-bold text-slate-900 leading-snug">National Level Project Expo</div>
            <div className="text-[10px] text-slate-500 font-semibold">09 October 2026</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Card 2 - Bottom Right: Neutral Event Status */}
      <motion.div
        initial={{ y: 20, x: 30, opacity: 0 }}
        animate={{ y: [15, 25, 15], x: [25, 30, 25], opacity: 1 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-2 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100 shadow-xl max-w-[210px] sm:max-w-[230px] pointer-events-none"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">EVENT STATUS</div>
            <div className="text-xs font-bold text-slate-900 leading-snug">Registration Open</div>
            <div className="text-[10px] text-emerald-600 font-semibold">School & College Tracks</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Card 3 - Top Right Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ y: [0, -8, 0], scale: 1, opacity: 1 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-8 -right-2 sm:-right-6 bg-[#004182] text-white p-3 rounded-xl shadow-lg border border-blue-300/30 flex items-center gap-2 pointer-events-none"
      >
        <Shield className="w-5 h-5 text-amber-300 shrink-0" />
        <div>
          <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Expo Status</div>
          <div className="text-xs font-extrabold text-white">Registrations Open</div>
        </div>
      </motion.div>

      {/* Small Floating Floating Particle 1 */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-16 left-6 w-8 h-8 rounded-lg bg-blue-100/80 border border-blue-200 flex items-center justify-center text-[#004182] shadow-xs"
      >
        <Layers className="w-4 h-4" />
      </motion.div>

    </div>
  );
};
