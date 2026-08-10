import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, ChevronRight, GraduationCap } from 'lucide-react';
import { NAV_ITEMS, EVENT_DETAILS } from '../utils/constants';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      {/* Top Banner Notice */}
      <div className="bg-[#004182] text-white text-xs font-medium py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-200" />
            <span className="font-semibold">{EVENT_DETAILS.institution}</span>, Warangal • National Level Project Expo
          </span>
          <div className="mx-auto sm:mx-0 flex items-center gap-2">
            <span className="bg-white/15 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-white/20">
              09 Oct 2026
            </span>
            <span>Prize Pool: <strong className="text-amber-300">{EVENT_DETAILS.prizePool}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* SR University Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#004182] text-white flex items-center justify-center font-bold font-display text-xl shadow-sm group-hover:scale-105 transition-transform">
              SR
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold text-[#004182] uppercase tracking-tight leading-none group-hover:text-blue-900 transition-colors">
                {EVENT_DETAILS.institution}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                {EVENT_DETAILS.name} • Warangal, Telangana
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? 'text-[#004182] border-b-2 border-[#004182] pb-0.5'
                      : 'text-slate-500 hover:text-[#004182]'
                  }`}
                >
                  {item.label}
                  {item.isFuture && (
                    <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded-full border border-amber-200/60">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Register Now */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/register"
              className="bg-[#004182] hover:bg-[#003366] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md shadow-blue-900/10 transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Register Now</span>
              <ChevronRight className="w-4 h-4 opacity-80" />
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
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#004182] text-white py-3 rounded-full font-bold text-center shadow-md text-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              Register Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
