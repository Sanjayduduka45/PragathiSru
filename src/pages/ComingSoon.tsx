import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Clock,
  Sparkles,
  ArrowLeft,
  LayoutDashboard,
  FolderKanban,
  Award,
  FileCheck,
  ShieldCheck,
  Lock,
  Layers,
  HelpCircle,
  PhoneCall,
  Calendar,
  FileText,
  UserCheck,
  Cpu,
  Boxes,
} from 'lucide-react';
import { FUTURE_MODULES } from '../utils/constants';

export const ComingSoon: React.FC = () => {
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('module') || searchParams.get('feature') || '';

  // Look up module or fall back gracefully
  const matchedModule = FUTURE_MODULES.find(
    (m) => m.id.toLowerCase() === moduleId.toLowerCase() || m.name.toLowerCase() === moduleId.toLowerCase()
  );

  const featureName = matchedModule?.name || (moduleId ? moduleId.replace(/[-_]/g, ' ') : 'Digital Platform Feature');
  const featureDescription = matchedModule?.description || 'This official feature is under active development for PRAGATHI 2K26.';

  const getModuleIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case 'dashboard':
        return <LayoutDashboard className="w-8 h-8 text-[#004182]" />;
      case 'projects':
        return <FolderKanban className="w-8 h-8 text-[#004182]" />;
      case 'categories':
        return <Layers className="w-8 h-8 text-[#004182]" />;
      case 'schedule':
        return <Calendar className="w-8 h-8 text-[#004182]" />;
      case 'rules':
        return <FileText className="w-8 h-8 text-[#004182]" />;
      case 'faq':
        return <HelpCircle className="w-8 h-8 text-[#004182]" />;
      case 'contact':
        return <PhoneCall className="w-8 h-8 text-[#004182]" />;
      case 'results':
        return <Award className="w-8 h-8 text-[#004182]" />;
      case 'certificates':
        return <FileCheck className="w-8 h-8 text-[#004182]" />;
      case 'login':
        return <UserCheck className="w-8 h-8 text-[#004182]" />;
      case 'admin':
      case 'judge':
        return <ShieldCheck className="w-8 h-8 text-[#004182]" />;
      default:
        return <Clock className="w-8 h-8 text-[#004182]" />;
    }
  };

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 bg-white">
      
      {/* Top Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors bg-blue-50/80 px-3.5 py-1.5 rounded-full border border-blue-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO HOME</span>
        </Link>
      </div>

      {/* Hero 3D Animated Visual Container */}
      <div className="relative bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 rounded-3xl border border-blue-100 shadow-xl p-8 sm:p-12 text-center overflow-hidden">
        
        {/* Subtle Background Blueprint Grid */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#004182 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Floating Shapes Animation Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-6 left-10 w-12 h-12 rounded-2xl bg-blue-200/30 backdrop-blur-xs border border-blue-300/40"
          />
          <motion.div
            animate={{ y: [10, -10, 10], rotate: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-8 right-12 w-16 h-16 rounded-full bg-amber-200/30 backdrop-blur-xs border border-amber-300/40"
          />
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-12 right-20 w-8 h-8 rounded-lg bg-emerald-200/30 backdrop-blur-xs border border-emerald-300/40"
          />
        </div>

        {/* Subtle 3D Depth Card in Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-xl mx-auto space-y-6"
        >
          {/* Institution & Event Tag */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-200/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#004182]">
              SR University • PRAGATHI 2K26
            </span>
          </div>

          {/* Feature Card Icon with 3D Float */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-blue-100 flex items-center justify-center mx-auto transform-gpu"
          >
            {getModuleIcon(matchedModule?.id || '')}
          </motion.div>

          {/* Heading and Feature Name */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
              FEATURE PORTAL
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#004182] font-display uppercase tracking-tight">
              {featureName}
            </h1>
          </div>

          {/* Required Quote */}
          <div className="bg-white/80 backdrop-blur-md border border-blue-100 rounded-2xl p-4 shadow-xs">
            <p className="text-base sm:text-lg font-bold text-slate-800 italic">
              “Coming soon as part of the PRAGATHI 2K26 digital platform.”
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {featureDescription}
            </p>
          </div>

          {/* Timeline Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-[#004182]" />
            <span>Official Unlocking Date: <strong>09 October 2026</strong></span>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#004182] font-bold px-7 py-3 rounded-full text-sm border border-slate-200 shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-[#004182]" />
              <span>BACK TO HOME</span>
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-8 py-3.5 rounded-[20px] text-sm sm:text-base shadow-md shadow-blue-900/15 hover:shadow-lg hover:-translate-y-[2px] active:translate-y-[1px] transition-all duration-200 group"
            >
              <span>REGISTER NOW</span>
              <ArrowRight className="w-5 h-5 opacity-90 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

        </motion.div>
      </div>

      {/* Directory of All Future Features */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-[#004182] font-display uppercase">
            All Upcoming Platform Features
          </h2>
          <p className="text-xs text-slate-500">
            Select any feature to preview its upcoming release schedule
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FUTURE_MODULES.map((mod) => {
            const isSelected = matchedModule?.id === mod.id;
            return (
              <Link
                key={mod.id}
                to={`/coming-soon?module=${mod.id}`}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 border-[#004182] shadow-sm ring-1 ring-[#004182]/20'
                    : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-bold text-sm ${isSelected ? 'text-[#004182]' : 'text-slate-900'}`}>
                    {mod.name}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
