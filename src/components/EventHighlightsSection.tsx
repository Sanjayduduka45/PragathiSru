import React, { useState } from 'react';
import { Sparkles, Eye, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HighlightItem {
  id: string;
  title: string;
  category: string;
  image: string;
  downloadName: string;
  alt: string;
  description: string;
}

const EVENT_HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'pragathi-2.0',
    title: 'PRAGATHI 2.0',
    category: 'Expo Announcement',
    image: '/highlights/image copy 2.png',
    downloadName: 'PRAGATHI-2K26-Event-Information.png',
    alt: 'PRAGATHI 2.0 Poster',
    description: 'Live project demonstrations, registration details, and conveners structure for PRAGATHI 2.0.',
  },
  {
    id: 'pragathi-2k26',
    title: 'PRAGATHI 2K26',
    category: 'National Level Project Expo',
    image: '/highlights/image copy.png',
    downloadName: 'PRAGATHI-2K26-Poster.png',
    alt: 'PRAGATHI 2K26 Poster',
    description: 'National Level Project Expo organized by SR University focusing on innovation and sustainability.',
  },
  {
    id: 'pragathi-2k26-highlights',
    title: 'PRAGATHI 2K26 Highlights',
    category: 'Sponsors & Overview',
    image: '/highlights/image.png',
    downloadName: 'PRAGATHI-2K26-Highlights.png',
    alt: 'PRAGATHI 2K26 Highlights Poster',
    description: 'Comprehensive event structure featuring title sponsors, cash prize pool, and organizing committee.',
  },
];

export const EventHighlightsSection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<HighlightItem | null>(null);

  const handleDirectDownload = (e: React.MouseEvent, item: HighlightItem) => {
    e.stopPropagation();
  };

  return (
    <section id="event-highlights" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
      {/* Section Container */}
      <div className="space-y-6 sm:space-y-8">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50/90 px-4 py-1.5 rounded-full border border-blue-100 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
            <span>EVENT HIGHLIGHTS</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#004182] font-display uppercase tracking-tight leading-tight">
            Highlights @ PRAGATHI 2K26
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Official event circulars, innovation posters, and key announcements for PRAGATHI 2K26 National Level Project Expo.
          </p>
        </div>

        {/* 3 Horizontal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {EVENT_HIGHLIGHTS.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs hover:shadow-lg hover:border-blue-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer hover:-translate-y-1"
            >
              {/* Top Image Container */}
              <div className="p-3 sm:p-4 pb-0">
                <div className="w-full h-64 sm:h-72 lg:h-80 bg-slate-50/90 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center relative group-hover:bg-blue-50/30 transition-colors">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-full object-contain rounded-lg p-1 transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Quick Preview Hover Pill */}
                  <div className="absolute bottom-3 right-3 bg-[#004182]/90 hover:bg-[#004182] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 backdrop-blur-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Content */}
              <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#004182] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Card Action: Download Poster */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={item.image}
                    download={item.downloadName}
                    onClick={(e) => handleDirectDownload(e, item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors py-1 px-1 -ml-1 cursor-pointer group/dl"
                    title={`Download ${item.title}`}
                  >
                    <Download className="w-4 h-4 text-[#004182] group-hover/dl:translate-y-0.5 transition-transform duration-200" />
                    <span>Download Poster ↓</span>
                  </a>
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                    Click to Preview
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Full-Screen Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 sm:p-6 lg:p-10 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    {selectedImage.category}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {selectedImage.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedImage.image}
                    download={selectedImage.downloadName}
                    className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold px-2.5"
                    title="Download Poster"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close image preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image View */}
              <div className="p-3 sm:p-6 bg-slate-100/80 overflow-auto flex items-center justify-center max-h-[75vh]">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.alt}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                />
              </div>

              {/* Modal Caption Footer */}
              <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <p>{selectedImage.description}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={selectedImage.image}
                    download={selectedImage.downloadName}
                    className="inline-flex items-center gap-1 font-bold text-[#004182] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Poster ↓</span>
                  </a>
                  <span className="text-slate-300">|</span>
                  <a
                    href={selectedImage.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#004182] hover:underline"
                  >
                    Open Full Resolution ↗
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
