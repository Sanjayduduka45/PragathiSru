import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, Quote, Award, Video, Film, Image as ImageIcon } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export const TestimonialsPage: React.FC = () => {
  const { testimonials, eventSettings } = useContent();

  const activeItems = (testimonials || [])
    .filter((item) => item.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getAspectClass = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:3':
        return 'aspect-[4/3]';
      case 'free':
        return 'aspect-auto max-h-72';
      case '16:9':
      default:
        return 'aspect-[16/9]';
    }
  };

  return (
    <div className="py-8 pb-20 space-y-12 bg-white min-h-[75vh]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-100 pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Back Connection */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs hover:border-blue-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-[#004182]" />
              <span>{eventSettings.institution} • Innovation Showcase</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-5xl font-black text-[#004182] font-display uppercase tracking-tight"
            >
              Testimonials & Event Memories
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
            >
              Explore project demonstrations, video highlights, and experiences from past innovators, faculty mentors, and national project expos at SR University.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Testimonials Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeItems.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 max-w-xl mx-auto space-y-3">
            <Film className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">No Showcase Memories Available</h3>
            <p className="text-xs text-slate-500">Check back soon for new project expo highlights and videos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-slate-700 transition-all"
                >
                  {/* Media Wrapper */}
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
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {(item.eventYear || item.eventName) && (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-blue-400 text-xs font-bold flex items-center gap-1.5 shadow-md">
                          {isVideo ? <Video className="w-3.5 h-3.5 text-amber-400" /> : <Award className="w-3.5 h-3.5" />}
                          <span>{item.eventName ? `${item.eventName}` : item.eventYear}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-white">
                    <div>
                      {item.title && (
                        <h3 className="text-xl font-extrabold text-white mb-2 leading-snug">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <div className="relative pl-6 text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                          <Quote className="w-4 h-4 text-blue-400/60 absolute left-0 top-0" />
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer Row (NO personName) */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        {item.designation && (
                          <p className="font-semibold text-blue-300">{item.designation}</p>
                        )}
                        {item.eventName && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.eventName}</p>
                        )}
                      </div>
                      {item.eventYear && (
                        <span className="text-[11px] font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                          {item.eventYear}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
