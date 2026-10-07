/**
 * PRAGATHI 2K26 — Admin External Payment Proofs Export Utility
 *
 * Downloads actual uploaded payment proof screenshots from Supabase Storage
 * for the currently filtered External registrations and packages them into:
 *
 * Pragathi_External_Payment_Proofs.zip
 * ├── Payment_Proofs/
 * │   ├── PRAGATHI26-XXX_TeamName.jpg
 * │   └── ...
 * └── Payment_Proofs_Manifest.xlsx (1 row per external registration)
 */

import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { JoinedRegistrationRecord } from '../pages/admin/RegistrationsAdmin';
import { getApprovalStatusLabel } from './exportRegistrations';

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

function getInstitutionName(r: JoinedRegistrationRecord): string {
  if (r.institutions && r.institutions.name) {
    return r.institutions.name.trim();
  }
  if ((r as any).institution_name) {
    return String((r as any).institution_name).trim();
  }
  return 'N/A';
}

function getTransactionRef(r: JoinedRegistrationRecord): string {
  if (r.payments && r.payments.length > 0) {
    const p = r.payments[0];
    if (p.transaction_id) return p.transaction_id;
    if (p.gateway_reference) return p.gateway_reference;
  }
  if (r.payment_reference) return r.payment_reference;
  return 'N/A';
}

function getPaidAmountDisplay(r: JoinedRegistrationRecord): string {
  const amt = (r.payment_amount != null && r.payment_amount > 0)
    ? r.payment_amount
    : (r.payments && r.payments[0]?.amount != null && r.payments[0].amount > 0 ? r.payments[0].amount : 0);
  return amt > 0 ? `₹${amt}` : '₹0';
}

export interface ExportProofsResult {
  success: boolean;
  reason?: 'no_external' | 'no_proofs' | 'error';
  message: string;
  totalExternal?: number;
  totalProofs?: number;
}

export async function exportPaymentProofsZip(
  registrations: JoinedRegistrationRecord[],
  domainTitleResolver: (r: JoinedRegistrationRecord) => string,
  onProgress?: (status: string) => void
): Promise<ExportProofsResult> {
  const externalRegs = registrations.filter(
    (r) => (r.participant_type || '').trim().toLowerCase() === 'external_student'
  );

  if (externalRegs.length === 0) {
    return {
      success: false,
      reason: 'no_external',
      message: 'No external registrations match the current filters. Payment proofs only apply to external participants.',
    };
  }

  // 1. Primary Strategy: Server-side secure export via FastAPI (Service Role / Zero CORS)
  try {
    if (onProgress) onProgress('Requesting payment proofs package from server...');
    const targetIds = externalRegs.map((r) => r.registration_id || r.id);
    const blob = await api.registrations.exportPaymentProofs(targetIds);
    downloadBlob(blob, 'Pragathi_External_Payment_Proofs.zip');
    return {
      success: true,
      message: `Exported payment proofs package for ${externalRegs.length} external registration(s).`,
      totalExternal: externalRegs.length,
    };
  } catch (err: any) {
    const errMsg = err?.message || '';
    if (errMsg.includes('No payment proofs found')) {
      return {
        success: false,
        reason: 'no_proofs',
        message: 'No payment proofs found for the current filters.',
      };
    }
    console.warn('[Export Payment Proofs] Server export endpoint warning, trying direct Supabase client fallback:', err);
  }

  // 2. Fallback Strategy: Client-side Supabase Storage download + SheetJS CFB packaging
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      reason: 'error',
      message: 'Unable to connect to storage service for payment proofs.',
    };
  }

  const XLSX = await import('xlsx');
  const cfb = (XLSX.CFB as any).utils.cfb_new();

  let totalProofFiles = 0;
  const manifestRows: Array<Array<string | number>> = [];

  for (let i = 0; i < externalRegs.length; i++) {
    const reg = externalRegs[i];
    const regId = reg.registration_id || reg.id;
    const teamName = reg.team_name || 'Team';
    const safeTeam = teamName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const domainTitle = domainTitleResolver(reg);
    const approvalStatus = getApprovalStatusLabel(reg);
    const paymentStatus = (reg.payment_status || 'pending').toUpperCase();
    const amount = getPaidAmountDisplay(reg);
    const txnRef = getTransactionRef(reg);
    const institution = getInstitutionName(reg);

    if (onProgress) {
      onProgress(`Downloading proof ${i + 1} of ${externalRegs.length} (${regId})...`);
    }

    // List files inside payment-proofs/<regId>/
    let fileList: string[] = [];
    try {
      const { data: files } = await supabase.storage.from('payment-proofs').list(regId);
      if (files && Array.isArray(files)) {
        fileList = files
          .map((f) => f.name)
          .filter((name) => Boolean(name && !name.startsWith('.') && name !== '.emptyFolderPlaceholder'));
      }
    } catch (listErr) {
      console.warn(`[Export Proofs] Storage list error for ${regId}:`, listErr);
    }

    // Fallback: If folder list is empty, check raw payment_reference path
    if (fileList.length === 0 && reg.payment_reference) {
      const rawPath = reg.payment_reference.replace(/^payment-proofs\//, '');
      const pathParts = rawPath.split('/');
      if (pathParts.length > 1) {
        fileList = [pathParts[pathParts.length - 1]];
      }
    }

    const downloadedFilenames: string[] = [];

    for (let fIdx = 0; fIdx < fileList.length; fIdx++) {
      const fname = fileList[fIdx];
      const cleanPath = `${regId}/${fname}`;
      try {
        const { data: fileBlob, error: dlErr } = await supabase.storage
          .from('payment-proofs')
          .download(cleanPath);

        if (!dlErr && fileBlob) {
          const ab = await fileBlob.arrayBuffer();
          const ext = fname.includes('.') ? fname.split('.').pop() : 'jpeg';
          const outName = fIdx === 0
            ? `${regId}_${safeTeam}.${ext}`
            : `${regId}_${safeTeam}_${fIdx + 1}.${ext}`;

          (XLSX.CFB as any).utils.cfb_add(
            cfb,
            `/Payment_Proofs/${outName}`,
            new Uint8Array(ab)
          );
          downloadedFilenames.push(outName);
          totalProofFiles++;
        }
      } catch (dlErr) {
        console.warn(`[Export Proofs] Error downloading file ${cleanPath}:`, dlErr);
      }
    }

    manifestRows.push([
      regId,
      teamName,
      domainTitle,
      'External Participants',
      institution,
      approvalStatus,
      paymentStatus,
      amount,
      txnRef,
      downloadedFilenames.length > 0 ? 'Yes' : 'No',
      downloadedFilenames.length,
      downloadedFilenames.length > 0 ? downloadedFilenames.join(', ') : 'N/A',
    ]);
  }

  if (totalProofFiles === 0) {
    return {
      success: false,
      reason: 'no_proofs',
      message: 'No payment proofs found for the current filters.',
    };
  }

  // Build manifest Excel worksheet
  const manifestHeaders = [
    'Registration ID',
    'Team Name',
    'Theme',
    'Participant Type',
    'Institution',
    'Registration Approval Status',
    'Payment Status',
    'Amount',
    'Transaction ID',
    'Payment Proof Available',
    'Number of Payment Proof Files',
    'Payment Proof Filename(s)',
  ];

  const ws = XLSX.utils.aoa_to_sheet([manifestHeaders, ...manifestRows]);
  ws['!cols'] = [
    { wch: 18 }, // Registration ID
    { wch: 26 }, // Team Name
    { wch: 34 }, // Theme
    { wch: 24 }, // Participant Type
    { wch: 30 }, // Institution
    { wch: 26 }, // Registration Approval Status
    { wch: 18 }, // Payment Status
    { wch: 14 }, // Amount
    { wch: 26 }, // Transaction ID
    { wch: 22 }, // Payment Proof Available
    { wch: 26 }, // Number of Payment Proof Files
    { wch: 40 }, // Payment Proof Filename(s)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payment Proofs Manifest');
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  (XLSX.CFB as any).utils.cfb_add(
    cfb,
    '/Payment_Proofs_Manifest.xlsx',
    new Uint8Array(xlsxBuf)
  );

  const zipData = (XLSX.CFB as any).write(cfb, { fileType: 'zip', type: 'array' });
  const zipBlob = new Blob([zipData], { type: 'application/zip' });
  downloadBlob(zipBlob, 'Pragathi_External_Payment_Proofs.zip');

  return {
    success: true,
    message: `Exported ${totalProofFiles} proof file(s) for ${externalRegs.length} external registration(s).`,
    totalExternal: externalRegs.length,
    totalProofs: totalProofFiles,
  };
}
