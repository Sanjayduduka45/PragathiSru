/**
 * PostersAdmin.tsx
 * Phase 3 — Admin: Project Posters Section
 *
 * Shows all submitted team posters.
 * Admin can View Poster (modal with full preview) and Print.
 * No download button is shown anywhere.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileImage,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  Printer,
  Calendar,
  Building2,
  Users,
  Hash,
  Tag,
  Loader2,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { PosterService, type AdminPosterRecord } from '../../services/posterService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      Draft
    </span>
  );
};

// ── Poster Preview (exact template layout) ───────────────────────────────────

const PosterPreview: React.FC<{ record: AdminPosterRecord }> = ({ record }) => {
  const content = record.posterContent;

  return (
    <div id="poster-print-area" className="w-[960px] h-[1200px] bg-white border-[24px] border-[#004182] p-8 flex flex-col justify-between shadow-md relative select-text text-left font-sans">
      {/* Header Branding (Locked) */}
      <div className="flex items-center justify-between border-b-4 border-[#004182] pb-4 mb-4">
        {/* SRU Logo */}
        <div className="flex items-center gap-4">
          <img src="/poster-template/sru-logo.png" className="w-14 h-14 object-contain" alt="SRU" />
          <div>
            <h1 className="text-xl font-black text-[#004182] tracking-tight leading-none">SR UNIVERSITY</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Warangal, Telangana</p>
          </div>
        </div>

        {/* Event Title */}
        <div className="flex flex-col items-center text-center">
          <img src="/poster-template/pragathi-logo.png" className="h-8 object-contain mb-1" alt="Pragathi" />
          <h2 className="text-xl font-black text-[#004182] tracking-tight leading-none">PRAGATHI 2K26</h2>
          <p className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest mt-1">National Level Project Expo</p>
        </div>

        {/* Title Sponsor */}
        <div className="flex flex-col items-end text-right">
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Title Sponsored By</span>
          <div className="flex items-center gap-2 mt-1">
            <img src="/poster-template/template-img8.png" className="h-7 object-contain" alt="Canara Bank" />
            <div>
              <p className="text-[10px] font-extrabold text-slate-800 leading-none">Canara Bank</p>
              <p className="text-[8px] text-slate-500 font-bold mt-0.5">Hanumakonda Branch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Title Block (Title, Members, Dept) */}
      <div className="bg-[#004182] text-white rounded-2xl p-5 mb-5 text-center shadow-md border border-[#003166]">
        <h1 className="text-2xl font-black tracking-tight mb-2 uppercase min-h-[36px]">
          {content?.projectTitle || record.projectTitle || 'PROJECT TITLE'}
        </h1>
        <p className="text-sm font-bold text-blue-100 tracking-wide mb-1">
          Team Members: {content?.teamMembers || record.leaderName}
        </p>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider min-h-[16px]">
          {content?.departmentDetails || record.institutionName}
        </p>
      </div>

      {/* Poster Content Grid (2 Columns) */}
      <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
        {/* LEFT Column */}
        <div className="flex flex-col gap-5">
          {/* Introduction Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Introduction
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap flex-1 text-left">
              {content?.introduction || '—'}
            </div>
          </div>

          {/* Methodology Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Research Objectives & Methodology
            </h3>
            <div className="text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap flex-1 text-left">
              {content?.methodology || '—'}
            </div>
          </div>
        </div>

        {/* RIGHT Column */}
        <div className="flex flex-col gap-5">
          {/* Diagrams / Configuration Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex flex-col h-[450px]">
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1.5 mb-2.5">
              Configurations & Diagrams
            </h3>
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0 items-center justify-center">
              {/* Diagram 1 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  {content?.diagram1 ? (
                    <img src={content.diagram1} className="w-full h-full object-contain" alt="Fig 1" />
                  ) : (
                    <div className="text-center p-2 text-slate-300 text-[8px] font-bold">No Fig 1</div>
                  )}
                </div>
                <div className="text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight">
                  {content?.diagram1Caption || 'Fig. 1. Prototype config'}
                </div>
              </div>

              {/* Diagram 2 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  {content?.diagram2 ? (
                    <img src={content.diagram2} className="w-full h-full object-contain" alt="Fig 2" />
                  ) : (
                    <div className="text-center p-2 text-slate-300 text-[8px] font-bold">No Fig 2</div>
                  )}
                </div>
                <div className="text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight">
                  {content?.diagram2Caption || 'Fig. 2. System design'}
                </div>
              </div>

              {/* Diagram 3 */}
              <div className="flex flex-col items-center">
                <div className="relative w-full aspect-square border border-dashed border-slate-300 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                  {content?.diagram3 ? (
                    <img src={content.diagram3} className="w-full h-full object-contain" alt="Fig 3" />
                  ) : (
                    <div className="text-center p-2 text-slate-300 text-[8px] font-bold">No Fig 3</div>
                  )}
                </div>
                <div className="text-[9px] font-bold text-slate-500 mt-1.5 text-center leading-tight">
                  {content?.diagram3Caption || 'Fig. 3. Result responses'}
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion & References Box */}
          <div className="border-2 border-indigo-900/10 rounded-2xl p-5 bg-slate-50/50 flex-1 flex flex-col gap-4 min-h-0">
            {/* Conclusion */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest border-b border-indigo-900/10 pb-1 mb-1.5">
                Conclusion
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap text-left font-sans">
                {content?.conclusion || '—'}
              </div>
            </div>

            {/* References */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-dashed border-slate-200 pt-2">
              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-widest pb-1">
                References
              </h3>
              <div className="text-[10px] text-slate-500 leading-relaxed overflow-y-auto whitespace-pre-wrap text-left font-mono flex-1">
                {content?.references || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Sponsors Banner (Locked) */}
      <div className="border-t-4 border-[#004182] pt-3 mt-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Our Sponsors:</span>
          <div className="flex items-center gap-4 flex-wrap">
            <img src="/poster-template/template-img4.png" className="h-5 object-contain grayscale opacity-75" alt="s1" />
            <img src="/poster-template/template-img5.png" className="h-5 object-contain grayscale opacity-75" alt="s2" />
            <img src="/poster-template/template-img6.png" className="h-5 object-contain grayscale opacity-75" alt="s3" />
            <img src="/poster-template/template-img7.png" className="h-5 object-contain grayscale opacity-75" alt="s4" />
            <img src="/poster-template/template-img8.png" className="h-5 object-contain grayscale opacity-75" alt="s5" />
            <img src="/poster-template/template-img9.png" className="h-5 object-contain grayscale opacity-75" alt="s6" />
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
          PRAGATHI 2K26 · {record.registrationId}
        </div>
      </div>
    </div>
  );
};

// ── Poster View Modal ────────────────────────────────────────────────────────

const PosterViewModal: React.FC<{
  record: AdminPosterRecord;
  onClose: () => void;
}> = ({ record, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const printContent = document.getElementById('poster-print-area');
    if (!printContent) return;

    const win = window.open('', '_blank', 'width=1000,height=1200');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PRAGATHI 2K26 Poster — ${record.teamName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: start; background: #fff; }
            
            #poster-print-area {
              width: 24in !important;
              height: 30in !important;
              padding: 0.8in !important;
              border: 24px solid #004182 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              position: relative !important;
            }

            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .border-b-4 { border-bottom: 4px solid #004182; }
            .pb-4 { padding-bottom: 16px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-5 { margin-bottom: 20px; }
            .mt-1 { margin-top: 4px; }
            .mt-1\\.5 { margin-top: 6px; }
            .mt-4 { margin-top: 16px; }
            .gap-4 { gap: 16px; }
            .gap-3 { gap: 12px; }
            .gap-2 { gap: 8px; }
            .gap-5 { gap: 20px; }
            
            .w-14 { width: 56px; }
            .h-14 { height: 56px; }
            .h-8 { height: 32px; }
            .h-7 { height: 28px; }
            .h-5 { height: 20px; }
            .w-full { width: 100%; }
            .aspect-square { aspect-ratio: 1 / 1; }
            
            .text-xl { font-size: 20px; }
            .text-2xl { font-size: 24px; }
            .text-3xl { font-size: 32px; }
            .font-black { font-weight: 900; }
            .font-extrabold { font-weight: 800; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-slate-500 { color: #64748b; }
            .text-slate-400 { color: #94a3b8; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-700 { color: #334155; }
            .text-indigo-700 { color: #4338ca; }
            .text-indigo-950 { color: #1e1b4b; }
            .text-[#004182] { color: #004182; }
            .uppercase { text-transform: uppercase; }
            .tracking-tight { letter-spacing: -0.025em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .leading-none { leading: 1; }
            .leading-relaxed { line-height: 1.625; }
            
            .bg-\\[\\#004182\\] { background-color: #004182; }
            .text-white { color: #fff; }
            .rounded-2xl { border-radius: 16px; }
            .rounded-xl { border-radius: 12px; }
            .p-5 { padding: 20px; }
            .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            
            .flex-1 { flex: 1 1 0%; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            
            .border-2 { border: 2px solid rgba(30, 27, 75, 0.1); }
            .border-dashed { border-style: dashed; }
            .border-slate-300 { border-color: #cbd5e1; }
            .bg-slate-50\\/50 { background-color: rgba(248, 250, 252, 0.5); }
            
            .text-xs { font-size: 14px; }
            .text-\\[10px\\] { font-size: 11px; }
            .text-\\[9px\\] { font-size: 10px; }
            .text-\\[8px\\] { font-size: 9px; }
            .font-mono { font-family: monospace; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
            .border-t-4 { border-top: 4px solid #004182; }
            
            @media print {
              @page {
                size: 24in 30in;
                margin: 0;
              }
              body {
                padding: 0;
                margin: 0;
                width: 24in;
                height: 30in;
              }
              #poster-print-area {
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  }, [record.teamName]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Interactive scale factor calculation to fit presentation canvas inside admin modal
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth;
      const newScale = Math.min((parentWidth - 40) / 960, 1.0);
      setScale(newScale);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    const t = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      aria-modal="true"
      role="dialog"
      aria-label={`Poster: ${record.teamName}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#004182] flex items-center justify-center shrink-0">
              <FileImage className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {record.teamName}
              </p>
              <p className="text-xs text-slate-400 truncate">{record.registrationId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="admin-poster-print-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#004182] hover:bg-[#003266] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Download</span>
            </button>
            <button
              id="admin-poster-modal-close"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="p-5 overflow-y-auto bg-slate-50 flex flex-col items-center justify-start min-h-[500px]"
          ref={containerRef}
          style={{ height: `${1200 * scale + 60}px` }}
        >
          <div
            style={{
              width: '960px',
              height: '1200px',
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
            className="shrink-0"
          >
            <PosterPreview record={record} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Admin Poster Row (table) ──────────────────────────────────────────────────

const PosterTableRow: React.FC<{
  record: AdminPosterRecord;
  onView: (r: AdminPosterRecord) => void;
}> = ({ record, onView }) => (
  <tr className="hover:bg-slate-50 transition-colors group">
    <td className="px-4 py-3.5 align-top">
      <p className="text-sm font-bold text-slate-900">{record.teamName}</p>
      <p className="text-xs text-slate-400 mt-0.5 font-mono">{record.registrationId}</p>
    </td>
    <td className="px-4 py-3.5 align-top hidden sm:table-cell">
      <p className="text-sm font-medium text-slate-700 line-clamp-2">
        {record.projectTitle || '—'}
      </p>
    </td>
    <td className="px-4 py-3.5 align-top hidden md:table-cell">
      <p className="text-sm text-slate-600">{record.leaderName}</p>
      <p className="text-xs text-slate-400">{record.leaderEmail}</p>
    </td>
    <td className="px-4 py-3.5 align-top hidden lg:table-cell">
      <p className="text-xs text-slate-600 line-clamp-2">{record.institutionName || '—'}</p>
    </td>
    <td className="px-4 py-3.5 align-top hidden md:table-cell">
      {record.category ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004182] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
          {record.category}
        </span>
      ) : (
        <span className="text-xs text-slate-400">—</span>
      )}
    </td>
    <td className="px-4 py-3.5 align-top">
      <StatusBadge status={record.status} />
    </td>
    <td className="px-4 py-3.5 align-top hidden sm:table-cell">
      <p className="text-xs text-slate-600">{formatDateTime(record.submittedAt)}</p>
    </td>
    <td className="px-4 py-3.5 align-top text-right">
      <button
        id={`view-poster-${record.posterId}`}
        type="button"
        onClick={() => onView(record)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] hover:text-white bg-blue-50 hover:bg-[#004182] border border-blue-200 hover:border-[#004182] px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
      >
        <Eye className="w-3.5 h-3.5" />
        View
      </button>
    </td>
  </tr>
);

// ── Mobile Card ───────────────────────────────────────────────────────────────

const PosterMobileCard: React.FC<{
  record: AdminPosterRecord;
  onView: (r: AdminPosterRecord) => void;
}> = ({ record, onView }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-blue-200 hover:shadow-sm transition-all">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-slate-900">{record.teamName}</p>
        <p className="text-xs font-mono text-slate-400 mt-0.5">{record.registrationId}</p>
      </div>
      <StatusBadge status={record.status} />
    </div>

    <div className="space-y-1.5 text-xs text-slate-600">
      {record.projectTitle && (
        <div className="flex gap-2">
          <FileImage className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="font-medium">{record.projectTitle}</span>
        </div>
      )}
      <div className="flex gap-2">
        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>{record.leaderName}</span>
      </div>
      {record.institutionName && (
        <div className="flex gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{record.institutionName}</span>
        </div>
      )}
      {record.submittedAt && (
        <div className="flex gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{formatDateTime(record.submittedAt)}</span>
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={() => onView(record)}
      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#004182] bg-blue-50 hover:bg-[#004182] hover:text-white border border-blue-200 hover:border-[#004182] px-3 py-2 rounded-xl transition-all cursor-pointer"
    >
      <Eye className="w-3.5 h-3.5" />
      View Poster
    </button>
  </div>
);

// ── Main Admin Page ───────────────────────────────────────────────────────────

export const PostersAdmin: React.FC = () => {
  const [records, setRecords] = useState<AdminPosterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<AdminPosterRecord | null>(null);
  const [search, setSearch] = useState('');

  const fetchPosters = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await PosterService.getAllSubmittedPosters();
      setRecords(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Filtered records
  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.teamName.toLowerCase().includes(q) ||
      r.projectTitle.toLowerCase().includes(q) ||
      r.leaderName.toLowerCase().includes(q) ||
      r.registrationId.toLowerCase().includes(q) ||
      r.institutionName.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  // Not configured state
  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">Database Not Configured</h2>
          <p className="text-sm text-amber-700 max-w-sm mx-auto">
            Supabase credentials are not set. Configure your environment variables to view poster submissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#004182] flex items-center justify-center">
              <FileImage className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Project Posters</h2>
          </div>
          <p className="text-sm text-slate-500 pl-10.5">
            All submitted team project posters. Click "View" to preview and print.
          </p>
        </div>
        <button
          id="admin-posters-refresh"
          type="button"
          onClick={fetchPosters}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search + Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            id="admin-posters-search"
            type="text"
            placeholder="Search team, project, leader…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004182]/20 focus:border-[#004182] transition-all"
          />
        </div>
        {!loading && !error && (
          <p className="text-xs font-semibold text-slate-500 shrink-0">
            {filtered.length} of {records.length} submission{records.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">Failed to load poster submissions.</span>
          </div>
          <button
            type="button"
            onClick={fetchPosters}
            className="text-xs font-bold text-rose-800 bg-white hover:bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading poster submissions…</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && records.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <FileImage className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Posters Submitted Yet</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Poster submissions from participant teams will appear here once they submit.
          </p>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && records.length > 0 && filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No results match "<span className="font-bold">{search}</span>"
          </p>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && !error && filtered.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="admin-posters-table">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Team
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden sm:table-cell">
                      Project Title
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden md:table-cell">
                      Team Leader
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden lg:table-cell">
                      Institution
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden sm:table-cell">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <PosterTableRow key={r.posterId} record={r} onView={setViewingRecord} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((r) => (
              <PosterMobileCard key={r.posterId} record={r} onView={setViewingRecord} />
            ))}
          </div>
        </>
      )}

      {/* View Poster Modal */}
      {viewingRecord && (
        <PosterViewModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
};
