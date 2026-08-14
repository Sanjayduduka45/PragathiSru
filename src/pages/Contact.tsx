import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Phone, Building2, ArrowLeft, ArrowRight, ShieldCheck, Headphones, User } from 'lucide-react';
import { useContent } from '../context/ContentContext';

interface ContactPerson {
  name: string;
  designation: string;
  mobile: string;
  email?: string;
}

const projectShowcaseContacts: ContactPerson[] = [
  {
    name: 'Dr. CH. Hussaian Basha',
    designation: 'Dean-Project Show Case',
    mobile: '9514418276',
    email: 'dean.psc@sru.edu.in',
  },
  {
    name: 'Dr. Markala Karthik Reddy',
    designation: 'Associate Dean Project Show Case',
    mobile: '7842227172',
    email: 'm.karthik@sru.edu.in',
  },
  {
    name: 'Dr. Shravan Kumar Yadav',
    designation: 'Associate Dean Project Show Case',
    mobile: '9040316409',
    email: 'shravan.kumar@sru.edu.in',
  },
];

const coordinators: ContactPerson[] = [
  {
    name: 'Mr. Mohammad Afzal',
    designation: 'Coordinator',
    mobile: '9100726799',
  },
  {
    name: 'Mr. Algol Sumanth',
    designation: 'Coordinator',
    mobile: '7842421505',
  },
];

export const Contact: React.FC = () => {
  const { eventSettings } = useContent();

  return (
    <div className="py-6 sm:py-8 pb-16 sm:pb-20 space-y-8 sm:space-y-12 bg-white min-h-[70vh]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-100 pt-4 sm:pt-6 pb-8 sm:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Back Connection */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#004182]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          <div className="text-center max-w-3xl mx-auto space-y-3.5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs uppercase tracking-wider"
            >
              <Headphones className="w-4 h-4 text-[#004182]" />
              <span>Official Support Channel</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#004182] font-display uppercase tracking-tight leading-tight"
            >
              HELPLINE & SUPPORT
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-slate-600 text-xs sm:text-sm lg:text-base max-w-xl mx-auto leading-relaxed"
            >
              Get in touch with official event representatives for queries regarding participation, team registrations, and Expo guidelines.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Main Contact Cards Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        
        {/* PROJECT SHOWCASE CONTACTS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {projectShowcaseContacts.map((contact, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between group cursor-default"
              >
                <div className="space-y-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                      {contact.designation}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {contact.name}
                    </h3>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#004182] shrink-0" />
                    <a
                      href={`tel:${contact.mobile}`}
                      className="font-extrabold text-[#004182] hover:text-blue-900 transition-colors focus-visible:outline-2 focus-visible:outline-[#004182]"
                    >
                      {contact.mobile}
                    </a>
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 break-all">
                      <Mail className="w-4 h-4 text-[#004182] shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="font-extrabold text-[#004182] hover:text-blue-900 transition-colors break-all focus-visible:outline-2 focus-visible:outline-[#004182]"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* COORDINATORS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xs sm:text-sm font-extrabold text-[#004182] uppercase tracking-wider border-b border-slate-100 pb-2">
            COORDINATORS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {coordinators.map((contact, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 transition-all duration-300 ease-out space-y-4 flex flex-col justify-between group cursor-default"
              >
                <div className="space-y-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                      {contact.designation}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {contact.name}
                    </h3>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#004182] shrink-0" />
                    <a
                      href={`tel:${contact.mobile}`}
                      className="font-extrabold text-[#004182] hover:text-blue-900 transition-colors focus-visible:outline-2 focus-visible:outline-[#004182]"
                    >
                      {contact.mobile}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Host Organization Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-6 sm:mt-8 bg-slate-50/90 rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:hover:translate-y-0 transition-all duration-300 ease-out text-center space-y-4 cursor-default"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100/80 text-[#004182] flex items-center justify-center mx-auto shadow-2xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
              Host Organization
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900">
              Organized by {eventSettings.institution}, {eventSettings.location}.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official PRAGATHI 2K26 Expo Portal
            </span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#004182] hover:text-blue-900 transition-colors group/link focus-visible:outline-2 focus-visible:outline-[#004182]"
            >
              <span>Register Team Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

