import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Phone, Mail, User, ArrowRight } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { DEFAULT_CONTACT_PEOPLE, type ContactPerson } from '../services/contentService';

export const HomeContactCarousel: React.FC = () => {
  const { contactPeople } = useContent();
  const [isHovered, setIsHovered] = useState(false);

  // Filter active contacts, sort by display_order ascending, limit to max 5
  const rawList = contactPeople && contactPeople.length > 0 ? contactPeople : DEFAULT_CONTACT_PEOPLE;
  const activeContacts: ContactPerson[] = rawList
    .filter((p) => p.active)
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);

  // If no active contacts found, fallback to default 5
  const displayContacts = activeContacts.length > 0 ? activeContacts : DEFAULT_CONTACT_PEOPLE.slice(0, 5);

  // Duplicate list to achieve seamless infinite loop
  const loopContacts = [...displayContacts, ...displayContacts, ...displayContacts, ...displayContacts];

  return (
    <section
      id="quick-contact"
      aria-label="Quick Contact & Support"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6 scroll-mt-24 overflow-hidden"
    >
      {/* Compact Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 border-b border-slate-100 pb-3 sm:pb-4 max-w-5xl mx-auto">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-2xs">
            <Headphones className="w-3.5 h-3.5 text-[#004182]" />
            <span>Contact & Support</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#004182] font-display uppercase tracking-tight">
            Need Help?
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Reach out to our event representatives for quick assistance and inquiries.
          </p>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] hover:text-blue-900 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-full border border-slate-200 hover:border-blue-300 shadow-2xs transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-[#004182]"
          >
            <span>View All Contacts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Carousel Track Wrapper */}
      <div
        className="relative w-full max-w-5xl mx-auto overflow-hidden py-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Left & Right Subtle Edge Fade Gradients for Premium Feel */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10 hidden sm:block" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10 hidden sm:block" />

        {/* Continuous Horizontal Marquee (Right to Left) */}
        <div
          className="flex gap-4 sm:gap-5 w-max will-change-transform marquee-animation"
          style={{
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        >
          {loopContacts.map((contact, idx) => (
            <div
              key={`${contact.id}-${idx}`}
              className="w-[250px] sm:w-[270px] md:w-[290px] shrink-0 bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex flex-col justify-between space-y-3 group cursor-default"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-100/70 truncate max-w-[190px]">
                    {contact.designation}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#004182] flex items-center justify-center shrink-0 group-hover:bg-[#004182] group-hover:text-white transition-colors duration-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3
                    className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-[#004182] transition-colors truncate"
                    title={contact.name}
                  >
                    {contact.name}
                  </h3>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#004182] shrink-0" />
                  <a
                    href={`tel:${contact.mobile}`}
                    className="font-bold text-[#004182] hover:text-blue-900 transition-colors focus-visible:outline-2 focus-visible:outline-[#004182]"
                  >
                    {contact.mobile}
                  </a>
                </div>

                {contact.email ? (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-slate-500 hover:text-[#004182] transition-colors truncate block focus-visible:outline-2 focus-visible:outline-[#004182]"
                      title={contact.email}
                    >
                      {contact.email}
                    </a>
                  </div>
                ) : (
                  <div className="h-[18px]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
