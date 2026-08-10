import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Phone, Building2, ArrowLeft, ArrowRight, ShieldCheck, Headphones } from 'lucide-react';
import { EVENT_DETAILS } from '../utils/constants';

export const Contact: React.FC = () => {
  return (
    <div className="py-8 pb-20 space-y-12 bg-white min-h-[70vh]">
      {/* Header Banner */}
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
              className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
            >
              <Headphones className="w-4 h-4 text-[#004182]" />
              <span>Official Support Channel</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-[#004182] font-display uppercase tracking-tight"
            >
              HELPLINE & SUPPORT
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
            >
              Get in touch with official event representatives for queries regarding participation, team registrations, and Expo guidelines.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Main Contact Cards Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Email Support Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white transition-colors duration-300">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Official Email
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Email Support
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Send us your inquiries regarding registration status, domain selection, or entry verification.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href={`mailto:${EVENT_DETAILS.contactEmail}`}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#004182] hover:text-blue-900 transition-colors break-all"
              >
                <span>{EVENT_DETAILS.contactEmail}</span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Phone Helpline Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white transition-colors duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Helpline Number
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Phone Assistance
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Call our official event helpline for immediate assistance during standard working hours.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href={`tel:${EVENT_DETAILS.helpline.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#004182] hover:text-blue-900 transition-colors"
              >
                <span>{EVENT_DETAILS.helpline}</span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Host Organization Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#004182] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              Host Organization
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              Organized by SR University, Warangal, Telangana.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official PRAGATHI 2K26 Expo Portal
            </span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#004182] hover:underline"
            >
              <span>Register Team Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
