import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Calendar, Award, ExternalLink } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const Footer: React.FC = () => {
  const { eventSettings } = useContent();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SR University Campus Map / Location Section */}
        <div className="mb-12 bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-lg relative overflow-hidden">
          {/* Subtle grid pattern background accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>SR UNIVERSITY CAMPUS</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Official Event Venue & Campus Location
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371
              </p>
            </div>

            <a
              href="https://maps.apple/p/SE1HGWp-h_PDYi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-xs sm:text-sm uppercase tracking-wider shrink-0 border border-blue-400/30 group"
            >
              <MapPin className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform duration-200" />
              <span>Open in Apple Maps</span>
              <ExternalLink className="w-4 h-4 text-blue-300 opacity-80 group-hover:translate-x-0.5 transition-transform duration-200" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#004182] text-white flex items-center justify-center font-bold font-display text-lg shadow-sm">
                SR
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-display leading-none uppercase">
                  {eventSettings.eventName}
                </h3>
                <span className="text-xs text-blue-300 font-medium">
                  {eventSettings.institution}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A National Level Project Expo bringing together visionaries, student engineers, researchers, and innovators under the theme <em>“{eventSettings.tagline}”</em>.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold bg-[#004182]/40 p-2.5 rounded-full border border-blue-500/20">
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Prize Pool: {eventSettings.prizePool}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Expo Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-300 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-300 transition-colors">
                  About Expo & SR University
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-300 transition-colors font-semibold text-blue-200">
                  Register Team & Project
                </Link>
              </li>
              <li>
                <Link to="/coming-soon?module=dashboard" className="hover:text-blue-300 transition-colors">
                  Participant Portal
                </Link>
              </li>
              <li>
                <a href="/#categories" className="hover:text-blue-300 transition-colors">
                  Project Domains & Categories
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-300 transition-colors">
                  Helpline & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Information */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Event Details
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <span>Date: <strong className="text-white">{eventSettings.eventDate}</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <span className="text-xs leading-snug">{eventSettings.venue}</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Helpline & Support
            </h4>
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${eventSettings.contactEmail}`}
                className="flex items-center gap-2.5 hover:text-blue-300 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-300" />
                <span>{eventSettings.contactEmail}</span>
              </a>
              <a
                href={`tel:${eventSettings.helpline}`}
                className="flex items-center gap-2.5 hover:text-blue-300 transition-colors"
              >
                <Phone className="w-4 h-4 text-blue-300" />
                <span>{eventSettings.helpline}</span>
              </a>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Follow Us for Updates
                </span>
                <div className="flex items-center gap-2.5">
                  {eventSettings.linkedinUrl && (
                    <a
                      href={eventSettings.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="PRAGATHI 2K26 on LinkedIn"
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#0077b5] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                    </a>
                  )}
                  {eventSettings.facebookUrl && (
                    <a
                      href={eventSettings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="PRAGATHI 2K26 on Facebook"
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1877f2] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                      </svg>
                    </a>
                  )}
                  {eventSettings.instagramUrl && (
                    <a
                      href={eventSettings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="PRAGATHI 2K26 on Instagram"
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-gradient-to-tr hover:from-amber-600 hover:via-rose-600 hover:to-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © 2026 {eventSettings.institution}, Warangal, Telangana. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Official Digital Platform • {eventSettings.eventName}
          </p>
        </div>
      </div>
    </footer>
  );
};
