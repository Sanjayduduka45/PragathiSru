import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Quote, ChevronLeft, ChevronRight, Sparkles, Award, ArrowRight, Video } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const TestimonialsSection: React.FC = () => {
  const { testimonials } = useContent();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter only active items and sort by display order
  const activeItems = (testimonials || [])
    .filter((item) => item.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (!activeItems || activeItems.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getAspectClass = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:3':
        return 'aspect-[4/3]';
      case 'free':
        return 'aspect-auto max-h-64';
      case '16:9':
      default:
        return 'aspect-[16/9]';
    }
  };

  const getObjectPositionClass = (position?: string) => {
    switch (position) {
      case 'top':
        return 'object-top';
      case 'bottom':
        return 'object-bottom';
      case 'left':
        return 'object-left';
      case 'right':
        return 'object-right';
      case 'center':
      default:
        return 'object-center';
    }
  };

  return (
    <section id="showcase" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[200px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Memories & Voices</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Previous Event Showcase & Testimonials
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl">
              Explore key moments, project demonstrations, and experiences shared by past participants, mentors, and faculty innovators from PRAGATHI project expos.
            </p>
          </div>

          {/* Navigation & View All CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-blue-400/30 transition-all shadow-md active:scale-95 shrink-0"
            >
              <span>View All Testimonials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeItems.map((item) => {
            const isVideo = item.mediaType === 'video';
            const mediaSrc = item.mediaUrl || item.imageUrl;
            const posterSrc = item.thumbnailUrl || item.imageUrl;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="snap-start shrink-0 w-[85vw] sm:w-[380px] md:w-[420px] bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all flex flex-col justify-between shadow-xl"
              >
                {/* Card Media Wrapper */}
                {mediaSrc && (
                  <div className={`w-full ${getAspectClass(item.imageAspectRatio)} relative overflow-hidden bg-slate-950`}>
                    {isVideo ? (
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={mediaSrc}
                        alt={item.imageAlt || item.title || 'Showcase Image'}
                        loading="lazy"
                        className={`w-full h-full object-cover ${getObjectPositionClass(item.imagePosition)} transition-transform duration-500 hover:scale-105`}
                      />
                    )}
                    {(item.eventYear || item.eventName) && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-blue-400 text-xs font-bold flex items-center gap-1.5 shadow-md">
                        {isVideo ? <Video className="w-3.5 h-3.5 text-amber-400" /> : <Award className="w-3.5 h-3.5" />}
                        <span>{item.eventName ? `${item.eventName}` : item.eventYear}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {item.title && (
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <div className="relative pl-6 text-slate-300 text-sm leading-relaxed italic line-clamp-4">
                        <Quote className="w-4 h-4 text-blue-400/60 absolute left-0 top-0" />
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Information Row (NO personName) */}
                  <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between gap-3">
                    <div>
                      {item.designation && (
                        <p className="text-xs font-semibold text-blue-300 line-clamp-1">{item.designation}</p>
                      )}
                      {item.eventName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.eventName}</p>
                      )}
                    </div>
                    {item.eventYear && (
                      <span className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 rounded-md bg-slate-700/40 border border-slate-700/60">
                        {item.eventYear}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
