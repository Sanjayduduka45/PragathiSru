import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { Modal } from '../../components/ui/Modal';

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
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [institutionFilter, setInstitutionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Detail Modal State
  const [selectedReg, setSelectedReg] = useState<JoinedRegistrationRecord | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to environment variables.');
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
        console.error('Error fetching registrations from Supabase:', fetchErr);
        setError(`Database error (${fetchErr.code || 'UNKNOWN'}): ${fetchErr.message}`);
      } else {
        setRegistrations((data as JoinedRegistrationRecord[]) || []);
      }
    } catch (err: any) {
      console.error('Fetch exception:', err);
      setError(err?.message || 'An unexpected error occurred while fetching registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Compute summary stats from live database registrations (Requirement #7)
  const stats = useMemo(() => {
    const totalRegistrations = registrations.length;
    const totalTeams = registrations.length;
    const totalParticipants = registrations.reduce((acc, r) => acc + (r.team_size || 1), 0);
    const freeRegistrations = registrations.filter((r) => r.payment_status === 'not_required').length;
    const paidRegistrations = registrations.filter((r) => r.payment_status === 'paid').length;
    const paymentPending = registrations.filter((r) => r.payment_status === 'pending').length;
    return { totalRegistrations, totalTeams, totalParticipants, freeRegistrations, paidRegistrations, paymentPending };
  }, [registrations]);

  // Extract unique institutions for filter dropdown
  const uniqueInstitutions = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      const instName = r.institutions?.name || 'SR University';
      if (instName) set.add(instName);
    });
    return Array.from(set).sort();
  }, [registrations]);

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

      // Payment filter
      if (paymentFilter !== 'ALL') {
        if (r.payment_status !== paymentFilter) return false;
      }

      // Institution filter
      if (institutionFilter !== 'ALL') {
        const instName = r.institutions?.name || 'SR University';
        if (instName !== institutionFilter) return false;
      }

      // Participant type filter
      if (typeFilter !== 'ALL') {
        if (r.participant_type !== typeFilter) return false;
      }

      return true;
    });
  }, [registrations, searchQuery, paymentFilter, institutionFilter, typeFilter]);

  // Paginated records
  const totalRecords = filteredRegistrations.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  const getStatusBadge = () => (
    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      REGISTERED
    </span>
  );

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#004182]" />
            <h2 className="text-xl font-extrabold text-slate-900">Registrations Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage official PRAGATHI 2K26 registered teams stored in Supabase.
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

      {/* Top Summary Cards (Requirement #7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Registrations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Total Registrations</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-[#004182]">{stats.totalRegistrations}</span>
            <FileText className="w-4 h-4 text-[#004182]" />
          </div>
        </div>

        {/* Total Teams */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Total Teams</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-900">{stats.totalTeams}</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
        </div>

        {/* Total Participants */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Total Participants</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-indigo-600">{stats.totalParticipants}</span>
            <User className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* Free Registrations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Free Registrations</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-600">{stats.freeRegistrations}</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Paid Registrations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Paid Registrations</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-700">{stats.paidRegistrations}</span>
            <CreditCard className="w-4 h-4 text-emerald-700" />
          </div>
        </div>

        {/* Payment Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Payment Pending</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-amber-600">{stats.paymentPending}</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
        </div>

      </div>

      {/* Search & Multi-Filter Control Bar (Requirement #5 & #6) */}
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
              placeholder="Search by ID, Team, Leader, Email, Institution..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
            />
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

          {/* Payment Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="ALL">All Payments</option>
              <option value="not_required">Free / Not Required (₹0)</option>
              <option value="paid">Paid</option>
              <option value="pending">Payment Pending</option>
            </select>
          </div>

          {/* Institution Filter */}
          <div>
            <select
              value={institutionFilter}
              onChange={(e) => {
                setInstitutionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            >
              <option value="ALL">All Institutions</option>
              {uniqueInstitutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Data Table */}
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
            <span>Retry Connection</span>
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
                    Action
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

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge()}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getPaymentBadge(r.payment_status, r.payment_amount)}
                    </td>

                    {/* Action Column (Requirement #5) */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedReg(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#004182] text-slate-700 hover:text-white font-bold text-xs transition-all cursor-pointer"
                        title="View Registration Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
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

      {/* DETAIL MODAL (Requirement #8) */}
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
                  {new Date(selectedReg.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block leading-tight mb-0.5">Registration Status</span>
                <div>{getStatusBadge()}</div>
              </div>
            </div>

            {/* General Team Info */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <Users className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Team Overview</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Team Name</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block">{selectedReg.team_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Team Size</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedReg.team_size} Members</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Participant Type</span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedReg.participant_type === 'sru_student' ? 'SR University Student' : 'External Participant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Leader Info */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <User className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Team Leader Contact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Name</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block">{selectedReg.leader_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Email</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">{selectedReg.leader_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Phone</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedReg.leader_mobile || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Institution Info */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <Building className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Institution Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Institution Name</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block">{selectedReg.institutions?.name || 'SR University, Warangal'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Institution Type</span>
                  <span className="font-semibold text-slate-800 uppercase text-xs">{selectedReg.institutions?.institution_type || 'University'}</span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                <div className="flex items-center gap-1.5 text-[#004182] font-bold text-[11px]">
                  <Users className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">Team Members</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] px-2 py-0.5 rounded border border-blue-100">
                  {selectedReg.team_members?.length || selectedReg.team_size} Members
                </span>
              </div>

              <div className="space-y-1.5">
                {selectedReg.team_members && selectedReg.team_members.length > 0 ? (
                  selectedReg.team_members.map((m, idx) => (
                    <div key={m.id || idx} className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/60 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                        <span className="text-[10px] text-slate-500 block">{m.email} {m.mobile ? `• ${m.mobile}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.roll_number && (
                          <span className="text-[10px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
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
                  <p className="text-slate-400 italic text-center py-1 text-[11px]">No team member records associated.</p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1 text-[11px]">
                <Layers className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Project Information</span>
              </div>

              {selectedReg.projects && selectedReg.projects.length > 0 ? (
                selectedReg.projects.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Project Title</span>
                      <strong className="text-slate-900 text-xs sm:text-sm font-bold block">{p.title}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Innovation Track / Domain</span>
                      <span className="inline-block bg-blue-50 text-[#004182] font-bold px-2 py-0.5 rounded border border-blue-100 text-[11px] mt-0.5">
                        {p.category}
                      </span>
                    </div>
                    {p.problem_statement && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Problem Statement / Abstract</span>
                        <p className="text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 mt-1 text-xs leading-relaxed max-h-32 overflow-y-auto">
                          {p.problem_statement}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-center py-1 text-[11px]">No project details associated.</p>
              )}
            </div>

            {/* Payment Details */}
            <div className="border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#004182] font-bold border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">Payment Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Payment Status</span>
                  <div className="mt-0.5">{getPaymentBadge(selectedReg.payment_status, selectedReg.payment_amount)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Payment Amount</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{selectedReg.payment_amount}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block leading-tight">Transaction Reference</span>
                  <span className="font-mono text-slate-700 text-xs truncate block">{selectedReg.payment_reference || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
