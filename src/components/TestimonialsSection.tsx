import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventMemory {
  id: number;
  url: string;
  title: string;
  subtitle: string;
  alt: string;
}

const MEMORIES: EventMemory[] = [
  {
    id: 1,
    url: '/event-memories/IMG_7326.JPG',
    title: 'PRAGATHI Expo Inauguration',
    subtitle: 'Guests, faculty members, and organizers gather at the PRAGATHI Project Expo entrance during the opening moments of the event.',
    alt: 'PRAGATHI Expo Inauguration',
  },
  {
    id: 2,
    url: '/event-memories/IMG_7330.JPG',
    title: 'Guests Explore the Expo',
    subtitle: 'Guests and faculty members walk through the exhibition area as project demonstrations begin.',
    alt: 'Guests Explore the Expo',
  },
  {
    id: 3,
    url: '/event-memories/IMG_7363.JPG',
    title: 'Young Innovator Presents a Project',
    subtitle: 'A young participant explains a working project model to guests during the exhibition.',
    alt: 'Young Innovator Presents a Project',
  },
  {
    id: 4,
    url: '/event-memories/IMG_7368.JPG',
    title: 'Project Demonstration & Discussion',
    subtitle: 'Students and guests discuss the working model during a project demonstration at the expo.',
    alt: 'Project Demonstration & Discussion',
  },
  {
    id: 5,
    url: '/event-memories/IMG_7377.JPG',
    title: 'Electric Mobility Prototype',
    subtitle: 'Visitors and participants examine an electric mobility prototype displayed during the project exhibition.',
    alt: 'Electric Mobility Prototype',
  },
  {
    id: 6,
    url: '/event-memories/IMG_7392.JPG',
    title: 'Drone Technology Demonstration',
    subtitle: 'Students demonstrate a drone-based project while explaining its setup and operation to visitors.',
    alt: 'Drone Technology Demonstration',
  },
  {
    id: 7,
    url: '/event-memories/IMG_7441.JPG',
    title: 'Smart Agriculture Project',
    subtitle: 'Students showcase an agriculture-focused project with crop samples, equipment, and supporting demonstrations.',
    alt: 'Smart Agriculture Project',
  },
  {
    id: 8,
    url: '/event-memories/IMG_7687.JPG',
    title: 'Project Award Ceremony',
    subtitle: 'Students celebrate their achievement as the project team receives recognition during the PRAGATHI Expo.',
    alt: 'Project Award Ceremony',
  },
  {
    id: 9,
    url: '/event-memories/IMG_7693.JPG',
    title: 'Celebrating Student Achievement',
    subtitle: 'Student teams receive certificates and recognition for their project work during the closing celebrations.',
    alt: 'Celebrating Student Achievement',
  },
];

const FEATURED_MEMORIES = MEMORIES.slice(0, 3);

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_MEMORIES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_MEMORIES.length) % FEATURED_MEMORIES.length);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (isPaused || isLightboxOpen) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, isLightboxOpen, nextSlide]);

  // Keyboard navigation for lightbox & slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextSlide, prevSlide]);

  const currentMemory = FEATURED_MEMORIES[currentIndex];

  return (
    <section id="showcase" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-blue-50/20 to-white relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2.5 sm:space-y-3 max-w-3xl mx-auto">
          {/* Small Compact Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-[#004182] text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
            <span>EVENT MEMORIES</span>
          </div>

          {/* Refined Main Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#004182] tracking-tight leading-tight font-display">
            Moments That Made PRAGATHI
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            A glimpse into the people, projects, innovation, and experiences from PRAGATHI Project Expo.
          </p>
        </div>

        {/* Featured Main Image Showcase Slider Container */}
        <div
          className="relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200/90 bg-slate-900 group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Image Stage (16:9 Aspect Ratio) */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentMemory.id}
                src={currentMemory.url}
                alt={currentMemory.alt}
                initial={{ opacity: 0.4, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500 ease-out cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              />
            </AnimatePresence>

            {/* Floating Glass Image Counter (Top Right) */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-mono font-extrabold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg tracking-widest pointer-events-none">
              <span>{String(currentIndex + 1).padStart(2, '0')}</span>
              <span className="opacity-40 mx-1">/</span>
              <span className="opacity-70">{String(FEATURED_MEMORIES.length).padStart(2, '0')}</span>
            </div>

            {/* Subtle Gradient Overlay & Caption (Bottom) */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-5 sm:p-8 text-white pointer-events-none">
              <p className="text-xs sm:text-sm font-semibold text-blue-300 uppercase tracking-wider mb-1">
                {currentMemory.subtitle}
              </p>
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-white line-clamp-1">
                {currentMemory.title}
              </h3>
            </div>

            {/* Floating Glass Navigation Buttons (Left & Right) */}
            <button
              onClick={prevSlide}
              aria-label="Previous image"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 text-[#004182] hover:text-[#002852] shadow-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-[calc(50%+2px)] active:scale-95 group/btn focus:outline-hidden"
            >
              <ChevronLeft className="w-6 h-6 group-hover/btn:-translate-x-0.5 transition-transform duration-200" />
            </button>

            <button
              onClick={nextSlide}
              aria-label="Next image"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 text-[#004182] hover:text-[#002852] shadow-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-[calc(50%+2px)] active:scale-95 group/btn focus:outline-hidden"
            >
              <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Simple Text CTA Link underneath the main gallery */}
        <div className="text-center pt-3 sm:pt-4">
          <Link
            to="/testimonials"
            className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-[#004182] hover:text-[#002852] transition-colors group cursor-pointer"
          >
            <span className="group-hover:underline underline-offset-4 decoration-2 decoration-[#004182]/40">View More Memories</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX GALLERY MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Lightbox Top Control Bar */}
            <div className="flex items-center justify-between text-white z-10 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                  {String(currentIndex + 1).padStart(2, '0')} / {String(MEMORIES.length).padStart(2, '0')}
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
                  {currentMemory.title}
                </span>
              </div>

              <button
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close fullscreen gallery"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:scale-105 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Central Main Image */}
            <div className="relative flex-1 flex items-center justify-center my-4 max-w-7xl mx-auto w-full">
              <motion.img
                key={currentMemory.id}
                src={currentMemory.url}
                alt={currentMemory.alt}
                initial={{ opacity: 0.5, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.5 }}
                transition={{ duration: 0.3 }}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {/* Lightbox Previous Button */}
              <button
                onClick={prevSlide}
                aria-label="Previous photo"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              {/* Lightbox Next Button */}
              <button
                onClick={nextSlide}
                aria-label="Next photo"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            {/* Lightbox Bottom Thumbnail Bar */}
            <div className="max-w-4xl mx-auto w-full z-10 pt-2">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {MEMORIES.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`relative shrink-0 w-14 h-10 sm:w-18 sm:h-12 rounded-lg overflow-hidden transition-all ${
                      idx === currentIndex
                        ? 'ring-2 ring-blue-400 opacity-100 scale-105'
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
