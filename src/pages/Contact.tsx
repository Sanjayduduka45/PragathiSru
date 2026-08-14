import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Phone, Building2, ArrowLeft, ArrowRight, ShieldCheck, Headphones, User, MapPin } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const Contact: React.FC = () => {
  const { eventSettings, contactPeople } = useContent();

  const leadershipContacts = (contactPeople || [])
    .filter((p) => p.category === 'leadership' && p.active)
    .sort((a, b) => a.order - b.order);

  const coordinatorContacts = (contactPeople || [])
    .filter((p) => p.category === 'coordinator' && p.active)
    .sort((a, b) => a.order - b.order);

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
        
        {/* OFFICIAL EVENT SUPPORT & VENUE CHANNELS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Support Email & Helpline Card */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 rounded-2xl p-6 border border-blue-100 shadow-2xs space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#004182] text-white flex items-center justify-center shadow-2xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182] block">
                  Central Helpdesk
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Official Support Channels
                </h3>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs sm:text-sm border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Support Email</span>
                  <a
                    href={`mailto:${eventSettings.contactEmail}`}
                    className="font-extrabold text-[#004182] hover:text-blue-900 transition-colors break-all"
                  >
                    {eventSettings.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Helpline Number</span>
                  <a
                    href={`tel:${eventSettings.helpline}`}
                    className="font-extrabold text-[#004182] hover:text-blue-900 transition-colors"
                  >
                    {eventSettings.helpline}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Organizing Institution & Venue Card */}
          <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20 rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004182] flex items-center justify-center shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Host & Location
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {eventSettings.institution}
                </h3>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs sm:text-sm border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Official Venue Address</span>
                  <p className="font-medium text-slate-800 leading-relaxed">
                    {eventSettings.venue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── SOCIAL MEDIA CHANNELS ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Follow Us for Updates
              </h3>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Follow our official social channels for event announcements, updates, highlights, and important information.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* LinkedIn */}
            {eventSettings.linkedinUrl && (
              <a
                href={eventSettings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow PRAGATHI 2K26 on LinkedIn"
                className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#0077b5]/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0077b5] flex items-center justify-center group-hover:bg-[#0077b5] group-hover:text-white transition-colors duration-200 shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    LinkedIn
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0077b5] transition-colors truncate block">
                    PRAGATHI 2K26
                  </span>
                </div>
              </a>
            )}

            {/* Facebook */}
            {eventSettings.facebookUrl && (
              <a
                href={eventSettings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow PRAGATHI 2K26 on Facebook"
                className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-[#1877f2]/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1877f2] flex items-center justify-center group-hover:bg-[#1877f2] group-hover:text-white transition-colors duration-200 shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                  </svg>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Facebook
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#1877f2] transition-colors truncate block">
                    PRAGATHI 2K26
                  </span>
                </div>
              </a>
            )}

            {/* Instagram */}
            {eventSettings.instagramUrl && (
              <a
                href={eventSettings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow PRAGATHI 2K26 on Instagram"
                className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-pink-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-gradient-to-tr group-hover:from-amber-600 group-hover:via-rose-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-200 shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Instagram
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors truncate block">
                    @sru.pragathi2.0
                  </span>
                </div>
              </a>
            )}
          </div>
        </motion.div>

        {/* PROJECT SHOWCASE CONTACTS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#004182] uppercase tracking-wider">
              PROJECT SHOWCASE LEADERSHIP
            </h2>
          </div>

          {leadershipContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {leadershipContacts.map((contact) => (
                <div
                  key={contact.id}
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
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs sm:text-sm text-slate-500 font-medium">
              No project showcase leadership contacts are currently available.
            </div>
          )}
        </motion.div>

        {/* COORDINATORS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#004182] uppercase tracking-wider">
              EVENT COORDINATORS
            </h2>
          </div>

          {coordinatorContacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {coordinatorContacts.map((contact) => (
                <div
                  key={contact.id}
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
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs sm:text-sm text-slate-500 font-medium">
              No event coordinators are currently available.
            </div>
          )}
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
            <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
              Venue: {eventSettings.venue}
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

