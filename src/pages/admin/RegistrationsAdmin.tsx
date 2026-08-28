import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Eye,
  Building,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Users,
  Layers,
  Sparkles,
  Edit3,
  Trash2,
  Save,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Mail,
  Send,
  Clock,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { api } from '../../services/api';
import { RegistrationService } from '../../services/registrationService';
import { Modal } from '../../components/ui/Modal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { PROJECT_CATEGORIES } from '../../data/eventData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JoinedRegistrationRecord {
  id: string;
  registration_id: string;
  participant_type: 'sru_student' | 'external_student';
  team_name: string;
  team_size: number;
  institution_id: string | null;
  leader_name: string;
  leader_email: string;
  leader_mobile: string | null;
  registration_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  payment_status: 'not_required' | 'pending' | 'processing' | 'paid' | 'failed';
  payment_amount: number;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  institutions?: {
    id: string;
    name: string;
    institution_type: string;
    address?: string;
    city?: string;
    state?: string;
  } | null;
  team_members?: Array<{
    id: string;
    name: string;
    email: string;
    mobile: string | null;
    roll_number: string | null;
    department: string | null;
    is_team_leader: boolean;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    category: string;
    problem_statement: string | null;
    proposed_solution: string | null;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    gateway_reference: string | null;
    transaction_id: string | null;
  }>;
}

interface EditMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  roll_number: string;
  department: string;
  is_team_leader: boolean;
}

interface EditFormState {
  team_name: string;
  participant_type: 'sru_student' | 'external_student';
  leader_name: string;
  leader_email: string;
  leader_mobile: string;
  payment_status: string;
  payment_amount: string;
  payment_reference: string;
  team_members: EditMember[];
  project_title: string;
  project_category: string;
  project_problem_statement: string;
}

// ─── Helper badges ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status || 'submitted').toLowerCase();
  if (s === 'approved' || s === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        APPROVED
      </span>
    );
  }
  if (s === 'rejected' || s === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <X className="w-3 h-3 text-rose-600" />
        REJECTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
      <Clock className="w-3 h-3 text-amber-600 font-bold" />
      PENDING VERIFICATION
    </span>
  );
};

const PaymentBadge = ({ status, amount }: { status: string; amount: number }) => {
  switch (status) {
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
          <CreditCard className="w-3 h-3 text-emerald-600" />
          Paid (₹{amount})
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
          Pending (₹{amount})
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
          Failed (₹{amount})
        </span>
      );
    case 'not_required':
    default:
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
          Not Required (₹0)
        </span>
      );
  }
};

// ─── Small labeled field ──────────────────────────────────────────────────────

const LabeledInput: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}> = ({ label, id, value, onChange, type = 'text', required, readOnly }) => (
  <div>
    <label htmlFor={id} className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
        readOnly
          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
          : 'border-slate-200 bg-white focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100'
      }`}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const RegistrationsAdmin: React.FC = () => {
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [registrations, setRegistrations] = useState<JoinedRegistrationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [institutionFilter, setInstitutionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // View modal
  const [selectedReg, setSelectedReg] = useState<JoinedRegistrationRecord | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Payment Verification State
  const [loadingProof, setLoadingProof] = useState<boolean>(false);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Edit modal
  const [editReg, setEditReg] = useState<JoinedRegistrationRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete flow  (step 0 = closed, 1 = step-1 warning, 2 = step-2 type ID)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteTarget, setDeleteTarget] = useState<JoinedRegistrationRecord | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isExternalRegistration = (reg: JoinedRegistrationRecord | null) => {
    if (!reg) return false;
    return (reg.participant_type || '').trim().toLowerCase() === 'external_student';
  };

  const isPendingPayment = (reg: JoinedRegistrationRecord | null) => {
    if (!reg || !isExternalRegistration(reg)) return false;
    const pStatus = (reg.payment_status || '').trim().toLowerCase();
    const rStatus = (reg.registration_status || '').trim().toLowerCase();
    return pStatus === 'pending' || pStatus === 'unpaid' || rStatus === 'submitted' || rStatus === 'under_review';
  };

  const handleViewProof = async (reg: JoinedRegistrationRecord) => {
    setLoadingProof(true);
    try {
      const res = await api.registrations.getPaymentProofUrl(reg.id);
      if (res && res.signed_url) {
        setProofModalUrl(res.signed_url);
      } else {
        addToast('error', 'Proof View Error', 'Could not obtain secure signed URL for payment proof.');
      }
    } catch (err: any) {
      console.warn('[RegistrationsAdmin] FastAPI proof signed URL warning, trying direct Supabase signed URL:', err);
      if (isSupabaseConfigured && supabase) {
        try {
          const rawPath = reg.payment_reference || (reg.payments?.[0] as any)?.payment_proof_path;
          if (!rawPath) throw new Error('No proof reference saved in database.');
          const cleanPath = rawPath.replace('payment-proofs/', '');
          const { data, error: signErr } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(cleanPath, 600);
          if (signErr || !data?.signedUrl) {
            throw new Error(signErr?.message || 'Failed to generate signed URL.');
          }
          setProofModalUrl(data.signedUrl);
        } catch (sErr: any) {
          addToast('error', 'Proof View Error', sErr?.message || 'Unable to load payment proof.');
        }
      } else {
        addToast('error', 'Proof View Error', err?.message || 'Unable to load payment proof.');
      }
    } finally {
      setLoadingProof(false);
    }
  };

  const handleApprovePayment = async (reg: JoinedRegistrationRecord) => {
    setActionLoading(true);
    try {
      const res = await api.registrations.approvePayment(reg.id);
      if (res && res.success) {
        addToast('success', 'Payment Approved', `Payment for team ${reg.team_name} approved! Confirmation email dispatched.`);
        await fetchRegistrations();
        if (selectedReg && (selectedReg.id === reg.id || selectedReg.registration_id === reg.registration_id)) {
          setSelectedReg({
            ...selectedReg,
            payment_status: 'paid',
            registration_status: 'approved',
          });
        }
      }
    } catch (err: any) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('payments').update({ status: 'paid' }).eq('registration_id', reg.id);
          await supabase.from('registrations').update({ payment_status: 'paid', registration_status: 'approved' }).eq('id', reg.id);
          addToast('success', 'Payment Approved', `Payment for team ${reg.team_name} approved directly in database.`);
          await RegistrationService.resendConfirmationEmail(reg.registration_id);
          await fetchRegistrations();
          if (selectedReg && (selectedReg.id === reg.id || selectedReg.registration_id === reg.registration_id)) {
            setSelectedReg({
              ...selectedReg,
              payment_status: 'paid',
              registration_status: 'approved',
            });
          }
        } catch (sErr: any) {
          addToast('error', 'Approval Error', sErr?.message || 'Failed to approve payment.');
        }
      } else {
        addToast('error', 'Approval Error', err?.message || 'Failed to approve payment.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async (reg: JoinedRegistrationRecord) => {
    const reason = window.prompt(`Enter rejection reason for team ${reg.team_name} (optional):`);
    setActionLoading(true);
    try {
      const res = await api.registrations.rejectPayment(reg.id, reason || undefined);
      if (res && res.success) {
        addToast('info', 'Payment Rejected', `Payment for team ${reg.team_name} rejected.`);
        await fetchRegistrations();
        if (selectedReg && (selectedReg.id === reg.id || selectedReg.registration_id === reg.registration_id)) {
          setSelectedReg({
            ...selectedReg,
            payment_status: 'failed',
            registration_status: 'rejected',
          });
        }
      }
    } catch (err: any) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('payments').update({ status: 'failed' }).eq('registration_id', reg.id);
          await supabase.from('registrations').update({ payment_status: 'failed', registration_status: 'rejected' }).eq('id', reg.id);
          addToast('info', 'Payment Rejected', `Payment for team ${reg.team_name} rejected.`);
          await fetchRegistrations();
          if (selectedReg && (selectedReg.id === reg.id || selectedReg.registration_id === reg.registration_id)) {
            setSelectedReg({
              ...selectedReg,
              payment_status: 'failed',
              registration_status: 'rejected',
            });
          }
        } catch (sErr: any) {
          addToast('error', 'Rejection Error', sErr?.message || 'Failed to reject payment.');
        }
      } else {
        addToast('error', 'Rejection Error', err?.message || 'Failed to reject payment.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);

    let loadedRegs: JoinedRegistrationRecord[] = [];

    try {
      const res = await api.registrations.list();
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        loadedRegs = res.data as JoinedRegistrationRecord[];
      }
    } catch (err: any) {
      console.warn('[RegistrationsAdmin] FastAPI fetch warning:', err);
    }

    if (loadedRegs.length === 0 && isSupabaseConfigured && supabase) {
      try {
        const { data, error: fetchErr } = await supabase
          .from('registrations')
          .select(`*, institutions(*), team_members(*), projects(*), payments(*)`)
          .order('created_at', { ascending: false });

        if (fetchErr) {
          console.warn('[RegistrationsAdmin] Supabase fetch error:', fetchErr);
        } else if (data) {
          loadedRegs = data as JoinedRegistrationRecord[];
        }
      } catch (sErr: any) {
        console.warn('[RegistrationsAdmin] Direct Supabase fetch warning:', sErr);
      }
    }

    setRegistrations(loadedRegs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // ── Fetch Email Logs for Selected Registration ─────────────────────────────
  const fetchEmailLogs = useCallback(async (regCode: string) => {
    if (!regCode) return;
    setLoadingEmailLogs(true);
    try {
      // First try RegistrationService / Supabase
      const logs = await RegistrationService.getEmailLogs(regCode);
      if (logs && logs.length > 0) {
        setEmailLogs(logs);
      } else {
        // Fallback to FastAPI endpoint
        const res = await api.registrations.getEmailLogs(regCode);
        if (res && Array.isArray(res.data)) {
          setEmailLogs(res.data);
        } else {
          setEmailLogs([]);
        }
      }
    } catch (err) {
      console.warn('[RegistrationsAdmin] Error fetching email logs:', err);
      setEmailLogs([]);
    } finally {
      setLoadingEmailLogs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedReg?.registration_id) {
      fetchEmailLogs(selectedReg.registration_id);
    } else {
      setEmailLogs([]);
    }
  }, [selectedReg, fetchEmailLogs]);

  // ── Resend Confirmation Email ───────────────────────────────────────────────
  const handleResendConfirmationEmail = async (memberId?: string) => {
    if (!selectedReg) return;
    setResendingEmail(true);
    try {
      const res = await RegistrationService.resendConfirmationEmail(selectedReg.registration_id, memberId);
      if (res.success) {
        addToast('success', 'Confirmation Email Dispatched', `Confirmation email sent for team ${selectedReg.team_name}.`);
        await fetchEmailLogs(selectedReg.registration_id);
      } else {
        addToast('error', 'Email Delivery Notice', res.message || 'Unable to complete email dispatch.');
        await fetchEmailLogs(selectedReg.registration_id);
      }
    } catch (err: any) {
      addToast('error', 'Email Failed', err?.message || 'Error occurred during email dispatch.');
    } finally {
      setResendingEmail(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    totalRegistrations: registrations.length,
    totalTeams: registrations.length,
    totalParticipants: registrations.reduce((acc, r) => acc + (r.team_size || 1), 0),
    freeRegistrations: registrations.filter((r) => r.payment_status === 'not_required').length,
    paidRegistrations: registrations.filter((r) => r.payment_status === 'paid').length,
    paymentPending: registrations.filter((r) => r.payment_status === 'pending').length,
  }), [registrations]);

  const uniqueInstitutions = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => set.add(r.institutions?.name || 'SR University'));
    return Array.from(set).sort();
  }, [registrations]);

  // ── Filtering & Pagination ────────────────────────────────────────────────────

  const filteredRegistrations = useMemo(() =>
    registrations.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          !r.registration_id?.toLowerCase().includes(q) &&
          !r.team_name?.toLowerCase().includes(q) &&
          !r.leader_name?.toLowerCase().includes(q) &&
          !r.leader_email?.toLowerCase().includes(q) &&
          !r.institutions?.name?.toLowerCase().includes(q)
        ) return false;
      }
      if (paymentFilter !== 'ALL' && r.payment_status !== paymentFilter) return false;
      if (institutionFilter !== 'ALL') {
        const instName = r.institutions?.name || 'SR University';
        if (instName !== institutionFilter) return false;
      }
      if (typeFilter !== 'ALL' && r.participant_type !== typeFilter) return false;
      return true;
    }),
    [registrations, searchQuery, paymentFilter, institutionFilter, typeFilter]
  );

  const totalRecords = filteredRegistrations.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // ── Edit logic ────────────────────────────────────────────────────────────────

  const openEdit = (reg: JoinedRegistrationRecord) => {
    const members: EditMember[] = (reg.team_members || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      mobile: m.mobile || '',
      roll_number: m.roll_number || '',
      department: m.department || '',
      is_team_leader: m.is_team_leader,
    }));

    const proj = reg.projects?.[0];

    setEditForm({
      team_name: reg.team_name,
      participant_type: reg.participant_type,
      leader_name: reg.leader_name,
      leader_email: reg.leader_email,
      leader_mobile: reg.leader_mobile || '',
      payment_status: reg.payment_status,
      payment_amount: String(reg.payment_amount ?? 0),
      payment_reference: reg.payment_reference || '',
      team_members: members,
      project_title: proj?.title || '',
      project_category: proj?.category || '',
      project_problem_statement: proj?.problem_statement || '',
    });
    setEditError(null);
    setEditReg(reg);
  };

  const updateMember = (idx: number, field: keyof EditMember, value: string) => {
    setEditForm((f) => {
      if (!f) return f;
      const members = [...f.team_members];
      members[idx] = { ...members[idx], [field]: value };
      return { ...f, team_members: members };
    });
  };

  const handleEditSave = async () => {
    if (!editReg || !editForm) return;

    if (!editForm.team_name.trim()) {
      setEditError('Team Name is required.');
      return;
    }
    if (!editForm.leader_name.trim() || !editForm.leader_email.trim()) {
      setEditError('Leader Name and Email are required.');
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      await api.registrations.update(editReg.id, {
        team_name: editForm.team_name.trim(),
        participant_type: editForm.participant_type,
        leader_name: editForm.leader_name.trim(),
        leader_email: editForm.leader_email.trim(),
        leader_mobile: editForm.leader_mobile.trim() || null,
        payment_status: editForm.payment_status,
        payment_amount: parseFloat(editForm.payment_amount) || 0,
        payment_reference: editForm.payment_reference.trim() || null,
      });

      addToast('success', 'Registration updated', `${editForm.team_name} — changes saved successfully.`);
      setEditReg(null);
      setEditForm(null);
      await fetchRegistrations();
    } catch (err: any) {
      setEditError(err?.message || 'Update failed. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete logic ──────────────────────────────────────────────────────────────

  const openDelete = (reg: JoinedRegistrationRecord) => {
    setDeleteTarget(reg);
    setDeleteConfirmInput('');
    setDeleteStep(1);
  };

  const closeDelete = () => {
    setDeleteStep(0);
    setDeleteTarget(null);
    setDeleteConfirmInput('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmInput.trim() !== deleteTarget.registration_id) return;

    setDeleteLoading(true);
    try {
      try {
        await api.registrations.delete(deleteTarget.id);
      } catch (fastApiErr: any) {
        console.warn('[RegistrationsAdmin] FastAPI delete notice, attempting direct Supabase deletion:', fastApiErr);
        if (isSupabaseConfigured && supabase) {
          const { data: deletedRows, error: delErr } = await supabase
            .from('registrations')
            .delete()
            .eq('id', deleteTarget.id)
            .select('id, registration_id');

          if (delErr) {
            throw new Error(`Database error: ${delErr.message}`);
          }

          if (!deletedRows || deletedRows.length === 0) {
            throw new Error(`Deletion failed: Zero rows were deleted. Please verify admin permissions or session.`);
          }
        } else {
          throw fastApiErr;
        }
      }

      // Explicit verification check (confirm parent row no longer exists in PostgreSQL)
      if (isSupabaseConfigured && supabase) {
        const { data: verifyRow, error: verifyErr } = await supabase
          .from('registrations')
          .select('id')
          .eq('id', deleteTarget.id)
          .maybeSingle();

        if (verifyErr) {
          console.warn('[RegistrationsAdmin] Verification query warning:', verifyErr);
        }

        if (verifyRow) {
          throw new Error(`Deletion verification failed: Record ${deleteTarget.registration_id} is still present in PostgreSQL.`);
        }
      }

      addToast('success', 'Registration deleted', 'Registration deleted successfully from database.');
      closeDelete();
      await fetchRegistrations();
    } catch (err: any) {
      console.error('Registration deletion error:', err);
      addToast('error', 'Deletion failed', err?.message || 'Unable to delete registration. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteConfirmMatches =
    deleteTarget !== null && deleteConfirmInput.trim() === deleteTarget.registration_id;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004182]" />
            <h2 className="text-xl font-extrabold text-slate-900">Registrations Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View, edit, and manage official PRAGATHI 2K26 registered teams stored in Supabase.
          </p>
        </div>
        <button
          onClick={fetchRegistrations}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Registrations', value: stats.totalRegistrations, color: 'text-[#004182]', Icon: FileText },
          { label: 'Total Teams', value: stats.totalTeams, color: 'text-slate-900', Icon: Users },
          { label: 'Total Participants', value: stats.totalParticipants, color: 'text-indigo-600', Icon: User },
          { label: 'Free Registrations', value: stats.freeRegistrations, color: 'text-emerald-600', Icon: Sparkles },
          { label: 'Paid Registrations', value: stats.paidRegistrations, color: 'text-emerald-700', Icon: CreditCard },
          { label: 'Payment Pending', value: stats.paymentPending, color: 'text-amber-600', Icon: CreditCard },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold block">{label}</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold ${color}`}>{value}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by ID, Team, Leader, Email, Institution..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          >
            <option value="ALL">All Participant Types</option>
            <option value="sru_student">SR University Student</option>
            <option value="external_student">External Participant</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          >
            <option value="ALL">All Payments</option>
            <option value="not_required">Free / Not Required (₹0)</option>
            <option value="paid">Paid</option>
            <option value="pending">Payment Pending</option>
          </select>
          <select
            value={institutionFilter}
            onChange={(e) => { setInstitutionFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          >
            <option value="ALL">All Institutions</option>
            {uniqueInstitutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table / States ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading registrations from Supabase...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={fetchRegistrations}
            className="inline-flex items-center gap-1.5 bg-[#004182] hover:bg-[#003366] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      ) : paginatedRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No registrations found.</p>
          <p className="text-xs text-slate-400">
            {searchQuery || paymentFilter !== 'ALL' || institutionFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try resetting your search query or filter selections.'
              : 'Public registrations will appear here once submitted.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Registration ID', 'Team & Leader', 'Institution', 'Type & Size', 'Status', 'Payment', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px] ${i === 6 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">

                    {/* ID */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#004182] font-mono text-xs block">{r.registration_id}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Team & Leader */}
                    <td className="px-4 py-4">
                      <span className="font-extrabold text-slate-900 block text-xs">{r.team_name}</span>
                      <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">{r.leader_name}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{r.leader_email}</span>
                    </td>

                    {/* Institution */}
                    <td className="px-4 py-4 max-w-[200px]">
                      <span className="font-bold text-slate-800 block truncate">{r.institutions?.name || 'SR University'}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                        {r.institutions?.institution_type || 'University'}
                      </span>
                    </td>

                    {/* Type & Size */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100">
                        {r.participant_type === 'sru_student' ? 'SRU Student' : 'External'}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-semibold mt-1">
                        {r.team_size} {r.team_size === 1 ? 'Member' : 'Members'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={r.registration_status} />
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <PaymentBadge status={r.payment_status} amount={r.payment_amount} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPendingPayment(r) && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(r)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Approve Payment"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectPayment(r)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Reject Payment"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {/* View */}
                        <button
                          onClick={() => setSelectedReg(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#004182] text-slate-600 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#004182] text-[#004182] hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                          title="Edit Registration"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => openDelete(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} registrations
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">Page {currentPage} of {totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={!!selectedReg}
        onClose={() => setSelectedReg(null)}
        title="Registration Record Details"
        maxWidth="xl"
      >
        {selectedReg && (
          <div className="space-y-3 text-xs text-slate-700">
            {/* Header info bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block leading-tight">Registration ID</span>
                <span className="font-extrabold text-[#004182] font-mono text-sm sm:text-base">{selectedReg.registration_id}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block leading-tight">Registration Date</span>
                <span className="font-bold text-slate-800 text-xs">
                  {new Date(selectedReg.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block leading-tight mb-0.5">Registration Status</span>
                <StatusBadge status={selectedReg.registration_status} />
              </div>
            </div>

            {/* Team Overview */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <Users className="w-3.5 h-3.5" /><span className="uppercase tracking-wider">Team Overview</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Name</span>
                  <strong className="text-slate-900 text-xs font-bold">{selectedReg.team_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Size</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedReg.team_size} Members</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Participant Type</span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedReg.participant_type === 'sru_student' ? 'SR University Student' : 'External Participant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Leader */}
            <div className="border border-slate-200/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <User className="w-3.5 h-3.5" /><span className="uppercase tracking-wider">Team Leader Contact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Name</span><strong className="text-slate-900 text-xs">{selectedReg.leader_name}</strong></div>
                <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span><span className="font-semibold text-slate-800 text-xs">{selectedReg.leader_email}</span></div>
                <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Phone</span><span className="font-semibold text-slate-800 text-xs">{selectedReg.leader_mobile || 'N/A'}</span></div>
              </div>
            </div>

            {/* Institution */}
            <div className="border border-slate-200/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <Building className="w-3.5 h-3.5" /><span className="uppercase tracking-wider">Institution Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Institution Name</span><strong className="text-slate-900 text-xs">{selectedReg.institutions?.name || 'SR University, Warangal'}</strong></div>
                <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Type</span><span className="font-semibold text-slate-800 uppercase text-xs">{selectedReg.institutions?.institution_type || 'University'}</span></div>
              </div>
            </div>

            {/* Team Members */}
            <div className="border border-slate-200/80 rounded-xl p-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
                <div className="flex items-center gap-1.5 text-[#004182] font-bold text-[11px]">
                  <Users className="w-3.5 h-3.5" /><span className="uppercase tracking-wider">Team Members</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] px-2 py-0.5 rounded border border-blue-100">
                  {selectedReg.team_members?.length || selectedReg.team_size} Members
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedReg.team_members && selectedReg.team_members.length > 0
                  ? selectedReg.team_members.map((m, idx) => (
                    <div key={m.id || idx} className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                        <span className="text-[10px] text-slate-500 block">{m.email}{m.mobile ? ` • ${m.mobile}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.roll_number && <span className="text-[10px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{m.roll_number}</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.is_team_leader ? 'bg-blue-50 text-[#004182] border-blue-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {m.is_team_leader ? 'Leader' : 'Member'}
                        </span>
                      </div>
                    </div>
                  ))
                  : <p className="text-slate-400 italic text-center py-1 text-[11px]">No team member records associated.</p>
                }
              </div>
            </div>

            {/* Projects */}
            <div className="border border-slate-200/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-2 text-[11px]">
                <Layers className="w-3.5 h-3.5" /><span className="uppercase tracking-wider">Project Information</span>
              </div>
              {selectedReg.projects && selectedReg.projects.length > 0
                ? selectedReg.projects.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title</span><strong className="text-slate-900 text-xs sm:text-sm">{p.title}</strong></div>
                    <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Domain / Track</span>
                      <span className="inline-block bg-blue-50 text-[#004182] font-bold px-2 py-0.5 rounded border border-blue-100 text-[11px] mt-0.5">{p.category}</span>
                    </div>
                    {p.problem_statement && (
                      <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Problem Statement</span>
                        <p className="text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 mt-1 text-xs leading-relaxed max-h-32 overflow-y-auto">{p.problem_statement}</p>
                      </div>
                    )}
                  </div>
                ))
                : <p className="text-slate-400 italic text-center py-1 text-[11px]">No project details associated.</p>
              }
            </div>

            {/* Payment & Manual Verification Section */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-1.5 text-[#004182] font-bold text-[11px]">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">Payment Details & Manual Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isExternalRegistration(selectedReg) && (
                    <button
                      type="button"
                      onClick={() => handleViewProof(selectedReg)}
                      disabled={loadingProof}
                      className="inline-flex items-center gap-1 bg-blue-50 hover:bg-[#004182] text-[#004182] hover:text-white font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingProof ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                      <span>View Payment Proof</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <div className="mt-0.5"><PaymentBadge status={selectedReg.payment_status} amount={selectedReg.payment_amount} /></div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Amount</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{selectedReg.payment_amount}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Transaction ID / Reference</span>
                  <span className="font-mono text-slate-800 font-bold text-xs">
                    {selectedReg.payments?.[0]?.transaction_id || selectedReg.payment_reference || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Admin Action Bar for Pending External Payments */}
              {isPendingPayment(selectedReg) && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 bg-amber-50/60 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-amber-900">
                    <span className="font-extrabold block">Admin Verification Action Required</span>
                    <span className="text-[10px] text-amber-700">Review proof before approving. Approving will trigger the confirmation email.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectPayment(selectedReg)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovePayment(selectedReg)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Approve Payment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Email Delivery Status & Tracking */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5 text-[#004182] font-bold text-[11px]">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">Confirmation Emails</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleResendConfirmationEmail()}
                  disabled={resendingEmail}
                  className="inline-flex items-center gap-1 bg-[#004182] hover:bg-[#003366] text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Resend confirmation email to all team members"
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Resend Confirmation Email</span>
                    </>
                  )}
                </button>
              </div>

              {loadingEmailLogs ? (
                <div className="flex items-center justify-center py-3 gap-2 text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px]">Loading email delivery records...</span>
                </div>
              ) : emailLogs && emailLogs.length > 0 ? (
                <div className="space-y-1.5">
                  {emailLogs.map((log) => {
                    const isSent = log.status === 'sent';
                    const isPending = log.status === 'pending';
                    const isFailed = log.status === 'failed';
                    return (
                      <div
                        key={log.id || `${log.recipient_email}-${log.created_at}`}
                        className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-200/70 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">{log.recipient_name}</span>
                            <span className="text-[10px] font-bold text-[#004182] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              {log.recipient_role || 'Member'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate">{log.recipient_email}</span>
                          {log.error_message && (
                            <span className="text-[10px] text-rose-600 block mt-0.5 font-medium truncate max-w-sm">
                              Error: {log.error_message}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Sent
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Failed
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {log.sent_at
                              ? new Date(log.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : log.created_at
                              ? new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center space-y-1">
                  <p className="text-slate-400 italic text-[11px]">
                    No email logs found yet. Confirmation emails trigger automatically upon submission.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleResendConfirmationEmail()}
                    disabled={resendingEmail}
                    className="text-[11px] text-[#004182] font-bold hover:underline cursor-pointer"
                  >
                    Click here to send confirmation email now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editReg}
        onClose={() => { setEditReg(null); setEditForm(null); setEditError(null); }}
        title="Edit Registration"
        subtitle={editReg?.registration_id}
        maxWidth="xl"
        footer={
          <>
            <button
              onClick={() => { setEditReg(null); setEditForm(null); setEditError(null); }}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={editSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#004182] hover:bg-[#003366] text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {editSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editForm && editReg && (
          <div className="space-y-4">

            {/* Error Banner */}
            {editError && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{editError}</span>
              </div>
            )}

            {/* ── Team Info ── */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#004182] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Team Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LabeledInput
                  label="Team Name" id="edit-team-name" required
                  value={editForm.team_name}
                  onChange={(v) => setEditForm((f) => f ? { ...f, team_name: v } : f)}
                />
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Participant Type
                  </label>
                  <select
                    value={editForm.participant_type}
                    onChange={(e) => setEditForm((f) => f ? { ...f, participant_type: e.target.value as EditFormState['participant_type'] } : f)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="sru_student">SR University Student</option>
                    <option value="external_student">External Participant</option>
                  </select>
                </div>
              </div>
              <LabeledInput
                label="Registration ID" id="edit-reg-id" readOnly
                value={editReg.registration_id}
                onChange={() => {}}
              />
            </div>

            {/* ── Team Leader ── */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#004182] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Team Leader
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <LabeledInput label="Leader Name" id="edit-leader-name" required
                  value={editForm.leader_name}
                  onChange={(v) => setEditForm((f) => f ? { ...f, leader_name: v } : f)}
                />
                <LabeledInput label="Leader Email" id="edit-leader-email" type="email" required
                  value={editForm.leader_email}
                  onChange={(v) => setEditForm((f) => f ? { ...f, leader_email: v } : f)}
                />
                <LabeledInput label="Phone Number" id="edit-leader-mobile"
                  value={editForm.leader_mobile}
                  onChange={(v) => setEditForm((f) => f ? { ...f, leader_mobile: v } : f)}
                />
              </div>
            </div>

            {/* ── Team Members ── */}
            {editForm.team_members.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#004182] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Team Members ({editForm.team_members.length})
                </p>
                <div className="space-y-3">
                  {editForm.team_members.map((member, idx) => (
                    <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${member.is_team_leader ? 'bg-blue-50 text-[#004182] border-blue-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {member.is_team_leader ? 'Team Leader' : `Member ${idx + 1}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <LabeledInput label="Full Name" id={`member-name-${idx}`}
                          value={member.name}
                          onChange={(v) => updateMember(idx, 'name', v)}
                        />
                        <LabeledInput label="Email" id={`member-email-${idx}`} type="email"
                          value={member.email}
                          onChange={(v) => updateMember(idx, 'email', v)}
                        />
                        <LabeledInput label="Phone" id={`member-mobile-${idx}`}
                          value={member.mobile}
                          onChange={(v) => updateMember(idx, 'mobile', v)}
                        />
                        <LabeledInput label="Roll Number" id={`member-roll-${idx}`}
                          value={member.roll_number}
                          onChange={(v) => updateMember(idx, 'roll_number', v)}
                        />
                        <LabeledInput label="Department" id={`member-dept-${idx}`}
                          value={member.department}
                          onChange={(v) => updateMember(idx, 'department', v)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Project ── */}
            {editReg.projects && editReg.projects.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#004182] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Project Information
                </p>
                <LabeledInput label="Project Title" id="edit-proj-title"
                  value={editForm.project_title}
                  onChange={(v) => setEditForm((f) => f ? { ...f, project_title: v } : f)}
                />
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Domain / Innovation Track
                  </label>
                  <select
                    value={editForm.project_category}
                    onChange={(e) => setEditForm((f) => f ? { ...f, project_category: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="">— Select Domain —</option>
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Problem Statement / Abstract
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.project_problem_statement}
                    onChange={(e) => setEditForm((f) => f ? { ...f, project_problem_statement: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y bg-white"
                    placeholder="Project problem statement or abstract..."
                  />
                </div>
              </div>
            )}

            {/* ── Payment ── */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#004182] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Payment Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editForm.payment_status}
                    onChange={(e) => setEditForm((f) => f ? { ...f, payment_status: e.target.value } : f)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="not_required">Not Required (Free)</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <LabeledInput label="Payment Amount (₹)" id="edit-pay-amount" type="number"
                  value={editForm.payment_amount}
                  onChange={(v) => setEditForm((f) => f ? { ...f, payment_amount: v } : f)}
                />
                <LabeledInput label="Payment Reference / Transaction ID" id="edit-pay-ref"
                  value={editForm.payment_reference}
                  onChange={(v) => setEditForm((f) => f ? { ...f, payment_reference: v } : f)}
                />
              </div>
            </div>

            {/* No Supabase warning */}
            {!isSupabaseConfigured && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Supabase is not configured — changes cannot be saved to the database.</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Step 1 Modal */}
      <Modal
        isOpen={deleteStep === 1}
        onClose={closeDelete}
        title="Delete Registration?"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={closeDelete}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => setDeleteStep(2)}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
            >
              Continue -&gt;
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-4">
            {/* Registration summary */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Registration ID</span>
                <span className="font-extrabold font-mono text-[#004182]">{deleteTarget.registration_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Team Name</span>
                <span className="font-bold text-slate-800">{deleteTarget.team_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Team Leader</span>
                <span className="font-bold text-slate-800">{deleteTarget.leader_name}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-rose-800 mb-1">This action cannot be undone.</p>
                <p className="text-rose-700">
                  This will permanently delete this registration and all its associated data including team members, project details, and payment records.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Step 2 Modal */}
      <Modal
        isOpen={deleteStep === 2}
        onClose={closeDelete}
        title="Confirm Permanent Deletion"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={closeDelete}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!deleteConfirmMatches || deleteLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleteLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
              {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-rose-800 font-semibold">
                This is your final confirmation. Type the Registration ID exactly as shown below to enable permanent deletion.
              </p>
            </div>

            {/* Show the ID to type */}
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Registration ID to confirm</p>
              <div className="inline-block bg-slate-900 text-white font-mono font-extrabold text-sm px-4 py-2 rounded-xl tracking-widest select-all">
                {deleteTarget.registration_id}
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type Registration ID to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={`e.g. ${deleteTarget.registration_id}`}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 transition-colors ${
                  deleteConfirmInput
                    ? deleteConfirmMatches
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-200'
                      : 'border-rose-300 bg-rose-50 text-rose-800 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 bg-white focus:border-[#004182] focus:ring-blue-100'
                }`}
                autoComplete="off"
                spellCheck={false}
              />
              {deleteConfirmInput && !deleteConfirmMatches && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <X className="w-3 h-3" /> ID does not match - check and try again
                </p>
              )}
              {deleteConfirmMatches && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ID confirmed - you may now delete permanently
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Proof View Lightbox Modal */}
      <Modal
        isOpen={!!proofModalUrl}
        onClose={() => setProofModalUrl(null)}
        title="Private Payment Proof Screenshot"
        maxWidth="lg"
      >
        {proofModalUrl && (
          <div className="space-y-4 text-center">
            <div className="bg-slate-900 rounded-2xl p-2 max-h-[70vh] overflow-auto flex items-center justify-center border border-slate-800">
              {proofModalUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={proofModalUrl}
                  title="Payment Proof PDF Document"
                  className="w-full h-[60vh] rounded-xl border-none"
                />
              ) : (
                <img
                  src={proofModalUrl}
                  alt="Payment Proof Screenshot"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                🔒 Secure Short-Lived Signed URL Active
              </span>
              <a
                href={proofModalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#004182] font-bold hover:underline"
              >
                <span>Open in New Tab</span>
                <Eye className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
