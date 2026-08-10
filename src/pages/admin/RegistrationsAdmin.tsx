import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building,
  User,
  Mail,
  Phone,
  Layers,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Users,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { Modal } from '../../components/ui/Modal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';

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

export const RegistrationsAdmin: React.FC = () => {
  const [registrations, setRegistrations] = useState<JoinedRegistrationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Detail Modal State
  const [selectedReg, setSelectedReg] = useState<JoinedRegistrationRecord | null>(null);

  // Action Confirmation Modals
  const [actionReg, setActionReg] = useState<JoinedRegistrationRecord | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const { toasts, addToast, dismissToast } = useAdminToast();

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please check your environment configuration.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('registrations')
        .select(`
          *,
          institutions(*),
          team_members(*),
          projects(*),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        console.error('Error fetching registrations:', fetchErr);
        setError('Unable to load registrations from database. Please try again.');
      } else {
        setRegistrations((data as JoinedRegistrationRecord[]) || []);
      }
    } catch (err: any) {
      console.error('Fetch exception:', err);
      setError('An unexpected error occurred while fetching registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = r.registration_id?.toLowerCase().includes(q);
        const matchTeam = r.team_name?.toLowerCase().includes(q);
        const matchLeader = r.leader_name?.toLowerCase().includes(q);
        const matchEmail = r.leader_email?.toLowerCase().includes(q);
        const matchInst = r.institutions?.name?.toLowerCase().includes(q);
        if (!matchId && !matchTeam && !matchLeader && !matchEmail && !matchInst) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (r.registration_status !== statusFilter) return false;
      }

      // Payment filter
      if (paymentFilter !== 'ALL') {
        if (r.payment_status !== paymentFilter) return false;
      }

      // Participant type filter
      if (typeFilter !== 'ALL') {
        if (r.participant_type !== typeFilter) return false;
      }

      return true;
    });
  }, [registrations, searchQuery, statusFilter, paymentFilter, typeFilter]);

  // Paginated records
  const totalRecords = filteredRegistrations.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Update Status handler (Approve / Reject)
  const handleUpdateStatus = async () => {
    if (!actionReg || !actionType || !supabase) return;

    setUpdatingStatus(true);
    const newStatus = actionType === 'approve' ? 'approved' : 'rejected';

    try {
      const { error: updateErr } = await supabase
        .from('registrations')
        .update({
          registration_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionReg.id);

      if (updateErr) {
        console.error(`Error updating registration to ${newStatus}:`, updateErr);
        addToast('error', 'Status Update Failed', updateErr.message || 'Database update error.');
      } else {
        addToast(
          'success',
          `Registration ${newStatus.toUpperCase()}`,
          `Registration ${actionReg.registration_id} has been marked as ${newStatus}.`
        );
        // Refresh local state & details modal if open
        setRegistrations((prev) =>
          prev.map((r) => (r.id === actionReg.id ? { ...r, registration_status: newStatus } : r))
        );
        if (selectedReg?.id === actionReg.id) {
          setSelectedReg((prev) => (prev ? { ...prev, registration_status: newStatus } : null));
        }
      }
    } catch (err: any) {
      console.error('Update status exception:', err);
      addToast('error', 'Update Exception', 'An unexpected error occurred.');
    } finally {
      setUpdatingStatus(false);
      setActionReg(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'submitted':
      case 'under_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string, amount: number) => {
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
      case 'not_required':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
            Not Required (₹0)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004182]" />
            <h2 className="text-xl font-extrabold text-slate-900">Registrations Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View, filter, inspect, and manage official PRAGATHI 2K26 team submissions.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID, Team, Leader, Email, Institution..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="ALL">All Registration Statuses</option>
              <option value="submitted">Submitted (Pending Review)</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="not_required">Not Required (₹0)</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending Payment</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Participant Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="ALL">All Participant Types</option>
              <option value="sru_student">SR University Student</option>
              <option value="external_student">External Participant</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table / List View */}
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
            className="text-xs text-[#004182] font-bold hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : paginatedRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No registrations found.</p>
          <p className="text-xs text-slate-400">
            {searchQuery || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || typeFilter !== 'ALL'
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
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Registration ID
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Team & Leader
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Institution
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Type & Size
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Status
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                    Payment
                  </th>
                  <th className="px-4 py-3.5 font-extrabold uppercase tracking-wider text-slate-400 text-[10px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* ID */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#004182] font-mono text-xs block">
                        {r.registration_id}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Team & Leader */}
                    <td className="px-4 py-4">
                      <span className="font-extrabold text-slate-900 block text-xs">
                        {r.team_name}
                      </span>
                      <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">
                        {r.leader_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                        {r.leader_email}
                      </span>
                    </td>

                    {/* Institution */}
                    <td className="px-4 py-4 max-w-[200px]">
                      <span className="font-bold text-slate-800 block truncate">
                        {r.institutions?.name || 'SR University'}
                      </span>
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

                    {/* Registration Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(r.registration_status)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getPaymentBadge(r.payment_status, r.payment_amount)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Detail View */}
                        <button
                          onClick={() => setSelectedReg(r)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="View Registration Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Approve (only for submitted) */}
                        {r.registration_status === 'submitted' && (
                          <>
                            <button
                              onClick={() => {
                                setActionReg(r);
                                setActionType('approve');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setActionReg(r);
                                setActionType('reject');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)}–
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} registrations
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      <Modal
        isOpen={!!selectedReg}
        onClose={() => setSelectedReg(null)}
        title="Registration Detail Inspector"
        maxWidth="xl"
      >
        {selectedReg && (
          <div className="space-y-6 text-xs text-slate-700">

            {/* Header info bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Registration ID</span>
                <span className="font-extrabold text-[#004182] font-mono text-base">{selectedReg.registration_id}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Submitted On</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedReg.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Registration Status</span>
                <div className="mt-0.5">{getStatusBadge(selectedReg.registration_status)}</div>
              </div>
            </div>

            {/* Action Bar inside detail modal */}
            {selectedReg.registration_status === 'submitted' && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Admin Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActionReg(selectedReg);
                      setActionType('approve');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Approve Registration
                  </button>
                  <button
                    onClick={() => {
                      setActionReg(selectedReg);
                      setActionType('reject');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Leader Info */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#004182] font-bold border-b border-slate-100 pb-2">
                <User className="w-4 h-4" />
                <span className="uppercase text-[10px] tracking-wider">Team Leader Contact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Name</span>
                  <strong className="text-slate-900 text-xs">{selectedReg.leader_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
                  <span className="font-semibold text-slate-800">{selectedReg.leader_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Phone</span>
                  <span className="font-semibold text-slate-800">{selectedReg.leader_mobile || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Institution Info */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#004182] font-bold border-b border-slate-100 pb-2">
                <Building className="w-4 h-4" />
                <span className="uppercase text-[10px] tracking-wider">Institution Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution Name</span>
                  <strong className="text-slate-900 text-xs">{selectedReg.institutions?.name || 'SR University, Warangal'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Type</span>
                  <span className="font-semibold text-slate-800 uppercase">{selectedReg.institutions?.institution_type || 'University'}</span>
                </div>
              </div>
            </div>

            {/* Team Roster */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-[#004182] font-bold">
                  <Users className="w-4 h-4" />
                  <span className="uppercase text-[10px] tracking-wider">Team Roster ({selectedReg.team_name})</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] px-2 py-0.5 rounded border border-blue-100">
                  Size: {selectedReg.team_size}
                </span>
              </div>

              <div className="space-y-2">
                {selectedReg.team_members && selectedReg.team_members.length > 0 ? (
                  selectedReg.team_members.map((m, idx) => (
                    <div key={m.id || idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="text-[10px] text-slate-500 block">{m.email} {m.mobile ? `• ${m.mobile}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.roll_number && (
                          <span className="text-[10px] font-mono bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {m.roll_number}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          m.is_team_leader
                            ? 'bg-blue-50 text-[#004182] border-blue-100'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}>
                          {m.is_team_leader ? 'Leader' : 'Member'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-center py-2">No team member records associated.</p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#004182] font-bold border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4" />
                <span className="uppercase text-[10px] tracking-wider">Project Information</span>
              </div>

              {selectedReg.projects && selectedReg.projects.length > 0 ? (
                selectedReg.projects.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title</span>
                      <strong className="text-slate-900 text-sm">{p.title}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Track Category</span>
                      <span className="inline-block bg-blue-50 text-[#004182] font-bold px-2.5 py-0.5 rounded border border-blue-100 mt-0.5">
                        {p.category}
                      </span>
                    </div>
                    {p.problem_statement && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Abstract / Problem Statement</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1 leading-relaxed">
                          {p.problem_statement}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-center py-2">No project details associated.</p>
              )}
            </div>

            {/* Payment Details */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#004182] font-bold border-b border-slate-100 pb-2">
                <CreditCard className="w-4 h-4" />
                <span className="uppercase text-[10px] tracking-wider">Payment Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <div className="mt-0.5">{getPaymentBadge(selectedReg.payment_status, selectedReg.payment_amount)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Amount</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{selectedReg.payment_amount}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Reference</span>
                  <span className="font-mono text-slate-700">{selectedReg.payment_reference || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* APPROVE / REJECT ACTION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!actionReg && !!actionType}
        onClose={() => {
          setActionReg(null);
          setActionType(null);
        }}
        title={actionType === 'approve' ? 'Approve Registration' : 'Reject Registration'}
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => {
                setActionReg(null);
                setActionType(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {updatingStatus ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`
              )}
            </button>
          </>
        }
      >
        {actionReg && actionType && (
          <div className="space-y-3 text-xs text-slate-700">
            <p>
              Are you sure you want to <strong>{actionType}</strong> registration{' '}
              <span className="font-mono font-bold text-[#004182]">{actionReg.registration_id}</span> for team{' '}
              <strong>"{actionReg.team_name}"</strong>?
            </p>
            {actionType === 'reject' && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-[11px]">
                Warning: Rejecting this registration will mark it as rejected in the official database.
              </div>
            )}
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
