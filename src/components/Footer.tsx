import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Calendar, Award } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const Footer: React.FC = () => {
  const { eventSettings } = useContent();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="pt-2">
                <p className="text-xs text-slate-400">
                  Organized by <strong>SR University</strong>, Warangal, Telangana.
                </p>
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
