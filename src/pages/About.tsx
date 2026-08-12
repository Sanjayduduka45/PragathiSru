import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Trophy,
  Lightbulb,
  Briefcase,
  Compass,
  Layers,
  Building,
  HelpCircle,
  Clock,
  Send,
} from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const About: React.FC = () => {
  const { eventSettings, aboutContent, rules } = useContent();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="py-8 pb-20 space-y-16 bg-white">
      {/* Top Navigation & Header */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-100 pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Back Connection */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs hover:border-blue-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-[#004182]" />
              <span>{eventSettings.institution}, {eventSettings.location}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold text-[#004182] font-display uppercase tracking-tight"
            >
              {aboutContent.title || `ABOUT ${eventSettings.eventName}`}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-2xl text-slate-900 font-extrabold font-display"
            >
              A National Level Project Expo • {eventSettings.eventDate}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm sm:text-base text-slate-500 font-medium italic"
            >
              “{eventSettings.tagline}”
            </motion.p>
          </div>
        </div>
      </section>

      {/* WHAT IS PRAGATHI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50/90 rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-100/70 text-[#004182] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-[#004182]" />
              <span>Overview</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#004182] font-display uppercase leading-tight">
              What is PRAGATHI?
            </h2>

            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <strong>{eventSettings.eventName}</strong> is {eventSettings.institution}'s premier <strong>National Level Project Expo</strong> bringing together young minds, student researchers, and creative thinkers to demonstrate tangible, working prototypes that address real-world challenges.
            </p>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Hosted at <strong>{eventSettings.venue}</strong> on <strong>{eventSettings.eventDate}</strong>, {eventSettings.eventName} serves as an open innovation stage where school students (Classes 8–12), diploma scholars, and undergraduate engineering teams present working hardware models, software applications, green technology solutions, and biotech innovations.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#004182] shrink-0" />
                <span>Inter-College & School Tracks</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#004182] shrink-0" />
                <span>Live Demonstration to Experts</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#004182] shrink-0" />
                <span>SRiX Seed Support & Incubation</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#004182] shrink-0" />
                <span>{eventSettings.prizePool} Grand Prize Pool</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#004182] text-white flex items-center justify-center font-bold font-display text-xl shrink-0 shadow-md">
                SRU
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {eventSettings.institution}, {eventSettings.location}
                </h3>
                <p className="text-xs text-[#004182] font-semibold">
                  Host Institution & Venue
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {eventSettings.institution} is a pioneering institution in Telangana renowned for its multidisciplinary research, Center for AI & Robotics, and modern incubation exchange (SRiX).
            </p>

            <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#004182]">
                <MapPin className="w-4 h-4 text-[#004182] shrink-0" />
                <span>Expo Venue & Location</span>
              </div>
              <p className="text-slate-700">
                {eventSettings.venue}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Date: <strong className="text-slate-900">{eventSettings.eventDate}</strong></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Official Venue
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* VISION & OBJECTIVES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Target className="w-3.5 h-3.5" />
            <span>Guiding Principles</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
            Vision & Key Objectives
          </h2>
          <p className="text-sm text-slate-500">
            Fostering research culture and bridging classroom theory with industrial reality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Vision Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#004182]" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-display">
                OUR VISION
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                To establish PRAGATHI as India's premier university-led national expo platform that empowers young innovators to translate creative concepts into sustainable, patentable, and commercially viable solutions for societal impact.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs font-bold text-[#004182]">
              SR University Center for Innovation
            </div>
          </div>

          {/* Objectives Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 font-display">
              CORE OBJECTIVES
            </h3>
            
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Bridge Theory & Practice:</strong> Provide a hands-on arena where students construct working models beyond traditional curricula.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Interdisciplinary Collaboration:</strong> Encourage teams to integrate AI, IoT, mechanical design, biotechnology, and green energy.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Industry & Academic Interaction:</strong> Connect student teams directly with PhD researchers, industry judges, and investors.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Incubation & Mentorship:</strong> Offer shortlisted projects seed grants and incubation support through SRiX Incubator.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* WHO CAN PARTICIPATE? & TEAM SIZE */}
      <section id="rules" className="bg-slate-50 py-16 border-y border-slate-200 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              <Users className="w-3.5 h-3.5" />
              <span>Eligibility & Formats</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
              Who Can Participate?
            </h2>
            <p className="text-sm text-slate-500">
              PRAGATHI 2K26 welcomes student teams across various academic levels nationwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* School Track */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  School Category
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  School Students (Classes 8–12)
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Open to students from government and private schools displaying science models, IoT kits, basic robotics, and eco-innovations.
              </p>
              <div className="pt-2 text-xs font-bold text-slate-700">
                Team Size: 1 to 5 members
              </div>
            </div>

            {/* College & University Track */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Higher Education Track
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  Colleges & Universities
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Open to Diploma, B.Tech, M.Tech, B.Sc, and Degree scholars showcasing advanced engineering hardware and software apps.
              </p>
              <div className="pt-2 text-xs font-bold text-slate-700">
                Team Size: 1 to 5 members
              </div>
            </div>

            {/* SR University Track */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs space-y-4 hover:border-blue-400 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Host Institution
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  SR University Students
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                SR University students are welcome to participate with projects from any department across the university's schools and research centres.
              </p>
              <div className="pt-2 text-xs font-bold text-slate-700">
                Team Size: 1 to 5 members
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* WHY PARTICIPATE? (BENEFITS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Award className="w-3.5 h-3.5 text-[#004182]" />
            <span>Benefits</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
            Why Participate in PRAGATHI?
          </h2>
          <p className="text-sm text-slate-500">
            Key advantages and opportunities for participating student teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Showcase Real Projects</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Exhibit physical hardware prototypes, software builds, or bio-tech setups on dedicated stall spaces provided at SR University.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{eventSettings.prizePool} Cash Prize Pool</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compete for overall expo championship awards, category trophies, and cash prizes presented at the grand valedictory ceremony.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interact with Experts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get detailed, actionable feedback on code structure, mechanical integrity, and marketability from senior scientists and mentors.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">National-Level Exposure</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gain visibility across academic institutions and earn official SR University National Participation Certificates.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Incubation Pathways</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Top innovative prototypes are shortlisted for patenting assistance and seed capital support from SRiX Incubator.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Peer Networking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect with like-minded student developers, tech enthusiasts, and faculty coordinators from diverse institutions.
            </p>
          </div>

        </div>
      </section>



      {/* CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#004182] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              National Level Project Expo
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display uppercase text-white">
              Ready to Register Your Team?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Join hundreds of student innovators at SR University on 09 October 2026. Register your team and present your innovation on a national stage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-[#004182] font-extrabold px-8 py-3.5 rounded-full shadow-lg hover:bg-blue-50 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 text-[#004182]" />
              <span>REGISTER NOW</span>
              <ArrowRight className="w-4 h-4 text-[#004182]" />
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-full border border-white/20 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
