import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  Cpu,
  Zap,
  Leaf,
  HeartPulse,
  Building2,
  Lightbulb,
  GraduationCap,
  Layers,
  ChevronDown,
  HelpCircle,
  Building,
  ExternalLink,
  Lock,
  Clock,
  MapPin,
  Trophy,
} from 'lucide-react';
import { EVENT_DETAILS } from '../utils/constants';
import {
  PROJECT_CATEGORIES,
  EXPO_HIGHLIGHTS,
  IMPORTANT_DATES,
  SCHEDULE_PREVIEW,
  SPONSORS_PARTNERS,
  FAQS,
  TESTIMONIALS,
} from '../data/eventData';
import { CountdownTimer } from '../components/CountdownTimer';
import { HeroVisual } from '../components/HeroVisual';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { useContent } from '../context/ContentContext';

export const Home: React.FC = () => {
  const { eventSettings, domains, schedule, faqs, sponsors } = useContent();
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || 'faq-1');
  const location = useLocation();

  const activeDomains = domains.filter((d) => d.active);
  const activeSchedule = schedule.filter((s) => s.active);
  const activeFaqs = faqs.filter((f) => f.active);
  const activeSponsors = sponsors.filter((sp) => sp.active);

  // Scroll to anchor on load or hash change
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

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu className="w-6 h-6" />;
      case 'Zap':
        return <Zap className="w-6 h-6" />;
      case 'Leaf':
        return <Leaf className="w-6 h-6" />;
      case 'HeartPulse':
        return <HeartPulse className="w-6 h-6" />;
      case 'Building2':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Lightbulb className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-20 pb-20 bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white pt-8 pb-16 sm:pt-12 sm:pb-24 border-b border-slate-100">
        
        {/* Abstract Background Grid Accent */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#004182 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Institution Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-blue-50/90 border border-blue-100 text-[#004182] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-xs"
              >
                <GraduationCap className="w-4 h-4 text-[#004182]" />
                <span>{eventSettings.institution}, {eventSettings.location}</span>
              </motion.div>

              {/* Title & Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-3"
              >
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#004182] font-display tracking-tight leading-none uppercase">
                  {eventSettings.eventName}
                </h1>
                <p className="text-xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  A National Level Project Expo
                </p>
                <p className="text-base sm:text-xl text-slate-500 font-medium italic">
                  “{eventSettings.tagline}”
                </p>
              </motion.div>

              {/* Event Key Meta Chips */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full shadow-xs border border-slate-200">
                  <Calendar className="w-4 h-4 text-[#004182]" />
                  <span>{eventSettings.eventDate}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#004182] text-white px-3.5 py-2 rounded-full shadow-md">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Prize Pool: <strong className="text-amber-300">{eventSettings.prizePool}</strong></span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full shadow-xs border border-slate-200">
                  <MapPin className="w-4 h-4 text-[#004182]" />
                  <span>SR University Campus</span>
                </div>
              </motion.div>

              {/* Live Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-2"
              >
                <CountdownTimer />
              </motion.div>

              {/* Hero CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#004182] hover:bg-[#003366] text-white px-8 py-3.5 rounded-full font-bold text-base shadow-lg shadow-blue-900/15 transition-all active:scale-98"
                >
                  <Sparkles className="w-5 h-5 text-blue-200" />
                  <span>REGISTER NOW</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#categories"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#004182] border border-slate-200 px-7 py-3.5 rounded-full font-bold text-base shadow-xs hover:shadow-sm transition-all"
                >
                  <span>VIEW DOMAINS</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>
              </motion.div>

            </div>

            {/* Right 3D-Inspired Visual Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 flex justify-center"
            >
              <HeroVisual />
            </motion.div>

          </div>
        </div>
      </section>

      {/* EVENT HIGHLIGHTS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#004182] font-display mb-1">
              {eventSettings.prizePool}
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Prize Pool
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Grand cash awards for top teams across all innovation tracks.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#004182]" />
            </div>
            <div className="text-3xl font-extrabold text-[#004182] font-display mb-1">
              1–5 Members
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Team Size
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Solo innovators or collaborative teams up to 5 members per project.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#004182] font-display mb-1">
              School + College
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              National Participation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Open to high school innovators, diploma, and college undergraduate teams.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#004182] font-display mb-1">
              {eventSettings.eventDate}
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Expo Day
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live working model demonstration & judging at {eventSettings.institution} campus.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT PRAGATHI */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-100/70 text-[#004182] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>About The Expo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#004182] font-display uppercase leading-tight">
              About {eventSettings.eventName}
            </h2>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <strong>{eventSettings.eventName}</strong> is {eventSettings.institution}’s flagship National Level Project Expo, designed to ignite youth innovation, foster interdisciplinary engineering solutions, and provide a stage for high-impact prototypes.
            </p>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Over 500 student teams from across India showcase hardware models, software applications, renewable energy solutions, and biotech inventions evaluated by senior academicians, scientists, and incubation mentors from the <strong>SRiX (SR Innovation Exchange)</strong> ecosystem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">National Level Platform</h4>
                  <p className="text-[11px] text-slate-500">Connecting student innovators with industry mentors and judges.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Incubation Opportunity</h4>
                  <p className="text-[11px] text-slate-500">Seed grants & mentoring via SRiX Incubator.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#004182] hover:text-blue-900 transition-colors"
              >
                <span>Read Full Event Structure & Guidelines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <h3 className="text-lg font-extrabold text-[#004182] font-display border-b border-slate-100 pb-3">
              Official Venue & Institution
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">
                {eventSettings.institution} Campus, {eventSettings.location}
              </p>
              <p>
                {eventSettings.venue}
              </p>
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-[#004182] font-semibold flex items-center justify-between">
                <span>Helpline / Query Cell:</span>
                <span className="font-mono">{eventSettings.helpline}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 text-[11px]">
                Support Email: <strong className="text-slate-900">{eventSettings.contactEmail}</strong>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* EVENT STATISTICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#004182] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Impact & Scale
            </span>
            <h2 className="text-3xl font-extrabold font-display uppercase text-white">
              PRAGATHI 2K26 By The Numbers
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-display text-white">
                500+
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-200 uppercase tracking-wider">
                Submitted Projects
              </div>
              <div className="text-[11px] text-blue-100/80">From School & Colleges</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-display text-amber-300">
                ₹1.5L
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-200 uppercase tracking-wider">
                Total Cash Pool
              </div>
              <div className="text-[11px] text-blue-100/80">6 Innovation Tracks</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-display text-white">
                50+
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-200 uppercase tracking-wider">
                Expert Judges
              </div>
              <div className="text-[11px] text-blue-100/80">Academia & Industry</div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-display text-emerald-300">
                100%
              </div>
              <div className="text-xs sm:text-sm font-bold text-blue-200 uppercase tracking-wider">
                Certified Participants
              </div>
              <div className="text-[11px] text-blue-100/80">Digital &amp; Hardcopy Certificates</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Layers className="w-3.5 h-3.5" />
            <span>Exhibition Domains</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
            Project Categories & Domains
          </h2>
          <p className="text-sm text-slate-500">
            Select your project domain to register your team in the appropriate national track
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeDomains.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white transition-colors duration-300">
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <span className="text-[11px] font-bold text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {cat.badgeText}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#004182] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/register?category=${cat.id}`}
                  className="text-xs font-bold text-[#004182] group-hover:text-blue-900 flex items-center gap-1.5"
                >
                  <span>Register for Track</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IMPORTANT DATES / TIMELINE */}
      <section className="bg-slate-50/80 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-[#004182]" />
              <span>Timeline</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
              Important Event Dates
            </h2>
            <p className="text-sm text-slate-500">
              Mark your calendar for key registration milestones and expo day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {IMPORTANT_DATES.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    <Calendar className="w-3 h-3 text-[#004182]" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Step {idx + 1} of 4</span>
                  {item.status === 'active' ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active Now</span>
                  ) : (
                    <span>Upcoming</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCHEDULE PREVIEW */}
      <section id="schedule" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Clock className="w-3.5 h-3.5" />
            <span>{eventSettings.eventDate} Timetable</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
            Expo Day Schedule
          </h2>
          <p className="text-sm text-slate-500">
            Agenda for registered participants on {eventSettings.eventDate} at {eventSettings.institution} campus
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {activeSchedule.map((item, idx) => (
            <div key={item.id || idx} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="md:w-1/4 shrink-0 space-y-1">
                <span className="text-xs font-bold text-[#004182] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 inline-block font-mono">
                  {item.time}
                </span>
                <div className="text-xs text-slate-400 font-medium">
                  {item.location}
                </div>
              </div>

              <div className="md:w-2/4 space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {item.event}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="md:w-1/4 flex md:justify-end items-center">
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SPONSORS / PARTNERS */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#004182] bg-white px-3 py-1 rounded-full border border-slate-200">
              Institutional Partners
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#004182] font-display uppercase">
              Supported By Leading Ecosystems
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Mentorship, technical standards, and incubation backed by {eventSettings.institution} bodies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {activeSponsors.map((partner, idx) => (
              <div
                key={partner.id || idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2 shadow-xs hover:border-blue-300 transition-all"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-blue-50 border border-blue-100 text-[#004182] font-extrabold font-display text-lg flex items-center justify-center">
                  {partner.logoText || partner.name.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {partner.name}
                </h3>
                <div className="text-[11px] font-semibold text-[#004182]">
                  {partner.type}
                </div>
                <p className="text-[10px] text-slate-400">
                  {partner.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREVIOUS EVENT SHOWCASE & TESTIMONIALS */}
      <TestimonialsSection />

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#004182] font-display uppercase">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-sm text-slate-500">
            Everything you need to know about registration, eligibility, and SRU verification
          </p>
        </div>

        <div className="space-y-4">
          {activeFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-[#004182] transition-colors focus:outline-hidden"
                >
                  <span className="text-base sm:text-lg">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#004182]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* VOICE OF PARTICIPANTS & CONVENERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#004182] font-display uppercase">
            Voices of PRAGATHI
          </h2>
          <p className="text-sm text-slate-500">
            Insights from past innovators, researchers, and conveners at SR University
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  “{t.quote}”
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <div className="font-bold text-sm text-slate-900">{t.name}</div>
                <div className="text-xs text-[#004182] font-semibold">{t.role}</div>
                <div className="text-[11px] text-slate-400">{t.institution}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL REGISTRATION CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#004182] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              National Level Stage Awaits
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display uppercase text-white">
              Ready to Innovate, Create, and Inspire?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Register your project team today and showcase your innovation on a national stage. Open to school and college students from institutions across India.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#004182] font-extrabold px-8 py-3.5 rounded-full shadow-lg hover:bg-blue-50 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 text-[#004182]" />
              <span>REGISTER YOUR TEAM NOW</span>
              <ArrowRight className="w-4 h-4 text-[#004182]" />
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-full border border-white/20 transition-all text-sm"
            >
              <span>Explore Guidelines</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
