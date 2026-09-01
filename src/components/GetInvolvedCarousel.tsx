import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useHomePath } from '../context/HomePathContext';

interface OpportunityCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaText: string;
}

export const GetInvolvedCarousel: React.FC = () => {
  const { getRoutePath } = useHomePath();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cards: OpportunityCard[] = [
    {
      id: 'campus-visit',
      title: 'PRAGATHI 2.0 Campus Visit Opportunity',
      description:
        'Schools, Intermediate Colleges, Engineering Colleges, Universities, and other educational institutions can visit SR University during PRAGATHI 2.0 and experience innovative projects and student innovations.',
      icon: <Building2 className="w-6 h-6" />,
      ctaText: 'Contact Us',
    },
    {
      id: 'industry-showcase',
      title: 'Industry Product Showcase',
      description:
        'Industries, startups, and technology companies can showcase their products, technologies, and solutions through exhibition stalls during PRAGATHI 2.0.',
      icon: <Building className="w-6 h-6" />,
      ctaText: 'Contact Us',
    },
    {
      id: 'expert-sessions',
      title: 'Industry Expert Sessions',
      description:
        'Industry leaders, professionals, entrepreneurs, researchers, and technology experts can conduct expert talks, technical sessions, panel discussions, and career-oriented sessions.',
      icon: <Mic className="w-6 h-6" />,
      ctaText: 'Contact Us',
    },
    {
      id: 'startup-showcase',
      title: 'Startup & Innovation Showcase',
      description:
        'Startups, entrepreneurs, student innovators, research teams, and technology ventures can showcase innovative ideas, prototypes, products, and emerging technologies.',
      icon: <Rocket className="w-6 h-6" />,
      ctaText: 'Contact Us',
    },
    {
      id: 'alumni-connect',
      title: 'Alumni Connect',
      description:
        'SR University Alumni are invited to reconnect with the university, witness student innovations, mentor young innovators, network with professionals, and explore collaboration opportunities.',
      icon: <GraduationCap className="w-6 h-6" />,
      ctaText: 'Join Us',
    },
    {
      id: 'student-volunteer',
      title: 'PRAGATHI 2.0 Student Volunteer Program',
      description:
        'Students can contribute to PRAGATHI 2.0 through event coordination, participant assistance, venue guidance, communication, and on-ground support.',
      icon: <HeartHandshake className="w-6 h-6" />,
      ctaText: 'Join as Volunteer',
    },
    {
      id: 'campus-ambassador',
      title: 'PRAGATHI 2.0 Campus Ambassador Program',
      description:
        'Enthusiastic students can represent PRAGATHI 2.0 at their college or institution, promote the expo, encourage participation, and connect their campus with the organizing team.',
      icon: <Megaphone className="w-6 h-6" />,
      ctaText: 'Become an Ambassador',
    },
    {
      id: 'research-collaboration',
      title: 'Research & Academic Collaboration',
      description:
        'Researchers, faculty members, academic institutions, research scholars, and innovation centers can connect with student innovators and explore research, technical, and innovation collaboration opportunities.',
      icon: <Microscope className="w-6 h-6" />,
      ctaText: 'Contact Us',
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
            className="w-[85vw] max-w-[310px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 hover:scale-[1.01] active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 transition-all duration-300 ease-out flex flex-col justify-between group cursor-default"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center group-hover:bg-[#004182] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                {card.icon}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#004182] transition-colors leading-snug">
                {card.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={getRoutePath('/contact')}
                className="text-xs font-bold text-[#004182] group-hover:text-blue-900 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#004182]"
              >
                <span>{card.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
