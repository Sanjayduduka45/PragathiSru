import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  X,
  Save,
  Mail,
  Building,
  RefreshCw,
  Award,
  UserCheck,
  UserX,
  Lock,
  Copy,
  Check,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { Judge, JudgeStats } from '../../types';
import { JudgeService } from '../../services/judgeService';
import { EvaluationService } from '../../services/evaluationService';
import { Evaluation } from '../../types';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Modal } from '../../components/ui/Modal';

export const JudgesAdmin: React.FC = () => {
  const { user: currentAdmin } = useAdminAuth();
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [judges, setJudges] = useState<Judge[]>([]);
  const [stats, setStats] = useState<JudgeStats>({
    totalJudges: 0,
    activeJudges: 0,
    totalEvaluations: 0,
    pendingEvaluations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create Judge Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    department: '',
    temporaryPassword: '',
    isActive: true,
  });

  // Ephemeral Credentials Confirmation Modal State (shown only once)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);

  // View Judge Evaluations Modal State
  const [viewEvalsModalOpen, setViewEvalsModalOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [judgeEvals, setJudgeEvals] = useState<Evaluation[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(false);

  // Delete Judge Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<Judge | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedJudges, fetchedStats] = await Promise.all([
        JudgeService.getJudges(),
        JudgeService.getJudgeStats(),
      ]);
      setJudges(fetchedJudges);
      setStats(fetchedStats);
    } catch (err) {
      console.error('[JudgesAdmin] Failed to load data:', err);
      addToast('error', 'Load Error', 'Could not load judges list.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create Judge
  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const tempPassword = formState.temporaryPassword.trim();

    if (!trimmedName || !trimmedEmail) {
      addToast('error', 'Validation Failed', 'Full Name and Email Address are required.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      addToast('error', 'Validation Failed', 'Please enter a valid email address.');
      return;
    }

    if (!tempPassword || tempPassword.length < 6) {
      addToast('error', 'Validation Failed', 'Temporary password must be at least 6 characters.');
      return;
    }

    setCreating(true);
    try {
      const res = await JudgeService.createJudge(
        {
          name: trimmedName,
          email: trimmedEmail,
          department: formState.department,
          temporaryPassword: tempPassword,
          isActive: formState.isActive,
        },
        currentAdmin?.email || 'admin@sru.edu.in'
      );

      if (res.success) {
        addToast('success', 'Judge Created', `Judge account for ${trimmedName} has been registered.`);
        
        // Save ephemeral credentials for confirmation modal
        setCreatedCredentials({
          name: trimmedName,
          email: trimmedEmail,
          temporaryPassword: tempPassword,
        });

        // Close creation modal and open credentials modal
        setCreateModalOpen(false);
        setCredentialsModalOpen(true);
        setCopied(false);
        setShowConfirmedPassword(false);

        // Wipe sensitive form state immediately
        setFormState({
          name: '',
          email: '',
          department: '',
          temporaryPassword: '',
          isActive: true,
        });
        setShowPassword(false);

        loadData();
      } else {
        addToast('error', 'Creation Failed', res.error || 'Could not create judge.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'An unexpected error occurred.');
    } finally {
      setCreating(false);
    }
  };

  // Copy Credentials Helper
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const loginUrl = `${window.location.origin}/login`;
    const text = `PRAGATHI 2K26 — Judge Login Credentials
Name: ${createdCredentials.name}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.temporaryPassword}
Login URL: ${loginUrl}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      addToast('success', 'Copied to Clipboard', 'Judge credentials copied successfully.');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Close Credentials Confirmation and Discard Password from memory
  const handleCloseCredentialsModal = () => {
    setCredentialsModalOpen(false);
    setCreatedCredentials(null);
    setCopied(false);
    setShowConfirmedPassword(false);
  };

  // Handle Status Toggle
  const handleToggleStatus = async (judge: Judge) => {
    const newStatus = !judge.isActive;
    try {
      const res = await JudgeService.updateJudgeStatus(judge.id, newStatus);
      if (res.success) {
        setJudges((prev) =>
          prev.map((j) => (j.id === judge.id ? { ...j, isActive: newStatus } : j))
        );
        setStats((s) => ({
          ...s,
          activeJudges: newStatus ? s.activeJudges + 1 : s.activeJudges - 1,
        }));
        addToast(
          'info',
          'Status Updated',
          `${judge.name} is now ${newStatus ? 'Active' : 'Suspended'}.`
        );
      } else {
        addToast('error', 'Update Failed', res.error || 'Failed to update status.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    }
  };

  // Handle View Evaluations
  const handleOpenViewEvals = async (judge: Judge) => {
    setSelectedJudge(judge);
    setViewEvalsModalOpen(true);
    setLoadingEvals(true);
    try {
      const evals = await EvaluationService.getEvaluationsByJudge(judge.email);
      setJudgeEvals(evals);
    } catch (err) {
      console.error('[JudgesAdmin] Failed to load judge evals:', err);
    } finally {
      setLoadingEvals(false);
    }
  };

  // Handle Delete Judge
  const handleConfirmDelete = async () => {
    if (!judgeToDelete) return;
    setDeleting(true);
    try {
      const res = await JudgeService.deleteJudge(judgeToDelete.id);
      if (res.success) {
        addToast('success', 'Judge Removed', `Removed judge account for ${judgeToDelete.name}.`);
        setDeleteModalOpen(false);
        setJudgeToDelete(null);
        loadData();
      } else {
        addToast('error', 'Delete Failed', res.error || 'Could not delete judge.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter judges
  const filteredJudges = judges.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && j.isActive) ||
      (statusFilter === 'inactive' && !j.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Judge Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, authenticate, and monitor event evaluators for PRAGATHI 2K26.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Judge
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Judges</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalJudges}</p>
          <p className="text-[11px] text-slate-500 font-medium">Registered evaluators</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Active Judges</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.activeJudges}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Active status</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182]">Total Evaluations</p>
          <p className="text-2xl font-extrabold text-[#004182]">{stats.totalEvaluations}</p>
          <p className="text-[11px] text-slate-500 font-medium">Submitted scorecards</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Pending Evaluations</p>
          <p className="text-2xl font-extrabold text-amber-700">{stats.pendingEvaluations}</p>
          <p className="text-[11px] text-amber-600 font-medium">Based on 3 evals/team</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by judge name, email, or department..."
            className="w-full pl-9.5 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#004182] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Judges List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto mb-2" />
          Loading judges directory...
        </div>
      ) : filteredJudges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {searchTerm || statusFilter !== 'all' ? 'No judges found' : 'No judges created yet.'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Try changing your search keywords or status filter.'
              : 'Click "+ Create Judge" above to register an evaluator.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJudges.map((judge) => (
            <div
              key={judge.id}
              className={`bg-white rounded-2xl border p-5 transition-all space-y-4 hover:shadow-sm ${
                judge.isActive ? 'border-slate-200' : 'border-slate-200/60 bg-slate-50/70'
              }`}
            >
              {/* Top Row: Name, Status & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center font-extrabold text-sm shrink-0">
                    {judge.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {judge.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                      {judge.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                    judge.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {judge.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Suspended
                    </>
                  )}
                </span>
              </div>

              {/* Department / Specialization */}
              {judge.department && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-xl">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{judge.department}</span>
                </div>
              )}

              {/* Statistics & Activity */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluations</span>
                  <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#004182]" />
                    {judge.evaluationsCompleted} Completed
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Last Activity</span>
                  <p className="font-medium text-slate-600 truncate">
                    {judge.lastEvaluationAt
                      ? new Date(judge.lastEvaluationAt).toLocaleDateString()
                      : 'None yet'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenViewEvals(judge)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Evaluations ({judge.evaluationsCompleted})
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(judge)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      judge.isActive
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={judge.isActive ? 'Suspend Judge' : 'Activate Judge'}
                  >
                    {judge.isActive ? (
                      <>
                        <UserX className="w-3 h-3" /> Suspend
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3" /> Activate
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJudgeToDelete(judge);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Judge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE JUDGE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Judge Account"
      >
        <form onSubmit={handleCreateJudge} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Register an evaluator account with <code className="font-mono bg-blue-50 text-[#004182] px-1 py-0.5 rounded">role = "judge"</code>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Ravi Kumar"
              value={formState.name}
              onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. ravi@example.com"
              value={formState.email}
              onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department / Specialization
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Science & AI"
              value={formState.department}
              onChange={(e) => setFormState((s) => ({ ...s, department: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Temporary Password *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Min. 6 characters</span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Enter temporary password"
                value={formState.temporaryPassword}
                onChange={(e) => setFormState((s) => ({ ...s, temporaryPassword: e.target.value }))}
                className="w-full pl-9.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              The judge will use this password to sign in via the common login page.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_checkbox"
              checked={formState.isActive}
              onChange={(e) => setFormState((s) => ({ ...s, isActive: e.target.checked }))}
              className="rounded border-slate-300 text-[#004182] focus:ring-[#004182]"
            />
            <label htmlFor="is_active_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
              Account Active Immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create Judge
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIALS CONFIRMATION MODAL (SHOWN ONCE UPON SUCCESSFUL CREATION) */}
      <Modal
        isOpen={credentialsModalOpen}
        onClose={handleCloseCredentialsModal}
        title="Judge Account Created"
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Judge account created successfully
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  The judge profile is registered and ready to evaluate projects during PRAGATHI 2K26.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Account Credentials
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                  Judge Role
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Judge Name</span>
                  <p className="font-extrabold text-slate-900">{createdCredentials.name}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <p className="font-mono font-bold text-slate-900">{createdCredentials.email}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Temporary Password</span>
                    <button
                      type="button"
                      onClick={() => setShowConfirmedPassword((v) => !v)}
                      className="text-[11px] font-bold text-[#004182] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      {showConfirmedPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Reveal
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-black bg-white px-3 py-1.5 rounded-xl border border-slate-200 mt-1 text-slate-900 flex items-center justify-between">
                    <span>
                      {showConfirmedPassword ? createdCredentials.temporaryPassword : '••••••••••••'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                <strong>Important:</strong> Share these credentials securely with the judge. The temporary password should be changed after the first login.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseCredentialsModal}
                className="px-5 py-2.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* VIEW EVALUATIONS MODAL */}
      <Modal
        isOpen={viewEvalsModalOpen}
        onClose={() => setViewEvalsModalOpen(false)}
        title={selectedJudge ? `${selectedJudge.name}'s Evaluated Projects` : 'Evaluations'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {loadingEvals ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto mb-2" />
              Loading submitted scorecards...
            </div>
          ) : judgeEvals.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Award className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No evaluations submitted yet</p>
              <p className="text-xs text-slate-400">This judge has not submitted any evaluations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {judgeEvals.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-[#004182] px-1.5 py-0.5 rounded">
                        {ev.registrationId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{ev.teamName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{ev.projectTitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-[#004182]">{ev.totalScore}</span>
                      <span className="text-xs text-slate-400 font-bold"> / 100</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(ev.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {ev.comments && (
                    <div className="pt-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="font-bold text-slate-500 block text-[10px] uppercase">Comments:</span>
                      <p className="italic mt-0.5">{ev.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewEvalsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Removal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to remove the judge entry for{' '}
            <strong className="text-slate-900">{judgeToDelete?.name}</strong> ({judgeToDelete?.email})?
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirm Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
