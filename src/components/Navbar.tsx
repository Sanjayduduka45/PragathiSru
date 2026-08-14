import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, ChevronRight, GraduationCap, LogIn } from 'lucide-react';
import { NAV_ITEMS } from '../utils/constants';
import { useContent } from '../context/ContentContext';
const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';
const pragathiLogo = '/image.png';

export const Navbar: React.FC = () => {
  const { eventSettings } = useContent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-lg border-b border-slate-100/80 shadow-xs shadow-slate-900/5 transition-all duration-300">
      {/* Top Banner Notice */}
      <div className="bg-[#004182] text-white text-xs font-medium py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a
            href="https://sru.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 hover:text-blue-100 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-200" />
            <span className="font-semibold">{eventSettings.institution}</span>, Warangal • National Level Project Expo
          </a>
          <div className="mx-auto sm:mx-0 flex items-center gap-2">
            <span className="bg-white/15 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-white/20">
              {eventSettings.eventDate}
            </span>
            <span>Prize Pool: <strong className="text-amber-300">{eventSettings.prizePool}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* SR University Brand Logo (Far Left) */}
          <Link
            to="/"
            className="flex items-center shrink-0 group focus:outline-hidden mr-2.5 lg:mr-3.5 xl:mr-5"
            aria-label="Home"
          >
            <div className="h-10 sm:h-12 flex items-center shrink-0 transition-transform duration-200">
              <img src={sruLogo} alt="SR University Logo" className="h-7 sm:h-9 w-auto object-contain" />
            </div>
          </Link>

          {/* Mobile PRAGATHI Logo */}
          <div className="flex md:hidden items-center shrink-0">
            <Link to="/" className="flex items-center shrink-0 focus:outline-hidden" aria-label="PRAGATHI 2K26 Home">
              <img src={pragathiLogo} alt="PRAGATHI Logo" className="h-7 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Navigation & PRAGATHI Logo */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 flex items-center gap-1 whitespace-nowrap group ${
                    active
                      ? 'text-[#004182] bg-blue-50/90 font-bold border border-blue-100/80 shadow-xs'
                      : 'text-slate-600 hover:text-[#004182] hover:bg-blue-50/50 border border-transparent hover:border-blue-100/40 hover:-translate-y-0.5'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isFuture && (
                    <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded-full border border-amber-200/60">
                      Soon
                    </span>
                  )}

                  {/* Animated Underline Accent for Active & Hover */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 xl:left-3 xl:right-3 h-0.5 rounded-full bg-[#004182] transition-all duration-300 ${
                      active
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-75'
                    }`}
                  />
                </Link>
              );
            })}

            {/* PRAGATHI Logo Container immediately after Contact */}
            <Link
              to="/"
              className="flex items-center shrink-0 focus:outline-hidden ml-1.5 lg:ml-2.5"
              aria-label="PRAGATHI 2K26 Home"
            >
              <div className="h-10 sm:h-11 px-2 py-0.5 rounded-xl bg-slate-50/60 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-200/60 flex items-center shrink-0 transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-sm group">
                <img src={pragathiLogo} alt="PRAGATHI Logo" className="h-7 sm:h-8.5 w-auto object-contain group-hover:scale-105 transition-transform duration-200" />
              </div>
            </Link>
          </nav>

          {/* Actions: Login (secondary) + Register Now (primary) — Far Right */}
          <div className="hidden lg:flex items-center gap-2 lg:gap-2.5 xl:gap-3 shrink-0 ml-2.5 lg:ml-4 xl:ml-6">
            <Link
              to="/login"
              className="relative text-[#004182] hover:bg-blue-50/80 border border-[#004182]/25 hover:border-[#004182]/50 px-3.5 py-2 xl:px-4 xl:py-2.5 rounded-[14px] xl:rounded-[16px] text-xs xl:text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Login</span>
            </Link>
            <Link
              to="/register"
              className="relative overflow-hidden bg-[#004182] hover:bg-[#003366] text-white px-4 py-2 xl:px-5 xl:py-2.5 rounded-[14px] xl:rounded-[16px] text-xs xl:text-sm font-bold shadow-md shadow-blue-900/15 hover:shadow-lg hover:shadow-blue-900/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-1.5 xl:gap-2 whitespace-nowrap group"
            >
              <span className="relative z-10 tracking-wide">Register Now</span>
              <ChevronRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-80 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-[#004182] hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-semibold flex items-center justify-between ${
                isActive(item.path)
                  ? 'bg-blue-50 text-[#004182] font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
              {item.isFuture && (
                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                  Soon
                </span>
              )}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 border border-[#004182]/30 text-[#004182] hover:bg-blue-50 py-3 rounded-[16px] font-bold text-center text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Participant Login</span>
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2.5 bg-[#004182] hover:bg-[#003366] text-white py-3 rounded-[16px] font-bold text-center shadow-md text-sm group"
            >
              <span>Register Now</span>
              <ChevronRight className="w-4 h-4 opacity-80 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
