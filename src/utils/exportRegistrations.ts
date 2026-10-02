/**
 * PRAGATHI 2K26 — Admin Registration Export Utilities
 *
 * Provides CSV and PDF export for the complete registration dataset.
 * - CSV: RFC 4180-compliant, UTF-8 with BOM, Excel-safe
 * - PDF: Professional multi-page report with jsPDF
 */

import type { JoinedRegistrationRecord } from '../pages/admin/RegistrationsAdmin';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Format ISO timestamp to DD-MM-YYYY */
function formatRegistrationDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Get paid amount display for CSV */
function getPaidAmountCSV(r: JoinedRegistrationRecord): string {
  if (r.payment_status === 'not_required' || r.participant_type === 'sru_student') {
    return '₹0';
  }
  const amt = (r.payment_amount != null && r.payment_amount > 0)
    ? r.payment_amount
    : (r.payments && r.payments[0]?.amount != null && r.payments[0].amount > 0 ? r.payments[0].amount : 0);

  if (r.payment_status === 'paid') {
    return amt > 0 ? `₹${amt}` : '₹0';
  }
  if (r.payment_status === 'pending') {
    return '₹0';
  }
  return amt > 0 ? `₹${amt}` : '₹0';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Safely extract the leader from team_members, with fallback to top-level fields */
function getLeader(r: JoinedRegistrationRecord) {
  const fromMembers = r.team_members?.find((m) => m.is_team_leader);
  return {
    name: fromMembers?.name || r.leader_name || '',
    email: fromMembers?.email || r.leader_email || '',
    phone: fromMembers?.mobile || r.leader_mobile || '',
  };
}

/** Build a readable member list string for CSV cell */
function buildMemberList(r: JoinedRegistrationRecord): string {
  const members = r.team_members || [];
  if (members.length === 0) {
    // Fall back to leader info from the registration record itself
    const leader = getLeader(r);
    return `1. ${leader.name || 'N/A'} | Team Leader | ${leader.email || 'N/A'} | ${leader.phone || 'N/A'}`;
  }

  // Ensure leader is first
  const sortedMembers = [...members].sort((a, b) => (b.is_team_leader ? 1 : 0) - (a.is_team_leader ? 1 : 0));

  return sortedMembers
    .map((m, i) => {
      const role = m.is_team_leader ? 'Team Leader' : 'Member';
      return `${i + 1}. ${m.name || 'N/A'} | ${role} | ${m.email || 'N/A'} | ${m.mobile || 'N/A'}`;
    })
    .join('\n');
}

/** Get transaction ID / reference from payments or top-level field */
function getTransactionRef(r: JoinedRegistrationRecord): string {
  // Check payments array first
  if (r.payments && r.payments.length > 0) {
    const payment = r.payments[0];
    if (payment.transaction_id) return payment.transaction_id;
    if (payment.gateway_reference) return payment.gateway_reference;
  }
  // Fallback to top-level payment_reference
  if (r.payment_reference) return r.payment_reference;
  // If payment is not required (SRU free), show N/A
  if (r.payment_status === 'not_required') return 'N/A (Free)';
  // If payment is pending
  if (r.payment_status === 'pending') return 'N/A';
  return 'N/A';
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

/**
 * Escapes a value for RFC 4180 CSV (handles commas, quotes, newlines, unicode)
 */
function csvEscape(value: string): string {
  if (!value) return '""';
  // If the value contains comma, double-quote, newline, or carriage return → wrap in quotes
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportRegistrationsCSV(registrations: JoinedRegistrationRecord[]): void {
  if (!registrations || registrations.length === 0) {
    alert('No registrations available to export.');
    return;
  }

  const headers = [
    'Team Name',
    'Team Unique ID',
    'Registration Date',
    'Institution Name',
    'Team Leader Name',
    'Team Leader Email',
    'Team Leader Phone',
    'Team Members',
    'Payment Status',
    'Paid Amount (₹)',
    'Transaction ID / Reference',
  ];

  const rows = registrations.map((r) => {
    const leader = getLeader(r);
    return [
      csvEscape(r.team_name || ''),
      csvEscape(r.registration_id || ''),
      csvEscape(formatRegistrationDate(r.created_at)),
      csvEscape(getInstitutionName(r)),
      csvEscape(leader.name),
      csvEscape(leader.email),
      csvEscape(leader.phone),
      csvEscape(buildMemberList(r)),
      csvEscape(getPaymentStatusLabel(r)),
      csvEscape(getPaidAmountCSV(r)),
      csvEscape(getTransactionRef(r)),
    ].join(',');
  });

  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n') + '\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `PRAGATHI_2K26_Registrations_${todayStamp()}.csv`;
  downloadBlob(blob, filename);
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

/** Get a human-readable participant type label */
function getParticipantTypeLabel(r: JoinedRegistrationRecord): string {
  if (r.participant_type === 'sru_student') return 'SRU Student';
  if (r.participant_type === 'external_student') return 'External Participant';
  return r.participant_type || 'N/A';
}

/** Get institution name */
function getInstitutionName(r: JoinedRegistrationRecord): string {
  if (r.institutions?.name) return r.institutions.name;
  if ((r as unknown as { institution_name?: string }).institution_name) {
    return (r as unknown as { institution_name?: string }).institution_name!;
  }
  if (r.participant_type === 'sru_student') return 'SR University, Warangal';
  return 'N/A';
}

/** Get payment amount display */
function getPaymentAmount(r: JoinedRegistrationRecord): string {
  if (r.payment_status === 'not_required' || r.participant_type === 'sru_student') return 'Rs.0 (Free)';
  const amt = (r.payment_amount != null && r.payment_amount > 0)
    ? r.payment_amount
    : (r.payments && r.payments[0]?.amount != null && r.payments[0].amount > 0 ? r.payments[0].amount : 0);
  if (amt > 0) return `Rs.${amt}`;
  return 'Rs.0';
}

/** Get human-readable payment status */
function getPaymentStatusLabel(r: JoinedRegistrationRecord): string {
  switch (r.payment_status) {
    case 'paid': return 'PAID';
    case 'pending': return 'PAYMENT PENDING';
    case 'not_required': return 'FREE (NOT REQUIRED)';
    case 'processing': return 'PROCESSING';
    case 'failed': return 'FAILED / REJECTED';
    default: return (r.payment_status || 'N/A').toUpperCase();
  }
}

export async function exportRegistrationsPDF(registrations: JoinedRegistrationRecord[]): Promise<void> {
  if (!registrations || registrations.length === 0) {
    alert('No registrations available to export.');
    return;
  }

  // Dynamic import to keep the initial bundle smaller
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();   // 210
  const pageHeight = doc.internal.pageSize.getHeight();  // 297
  const ML = 14;          // margin left
  const MR = 14;          // margin right
  const CW = pageWidth - ML - MR; // content width
  const footerY = pageHeight - 12;
  const safeBottom = footerY - 4;  // don't render content below this

  let yPos = 0;
  let pageNum = 0;
  let totalPages = 0; // filled later with a second pass placeholder approach

  // ── Precompute summary stats ──
  const totalTeams = registrations.length;
  const totalParticipants = registrations.reduce((a, r) => a + (r.team_size || (r.team_members?.length ?? 1)), 0);
  const paidCount = registrations.filter(r => r.payment_status === 'paid').length;
  const pendingCount = registrations.filter(r => r.payment_status === 'pending').length;
  const freeCount = registrations.filter(r => r.payment_status === 'not_required').length;

  // ── Color palette ──
  const BRAND:    [number, number, number] = [0, 65, 130];     // #004182
  const BRAND_LT: [number, number, number] = [230, 238, 248];  // light blue bg
  const DARK:     [number, number, number] = [25, 25, 30];
  const MID:      [number, number, number] = [80, 85, 95];
  const GRAY:     [number, number, number] = [120, 125, 135];
  const LGRAY:    [number, number, number] = [200, 205, 215];
  const VLGRAY:   [number, number, number] = [240, 242, 245];
  const WHITE:    [number, number, number] = [255, 255, 255];
  const GREEN:    [number, number, number] = [22, 128, 57];
  const GREEN_BG: [number, number, number] = [232, 248, 237];
  const AMBER:    [number, number, number] = [180, 120, 0];
  const AMBER_BG: [number, number, number] = [255, 248, 230];
  const RED:      [number, number, number] = [190, 40, 40];
  const RED_BG:   [number, number, number] = [255, 235, 235];

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE HEADER (compact, every page)
  // ────────────────────────────────────────────────────────────────────────────
  function drawPageHeader() {
    pageNum++;

    // Thin brand bar at very top
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageWidth, 2.2, 'F');

    // Header text area
    const hY = 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text('SR UNIVERSITY', ML, hY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(' •  WARANGAL', ML + doc.getTextWidth('SR UNIVERSITY'), hY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND);
    doc.text('PRAGATHI 2K26', pageWidth / 2, hY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('REGISTRATION REPORT', pageWidth - MR, hY, { align: 'right' });

    // Divider line below header
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.5);
    doc.line(ML, 12.5, pageWidth - MR, 12.5);

    // Thin secondary line
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.15);
    doc.line(ML, 13.2, pageWidth - MR, 13.2);

    yPos = 17;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE FOOTER (every page)
  // ────────────────────────────────────────────────────────────────────────────
  function drawPageFooter() {
    // Divider
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(ML, footerY - 2, pageWidth - MR, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text('PRAGATHI 2K26  •  SR University, Warangal', ML, footerY + 1);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.text('Confidential — Administrative Use', pageWidth / 2, footerY + 1, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Page ${pageNum}`, pageWidth - MR, footerY + 1, { align: 'right' });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // NEW PAGE helper
  // ────────────────────────────────────────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) {
      drawPageFooter();
      doc.addPage();
    }
    drawPageHeader();
  }

  /** Ensure there's enough vertical space; if not, start a new page */
  function ensureSpace(needed: number): void {
    if (yPos + needed > safeBottom) {
      newPage();
    }
  }

  /** Truncate text to fit within a given width, appending "…" if truncated */
  function truncateText(text: string, maxWidth: number, fontSize: number, fontStyle: string = 'normal'): string {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && doc.getTextWidth(t + '…') > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FIRST PAGE — Report Title
  // ────────────────────────────────────────────────────────────────────────────
  newPage();

  // Large title block
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('SR UNIVERSITY, WARANGAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text('PRAGATHI 2K26', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MID);
  doc.text('National Level Project Expo', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Accent line under title
  const accentW = 50;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - accentW / 2, yPos, pageWidth / 2 + accentW / 2, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text('REGISTRATION REPORT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  // Meta info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // ────────────────────────────────────────────────────────────────────────────
  // REGISTRATION SUMMARY
  // ────────────────────────────────────────────────────────────────────────────
  // Section label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND);
  doc.text('REGISTRATION SUMMARY', ML, yPos);
  yPos += 2;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.4);
  doc.line(ML, yPos, ML + 42, yPos);
  yPos += 5;

  // Summary cards
  const cardItems = [
    { label: 'TOTAL TEAMS', value: String(totalTeams), color: BRAND },
    { label: 'PARTICIPANTS', value: String(totalParticipants), color: BRAND },
    { label: 'PAID', value: String(paidCount), color: GREEN },
    { label: 'FREE', value: String(freeCount), color: BRAND },
    { label: 'PENDING', value: String(pendingCount), color: pendingCount > 0 ? AMBER : BRAND },
  ];

  const cardW = (CW - (cardItems.length - 1) * 3) / cardItems.length;
  const cardH = 16;

  for (let i = 0; i < cardItems.length; i++) {
    const cx = ML + i * (cardW + 3);
    const ci = cardItems[i];

    // Card background
    doc.setFillColor(...VLGRAY);
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, yPos, cardW, cardH, 1.5, 1.5, 'FD');

    // Top accent line
    doc.setFillColor(...ci.color);
    doc.rect(cx + 2, yPos, cardW - 4, 1.2, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...GRAY);
    doc.text(ci.label, cx + cardW / 2, yPos + 5.5, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...ci.color);
    doc.text(ci.value, cx + cardW / 2, yPos + 13, { align: 'center' });
  }

  yPos += cardH + 8;

  // Thin separator
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.2);
  doc.line(ML, yPos, pageWidth - MR, yPos);
  yPos += 6;

  // ────────────────────────────────────────────────────────────────────────────
  // TEAM RECORDS
  // ────────────────────────────────────────────────────────────────────────────

  for (let idx = 0; idx < registrations.length; idx++) {
    const r = registrations[idx];
    const leader = getLeader(r);
    const members = r.team_members || [];
    const transRef = getTransactionRef(r);
    const memberCount = members.length || 1;

    // ── Estimate height for the whole card ──
    const dept = members[0]?.department || '';
    const infoHeight = dept ? 27 : 22;
    // Header: 9, Info: infoHeight, Leader: 20, Members header: 7, member rows: n*5.2, Payment: 16, spacing: 10
    const estHeight = 9 + infoHeight + 20 + 7 + memberCount * 5.2 + 16 + 10;
    // If card fits, great. If it doesn't but the non-members part fits, we'll allow
    // the members table to split. Otherwise, go to a new page.
    const minCardStart = 9 + infoHeight + 20 + 7 + 5.2 + 16 + 10; // at least one member row
    if (yPos + minCardStart > safeBottom) {
      newPage();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEAM HEADER BAR
    // ═══════════════════════════════════════════════════════════════════════════
    const headerH = 8.5;
    doc.setFillColor(...BRAND);
    doc.roundedRect(ML, yPos, CW, headerH, 1.2, 1.2, 'F');

    // Team number badge
    const numStr = String(idx + 1).padStart(2, '0');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    // White number box
    const numW = 9;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(ML + 2.5, yPos + 1.5, numW, headerH - 3, 1, 1, 'F');
    doc.setTextColor(...BRAND);
    doc.text(numStr, ML + 2.5 + numW / 2, yPos + headerH / 2 + 1.2, { align: 'center' });

    // Team name
    const teamNameMax = CW - numW - 60;
    const displayName = truncateText(r.team_name || 'Unnamed Team', teamNameMax, 9, 'bold');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(displayName, ML + numW + 6, yPos + headerH / 2 + 1.2);

    // Registration ID
    const regIdStr = r.registration_id || 'N/A';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 218, 240);
    doc.text(regIdStr, ML + CW - 3, yPos + headerH / 2 + 1.2, { align: 'right' });

    yPos += headerH + 1;

    // ═══════════════════════════════════════════════════════════════════════════
    // CARD BODY — light background box
    // ═══════════════════════════════════════════════════════════════════════════
    const bodyTop = yPos;

    // We'll draw the body background after we know the height. Save top position.
    // For now, proceed rendering inside.

    yPos += 3;

    // ── TEAM INFORMATION (two-column key-value) ──
    ensureSpace(infoHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text('TEAM INFORMATION', ML + 4, yPos);
    yPos += 1;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.25);
    doc.line(ML + 4, yPos, ML + 36, yPos);
    yPos += 3.5;

    // Two-column layout
    const col1X = ML + 5;
    const col1VX = ML + 32;
    const col2X = ML + CW / 2 + 2;
    const col2VX = ML + CW / 2 + 30;
    const rowH = 4.2;

    // Row 1: Team Name | Registration ID
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Team Name', col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    const tnDisp = truncateText(r.team_name || 'N/A', (col2X - 2) - col1VX, 7, 'bold');
    doc.text(tnDisp, col1VX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Registration ID', col2X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text(r.registration_id || 'N/A', col2VX, yPos);
    yPos += rowH;

    // Row 2: Institution Name | Participant Type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Institution Name', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    const instDisp = truncateText(getInstitutionName(r), (col2X - 2) - col1VX, 7);
    doc.text(instDisp, col1VX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Participant Type', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(getParticipantTypeLabel(r), col2VX, yPos);
    yPos += rowH;

    // Row 3: Registration Date | Team Size
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Registration Date', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(formatRegistrationDate(r.created_at), col1VX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Team Size', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(`${r.team_size || memberCount} Member${(r.team_size || memberCount) === 1 ? '' : 's'}`, col2VX, yPos);
    yPos += rowH;

    // Row 4: Department (if available)
    if (dept) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);
      doc.text('Department', col1X, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...DARK);
      doc.text(truncateText(dept, (pageWidth - MR) - col1VX - 2, 7), col1VX, yPos);
      yPos += rowH;
    }
    yPos += 2;

    // ── TEAM LEADER ──
    ensureSpace(19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text('TEAM LEADER', ML + 4, yPos);
    yPos += 1;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.25);
    doc.line(ML + 4, yPos, ML + 27, yPos);
    yPos += 3;

    // Leader card box
    const leaderBoxH = 12;
    doc.setFillColor(...BRAND_LT);
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML + 4, yPos, CW - 8, leaderBoxH, 1, 1, 'FD');

    // Leader name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(leader.name || 'N/A', ML + 7, yPos + 4.5);

    // Email and phone on next line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...MID);
    const leaderEmailStr = `Email: ${leader.email || 'N/A'}`;
    doc.text(leaderEmailStr, ML + 7, yPos + 9);
    const emailW = doc.getTextWidth(leaderEmailStr + '      ');
    doc.text(`Phone: ${leader.phone || 'N/A'}`, ML + 7 + emailW, yPos + 9);

    yPos += leaderBoxH + 4;

    // ── TEAM MEMBERS TABLE ──
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text('TEAM MEMBERS', ML + 4, yPos);

    // Member count badge
    const mcBadge = `${memberCount} MEMBER${memberCount === 1 ? '' : 'S'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...GRAY);
    doc.text(mcBadge, ML + 4 + doc.getTextWidth('TEAM MEMBERS  ') + 4, yPos);

    yPos += 1;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.25);
    doc.line(ML + 4, yPos, ML + 30, yPos);
    yPos += 3;

    // Table column definitions
    const tX = ML + 4;
    const tW = CW - 8;
    const padX = 2;
    const cols = [
      { label: '#',           x: tX,            w: 8 },
      { label: 'MEMBER NAME', x: tX + 8,        w: 44 },
      { label: 'ROLE',        x: tX + 8 + 44,   w: 26 },
      { label: 'EMAIL',       x: tX + 52 + 26,  w: 58 },
      { label: 'PHONE',       x: tX + 78 + 58,  w: 38 },
    ];

    /** Draw the table header row */
    function drawTableHeader() {
      const thH = 5.5;
      doc.setFillColor(...BRAND);
      doc.rect(tX, yPos, tW, thH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);

      for (const col of cols) {
        doc.text(col.label, col.x + padX, yPos + 3.8);
      }
      yPos += thH;
    }

    drawTableHeader();

    // Table rows
    const memberList = (members && members.length > 0) ? members : [{
      id: '0',
      name: leader.name || 'N/A',
      email: leader.email || 'N/A',
      mobile: leader.phone || 'N/A',
      roll_number: null,
      department: null,
      is_team_leader: true,
    }];

    // Ensure leader is first
    const sortedMembers = [...memberList].sort((a, b) => (b.is_team_leader ? 1 : 0) - (a.is_team_leader ? 1 : 0));

    for (let mi = 0; mi < sortedMembers.length; mi++) {
      const m = sortedMembers[mi];
      const role = m.is_team_leader ? 'Team Leader' : 'Member';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);

      const nameLines: string[] = doc.splitTextToSize(m.name || 'N/A', cols[1].w - padX * 2);
      const emailLines: string[] = doc.splitTextToSize(m.email || 'N/A', cols[3].w - padX * 2);
      const phoneLines: string[] = doc.splitTextToSize(m.mobile || 'N/A', cols[4].w - padX * 2);

      const maxLines = Math.max(1, nameLines.length, emailLines.length, phoneLines.length);
      const lineSpacing = 3.2;
      const trH = Math.max(5.5, maxLines * lineSpacing + 2.2);

      // Check if we need a new page for this row
      if (yPos + trH > safeBottom) {
        newPage();
        // Continuation label
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(...GRAY);
        doc.text(`${r.team_name || 'Team'} — Members (continued)`, ML + 4, yPos);
        yPos += 4;
        drawTableHeader();
      }

      // Alternating row background
      if (mi % 2 === 0) {
        doc.setFillColor(...VLGRAY);
        doc.rect(tX, yPos, tW, trH, 'F');
      }

      // Row bottom border
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.1);
      doc.line(tX, yPos + trH, tX + tW, yPos + trH);

      const rowTextY = yPos + 3.6;

      // #
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);
      doc.text(String(mi + 1).padStart(2, '0'), cols[0].x + padX, rowTextY);

      // Name (wrapped)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      nameLines.forEach((line, li) => {
        doc.text(line, cols[1].x + padX, rowTextY + li * lineSpacing);
      });

      // Role
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...(m.is_team_leader ? BRAND : MID));
      doc.text(role, cols[2].x + padX, rowTextY);

      // Email (wrapped)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MID);
      emailLines.forEach((line, li) => {
        doc.text(line, cols[3].x + padX, rowTextY + li * lineSpacing);
      });

      // Phone (wrapped)
      phoneLines.forEach((line, li) => {
        doc.text(line, cols[4].x + padX, rowTextY + li * lineSpacing);
      });

      yPos += trH;
    }

    yPos += 4;

    // ── PAYMENT DETAILS ──
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND);
    doc.text('PAYMENT DETAILS', ML + 4, yPos);
    yPos += 1;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.25);
    doc.line(ML + 4, yPos, ML + 32, yPos);
    yPos += 3;

    // Payment status-colored box
    const payStatus = r.payment_status || 'pending';
    let payBg: [number, number, number] = VLGRAY;
    let payFg: [number, number, number] = DARK;
    if (payStatus === 'paid') { payBg = GREEN_BG; payFg = GREEN; }
    else if (payStatus === 'pending') { payBg = AMBER_BG; payFg = AMBER; }
    else if (payStatus === 'failed') { payBg = RED_BG; payFg = RED; }

    const payBoxH = 10;
    doc.setFillColor(...payBg);
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML + 4, yPos, CW - 8, payBoxH, 1, 1, 'FD');

    // Left accent bar
    doc.setFillColor(...payFg);
    doc.rect(ML + 4, yPos + 1, 1.2, payBoxH - 2, 'F');

    // Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text('Status', ML + 9, yPos + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...payFg);
    doc.text(getPaymentStatusLabel(r), ML + 24, yPos + 4);

    // Paid Amount
    const amtX = ML + CW * 0.4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text('Paid Amount', amtX, yPos + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(getPaymentAmount(r), amtX + 16, yPos + 4);

    // Transaction Ref
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text('Transaction ID', ML + 9, yPos + 8.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.text(truncateText(transRef, CW - 50, 7), ML + 35, yPos + 8.5);

    yPos += payBoxH + 5;

    // ── Card bottom separator ──
    if (idx < registrations.length - 1) {
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.3);
      doc.line(ML, yPos, pageWidth - MR, yPos);
      yPos += 1;
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.1);
      doc.line(ML, yPos, pageWidth - MR, yPos);
      yPos += 6;
    }
  }

  // ── END OF REPORT marker ──
  ensureSpace(10);
  yPos += 2;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(ML, yPos, pageWidth - MR, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND);
  doc.text('END OF REPORT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text(`${totalTeams} team(s)  •  ${totalParticipants} participant(s) exported`, pageWidth / 2, yPos, { align: 'center' });

  // ── Draw footer on the final page ──
  drawPageFooter();

  // ── Save ──
  const filename = `PRAGATHI_2K26_Registrations_${todayStamp()}.pdf`;
  doc.save(filename);
}
