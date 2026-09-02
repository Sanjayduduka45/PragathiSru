import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  GraduationCap,
  Building,
  Mic,
  Rocket,
  HeartHandshake,
  Megaphone,
  Microscope,
  Building2,
  Briefcase,
} from 'lucide-react';
import { OpportunityEnquiryModal } from './OpportunityEnquiryModal';

interface CardTheme {
  cardBg: string;
  borderColor: string;
  hoverBorderColor: string;
  iconBg: string;
  iconColor: string;
  iconHoverBg: string;
  ctaColor: string;
  ctaHoverColor: string;
  dividerColor: string;
  waveColor: string;
  glowColor: string;
}

interface OpportunityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaText: string;
  theme: CardTheme;
}

export const GetInvolvedCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState('');

  const handleOpenEnquiry = (opportunityTitle: string) => {
    setSelectedOpportunity(opportunityTitle);
    setEnquiryModalOpen(true);
  };

  const cards: OpportunityCard[] = [
    {
      id: 'campus-visit',
      title: 'PRAGATHI 2.0 Campus Visit Opportunity',
      description:
        'Schools, Intermediate Colleges, Engineering Colleges, Universities, and other educational institutions can visit SR University during PRAGATHI 2.0 and experience innovative projects and student innovations.',
      icon: <Building2 className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30',
        borderColor: 'border-blue-100/90',
        hoverBorderColor: 'hover:border-blue-300',
        iconBg: 'bg-blue-100/80',
        iconColor: 'text-blue-600',
        iconHoverBg: 'group-hover:bg-blue-600 group-hover:text-white',
        ctaColor: 'text-blue-600',
        ctaHoverColor: 'group-hover:text-blue-800',
        dividerColor: 'border-blue-100/80',
        waveColor: '#3b82f6',
        glowColor: 'bg-blue-200/40',
      },
    },
    {
      id: 'industry-showcase',
      title: 'Industry Product Showcase',
      description:
        'Industries, startups, and technology companies can showcase their products, technologies, and solutions through exhibition stalls during PRAGATHI 2.0.',
      icon: <Building className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30',
        borderColor: 'border-purple-100/90',
        hoverBorderColor: 'hover:border-purple-300',
        iconBg: 'bg-purple-100/80',
        iconColor: 'text-purple-600',
        iconHoverBg: 'group-hover:bg-purple-600 group-hover:text-white',
        ctaColor: 'text-purple-600',
        ctaHoverColor: 'group-hover:text-purple-800',
        dividerColor: 'border-purple-100/80',
        waveColor: '#a855f7',
        glowColor: 'bg-purple-200/40',
      },
    },
    {
      id: 'expert-sessions',
      title: 'Industry Expert Sessions',
      description:
        'Industry leaders, professionals, entrepreneurs, researchers, and technology experts can conduct expert talks, technical sessions, panel discussions, and career-oriented sessions.',
      icon: <Mic className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-cyan-50/70 via-white to-cyan-50/30',
        borderColor: 'border-cyan-100/90',
        hoverBorderColor: 'hover:border-cyan-300',
        iconBg: 'bg-cyan-100/80',
        iconColor: 'text-cyan-700',
        iconHoverBg: 'group-hover:bg-cyan-600 group-hover:text-white',
        ctaColor: 'text-cyan-700',
        ctaHoverColor: 'group-hover:text-cyan-900',
        dividerColor: 'border-cyan-100/80',
        waveColor: '#06b6d4',
        glowColor: 'bg-cyan-200/40',
      },
    },
    {
      id: 'startup-showcase',
      title: 'Startup & Innovation Showcase',
      description:
        'Startups, entrepreneurs, student innovators, research teams, and technology ventures can showcase innovative ideas, prototypes, products, and emerging technologies.',
      icon: <Rocket className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-orange-50/70 via-white to-orange-50/30',
        borderColor: 'border-orange-100/90',
        hoverBorderColor: 'hover:border-orange-300',
        iconBg: 'bg-orange-100/80',
        iconColor: 'text-orange-600',
        iconHoverBg: 'group-hover:bg-orange-500 group-hover:text-white',
        ctaColor: 'text-orange-600',
        ctaHoverColor: 'group-hover:text-orange-800',
        dividerColor: 'border-orange-100/80',
        waveColor: '#f97316',
        glowColor: 'bg-orange-200/40',
      },
    },
    {
      id: 'alumni-connect',
      title: 'Alumni Connect',
      description:
        'SR University Alumni are invited to reconnect with the university, witness student innovations, mentor young innovators, network with professionals, and explore collaboration opportunities.',
      icon: <GraduationCap className="w-6 h-6" />,
      ctaText: 'Join Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30',
        borderColor: 'border-emerald-100/90',
        hoverBorderColor: 'hover:border-emerald-300',
        iconBg: 'bg-emerald-100/80',
        iconColor: 'text-emerald-600',
        iconHoverBg: 'group-hover:bg-emerald-600 group-hover:text-white',
        ctaColor: 'text-emerald-600',
        ctaHoverColor: 'group-hover:text-emerald-800',
        dividerColor: 'border-emerald-100/80',
        waveColor: '#10b981',
        glowColor: 'bg-emerald-200/40',
      },
    },
    {
      id: 'student-volunteer',
      title: 'PRAGATHI 2.0 Student Volunteer Program',
      description:
        'Students can contribute to PRAGATHI 2.0 through event coordination, participant assistance, venue guidance, communication, and on-ground support.',
      icon: <HeartHandshake className="w-6 h-6" />,
      ctaText: 'Join as Volunteer',
      theme: {
        cardBg: 'bg-gradient-to-br from-teal-50/70 via-white to-teal-50/30',
        borderColor: 'border-teal-100/90',
        hoverBorderColor: 'hover:border-teal-300',
        iconBg: 'bg-teal-100/80',
        iconColor: 'text-teal-600',
        iconHoverBg: 'group-hover:bg-teal-600 group-hover:text-white',
        ctaColor: 'text-teal-600',
        ctaHoverColor: 'group-hover:text-teal-800',
        dividerColor: 'border-teal-100/80',
        waveColor: '#14b8a6',
        glowColor: 'bg-teal-200/40',
      },
    },
    {
      id: 'campus-ambassador',
      title: 'PRAGATHI 2.0 Campus Ambassador Program',
      description:
        'Enthusiastic students can represent PRAGATHI 2.0 at their college or institution, promote the expo, encourage participation, and connect their campus with the organizing team.',
      icon: <Megaphone className="w-6 h-6" />,
      ctaText: 'Become an Ambassador',
      theme: {
        cardBg: 'bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30',
        borderColor: 'border-indigo-100/90',
        hoverBorderColor: 'hover:border-indigo-300',
        iconBg: 'bg-indigo-100/80',
        iconColor: 'text-indigo-600',
        iconHoverBg: 'group-hover:bg-indigo-600 group-hover:text-white',
        ctaColor: 'text-indigo-600',
        ctaHoverColor: 'group-hover:text-indigo-800',
        dividerColor: 'border-indigo-100/80',
        waveColor: '#6366f1',
        glowColor: 'bg-indigo-200/40',
      },
    },
    {
      id: 'research-collaboration',
      title: 'Research & Academic Collaboration',
      description:
        'Researchers, faculty members, academic institutions, research scholars, and innovation centers can connect with student innovators and explore research, technical, and innovation collaboration opportunities.',
      icon: <Microscope className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30',
        borderColor: 'border-rose-100/90',
        hoverBorderColor: 'hover:border-rose-300',
        iconBg: 'bg-rose-100/80',
        iconColor: 'text-rose-600',
        iconHoverBg: 'group-hover:bg-rose-600 group-hover:text-white',
        ctaColor: 'text-rose-600',
        ctaHoverColor: 'group-hover:text-rose-800',
        dividerColor: 'border-rose-100/80',
        waveColor: '#f43f5e',
        glowColor: 'bg-rose-200/40',
      },
    },
    {
      id: 'recruiter-talent-connect',
      title: 'Recruiter & Talent Connect',
      description:
        'Companies and organizations can connect with innovative and talented students participating in PRAGATHI 2.0 for internships, live projects, industry collaborations, placements, and recruitment. Interested organizations are requested to contact the organizing committee in advance to plan their participation.',
      icon: <Briefcase className="w-6 h-6" />,
      ctaText: 'Contact Us',
      theme: {
        cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30',
        borderColor: 'border-amber-100/90',
        hoverBorderColor: 'hover:border-amber-300',
        iconBg: 'bg-amber-100/80',
        iconColor: 'text-amber-600',
        iconHoverBg: 'group-hover:bg-amber-500 group-hover:text-white',
        ctaColor: 'text-amber-600',
        ctaHoverColor: 'group-hover:text-amber-800',
        dividerColor: 'border-amber-100/80',
        waveColor: '#d97706',
        glowColor: 'bg-amber-200/40',
      },
    },
  ];

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="get-involved"
      aria-label="Get Involved with PRAGATHI 2K26"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
            <span>Opportunities</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#004182] font-display uppercase tracking-tight leading-tight">
            GET INVOLVED WITH PRAGATHI 2K26
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Explore opportunities to participate, collaborate, showcase, and contribute to PRAGATHI 2K26.
          </p>
        </div>

        {/* Navigation Buttons for Desktop */}
        <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white text-[#004182] flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white text-[#004182] flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={`relative overflow-hidden w-[85vw] max-w-[310px] sm:w-[320px] shrink-0 snap-start ${card.theme.cardBg} rounded-2xl p-5 sm:p-6 border ${card.theme.borderColor} ${card.theme.hoverBorderColor} shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default`}
          >
            {/* Subtle bottom-right wave decoration */}
            <svg
              className="absolute bottom-0 right-0 w-36 h-24 pointer-events-none opacity-15 group-hover:opacity-25 transition-opacity duration-300 z-0"
              viewBox="0 0 160 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M0 100C40 80 80 95 110 65C135 40 145 20 160 0V100H0Z"
                fill={card.theme.waveColor}
              />
            </svg>

            {/* Ambient soft glow */}
            <div
              className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-300 z-0 ${card.theme.glowColor}`}
              aria-hidden="true"
            />

            {/* Card Content */}
            <div className="relative z-10 space-y-4">
              <div
                className={`w-12 h-12 rounded-xl ${card.theme.iconBg} ${card.theme.iconColor} flex items-center justify-center ${card.theme.iconHoverBg} group-hover:scale-105 transition-all duration-300 shadow-2xs`}
              >
                {card.icon}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#004182] transition-colors leading-snug">
                {card.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Card Footer / CTA */}
            <div
              className={`relative z-10 pt-4 mt-6 border-t ${card.theme.dividerColor} flex items-center justify-between`}
            >
              <button
                type="button"
                onClick={() => handleOpenEnquiry(card.title)}
                className={`text-xs font-bold ${card.theme.ctaColor} ${card.theme.ctaHoverColor} flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#004182] cursor-pointer`}
              >
                <span>{card.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Opportunity Enquiry Modal */}
      <OpportunityEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        opportunity={selectedOpportunity}
      />
    </section>
  );
};
