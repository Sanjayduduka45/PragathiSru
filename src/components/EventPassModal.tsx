import React, { useMemo, useRef, useCallback } from 'react';
import {
  Ticket,
  QrCode,
  Download,
  Printer,
  X,
  Building2,
  Calendar,
  MapPin,
  Users,
  Award,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { ParticipantProfile } from '../context/ParticipantAuthContext';
import { createQRMatrix } from '../lib/qrCode';
import { getDomainCode } from '../services/registrationService';

interface EventPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ParticipantProfile;
}

export const EventPassModal: React.FC<EventPassModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const passCardRef = useRef<HTMLDivElement>(null);

  // Generate unique deterministic QR matrix for this specific team registration ID
  const qrMatrix = useMemo(() => {
    const payload = `PRAGATHI26|${profile.registrationId}`;
    return createQRMatrix(payload);
  }, [profile.registrationId]);

  const domainCode = useMemo(() => {
    return getDomainCode(profile.category);
  }, [profile.category]);

  const leaderName = useMemo(() => {
    return (
      profile.leaderName ||
      profile.members.find((m) => m.role === 'Leader')?.name ||
      profile.members[0]?.name ||
      'Team Leader'
    );
  }, [profile.leaderName, profile.members]);

  // Direct PNG image download
  const handleDownload = useCallback(() => {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1100;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#004182';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Top Header Box
    ctx.fillStyle = '#004182';
    ctx.fillRect(16, 16, width - 32, 160);

    // Header Text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SR UNIVERSITY • WARANGAL, TELANGANA', width / 2, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PRAGATHI 2K26', width / 2, 100);

    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('NATIONAL LEVEL PROJECT EXPO • DIGITAL EVENT PASS', width / 2, 135);

    // Gold Accent Bar
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(16, 176, width - 32, 6);

    // Registration ID Box
    ctx.fillStyle = '#eff6ff';
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(50, 205, width - 100, 95, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('REGISTRATION ID', width / 2, 235);

    ctx.fillStyle = '#004182';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(profile.registrationId, width / 2, 275);

    // Details Grid
    ctx.textAlign = 'left';
    let y = 340;

    const drawField = (label: string, value: string, isFull = false) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(label.toUpperCase(), 60, y);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      const truncated = value.length > (isFull ? 50 : 38) ? value.slice(0, isFull ? 47 : 35) + '…' : value;
      ctx.fillText(truncated, 60, y + 26);
      y += 65;
    };

    drawField('Team Name', profile.teamName);
    drawField('Project Title', profile.projectTitle || 'Project Prototype', true);
    drawField('Domain / Track', `${profile.category} (${domainCode})`);
    drawField('Team Leader', `${leaderName} • ${profile.members.length} Member(s)`);
    drawField('Institution', profile.institutionName || 'SR University');

    // QR Code Section
    const qrBoxSize = 220;
    const qrX = width / 2 - qrBoxSize / 2;
    const qrY = 670;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrX - 15, qrY - 15, qrBoxSize + 30, qrBoxSize + 30, 16);
    ctx.fill();
    ctx.stroke();

    // Draw QR Matrix modules
    const matrixSize = qrMatrix.length;
    const cellSize = qrBoxSize / matrixSize;

    ctx.fillStyle = '#004182';
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize + 0.3, cellSize + 0.3);
        }
      }
    }

    // QR Helper Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PRESENT THIS QR CODE AT EXPO ENTRY / STALL', width / 2, 940);

    // Footer
    ctx.fillStyle = '#004182';
    ctx.fillRect(16, height - 120, width - 32, 104);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('EVENT DATE: 09 OCTOBER 2026 • VENUE: SR UNIVERSITY CAMPUS, WARANGAL', width / 2, height - 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText('OFFICIAL PARTICIPANT PASS • VERIFIED ENTRY CREDENTIAL', width / 2, height - 42);

    // Trigger download
    const link = document.createElement('a');
    link.download = `PRAGATHI26-PASS-${profile.registrationId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [profile, qrMatrix, domainCode, leaderName]);

  // Native Print Function
  const handlePrint = useCallback(() => {
    const printContent = passCardRef.current;
    if (!printContent) return;

    const win = window.open('', '_blank', 'width=850,height=1050');
    if (!win) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PRAGATHI 2K26 Event Pass — ${profile.registrationId}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 15px;
              background: #fff;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .pass-container {
              max-width: 650px;
              margin: 0 auto;
              border: 2px solid #004182;
              border-radius: 24px;
              overflow: hidden;
              background: #fff;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="pass-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }, [profile.registrationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto flex flex-col">

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#004182]" />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              PRAGATHI 2K26 Digital Event Pass
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Pass Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">

          {/* ── ACTUAL EVENT PASS TICKET ────────────────────────────────────────── */}
          <div
            ref={passCardRef}
            className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#004182] shadow-lg overflow-hidden relative"
          >
            {/* Header Ribbon */}
            <div className="bg-[#004182] text-white p-5 text-center relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 block">
                  SR UNIVERSITY • WARANGAL, TELANGANA
                </span>
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase">
                  PRAGATHI 2K26
                </h1>
                <p className="text-[11px] sm:text-xs font-semibold text-blue-100 tracking-wide">
                  National Level Project Expo • DIGITAL EVENT PASS
                </p>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 absolute bottom-0 left-0" />
            </div>

            {/* Pass Body Content */}
            <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50">

              {/* Registration ID Prominent Box */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-center shadow-xs">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">
                  REGISTRATION ID
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-[#004182] tracking-wider block">
                  {profile.registrationId}
                </span>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Team Name
                  </span>
                  <span className="font-bold text-slate-900 text-sm block truncate">
                    {profile.teamName}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Domain / Track
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="bg-[#004182] text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                      {domainCode}
                    </span>
                    <span className="font-bold text-slate-800 truncate">
                      {profile.category}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Project Title
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block line-clamp-2">
                    {profile.projectTitle || 'Project Prototype'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Team Leader
                  </span>
                  <span className="font-semibold text-slate-900 block truncate">
                    {leaderName}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Institution
                  </span>
                  <span className="font-semibold text-slate-900 block truncate">
                    {profile.institutionName || 'SR University'}
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center shadow-xs">
                <div className="p-2 bg-white border border-slate-100 rounded-xl shadow-xs inline-block">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="w-36 h-36 sm:w-44 sm:h-44"
                    shapeRendering="crispEdges"
                  >
                    {qrMatrix.map((row, r) =>
                      row.map((col, c) =>
                        col ? (
                          <rect
                            key={`${r}-${c}`}
                            x={c}
                            y={r}
                            width="1"
                            height="1"
                            fill="#004182"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <div className="mt-2.5 space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#004182] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Entry QR Code</span>
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Present at Expo Entrance &amp; Project Stall
                  </p>
                </div>
              </div>

              {/* Event Schedule Footer */}
              <div className="pt-3 border-t border-slate-200 text-center space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>09 October 2026</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>SR University Campus, Warangal</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest pt-1">
                  OFFICIAL PARTICIPANT PASS • VERIFIED
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-6 py-3 rounded-full text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PASS</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-[#004182] border border-[#004182] font-extrabold px-6 py-3 rounded-full text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
};
