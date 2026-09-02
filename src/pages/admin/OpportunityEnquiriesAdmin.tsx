/**
 * OpportunityEnquiriesAdmin.tsx
 *
 * Admin page for managing enquiries and interests submitted via the
 * "Get Involved with PRAGATHI 2K26" opportunity carousel cards.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Archive,
  Filter,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  OpportunityEnquiryService,
  OpportunityEnquiry,
  EnquiryStatus,
} from '../../services/opportunityEnquiryService';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { Modal } from '../../components/ui/Modal';

export const OpportunityEnquiriesAdmin: React.FC = () => {
  const [enquiries, setEnquiries] = useState<OpportunityEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Details Modal
  const [activeEnquiry, setActiveEnquiry] = useState<OpportunityEnquiry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<EnquiryStatus>('new');

  const { toasts, addToast, dismissToast } = useAdminToast();

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await OpportunityEnquiryService.getEnquiries();
      if (res.success) {
        setEnquiries(res.data);
      } else {
        addToast(res.message || 'Failed to load enquiries.', 'error');
      }
    } catch (err) {
      addToast('An error occurred while fetching enquiries.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct opportunities for filter dropdown
  const uniqueOpportunities = useMemo(() => {
    const set = new Set<string>();
    enquiries.forEach((e) => {
      if (e.opportunityName) set.add(e.opportunityName);
    });
    return Array.from(set).sort();
  }, [enquiries]);

  // Counts for summary cards
  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === 'new').length;
    const contacted = enquiries.filter((e) => e.status === 'contacted').length;
    const closed = enquiries.filter((e) => e.status === 'closed').length;
    return { total, newCount, contacted, closed };
  }, [enquiries]);

  // Filtered enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.opportunityName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOpportunity =
        selectedOpportunity === 'ALL' || item.opportunityName === selectedOpportunity;

      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchesSearch && matchesOpportunity && matchesStatus;
    });
  }, [enquiries, searchTerm, selectedOpportunity, selectedStatus]);

  const handleOpenDetails = (item: OpportunityEnquiry) => {
    setActiveEnquiry(item);
    setNewStatus(item.status);
  };

  const handleStatusUpdate = async () => {
    if (!activeEnquiry || activeEnquiry.status === newStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await OpportunityEnquiryService.updateStatus(activeEnquiry.id, newStatus);
      if (res.success) {
        // Update local state immediately
        setEnquiries((prev) =>
          prev.map((e) => (e.id === activeEnquiry.id ? { ...e, status: newStatus } : e))
        );
        setActiveEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        addToast(`Enquiry status updated to "${newStatus}".`, 'success');
      } else {
        addToast(res.message || 'Failed to update status.', 'error');
      }
    } catch {
      addToast('Network error while updating status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>New</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Contacted</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Closed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inquiries & Outreach</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Opportunity Enquiries
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage enquiries and interests submitted by individuals and organizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enquiries</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 font-medium">All recorded submissions</p>
        </div>

        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 sm:p-5 space-y-1">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">New</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-900">{stats.newCount}</p>
          <p className="text-[11px] text-blue-600/80 font-medium">Awaiting response</p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 sm:p-5 space-y-1">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Contacted</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{stats.contacted}</p>
          <p className="text-[11px] text-emerald-600/80 font-medium">In discussion</p>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Closed</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-700">{stats.closed}</p>
          <p className="text-[11px] text-slate-400 font-medium">Completed or archived</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone or organization..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
            />
          </div>

          {/* Opportunity Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedOpportunity}
              onChange={(e) => setSelectedOpportunity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182] bg-white"
            >
              <option value="ALL">All Opportunities</option>
              {uniqueOpportunities.map((opp) => (
                <option key={opp} value={opp}>
                  {opp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182] bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedOpportunity !== 'ALL' || selectedStatus !== 'ALL') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong>{filteredEnquiries.length}</strong> of {enquiries.length} enquiries
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedOpportunity('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-[#004182] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Opportunity</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading enquiries...</span>
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No opportunity enquiries found.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchTerm || selectedOpportunity !== 'ALL' || selectedStatus !== 'ALL'
                        ? 'Try changing your search keywords or filter criteria.'
                        : 'New submissions from the "Get Involved" carousel will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-default"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{item.fullName}</div>
                      {item.designation && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {item.designation}
                        </span>
                      )}
                    </td>

                    {/* Opportunity */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <span className="font-semibold text-slate-800 line-clamp-2">
                        {item.opportunityName}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <a
                        href={`mailto:${item.email}`}
                        className="hover:text-[#004182] hover:underline"
                      >
                        {item.email}
                      </a>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <a
                        href={`tel:${item.phone}`}
                        className="hover:text-[#004182]"
                      >
                        {item.phone}
                      </a>
                    </td>

                    {/* Organization */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate">
                      {item.organization || <span className="text-slate-300">—</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#004182] text-slate-700 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Status Modal */}
      <Modal
        isOpen={Boolean(activeEnquiry)}
        onClose={() => setActiveEnquiry(null)}
        title="Enquiry Details"
        subtitle={activeEnquiry?.opportunityName}
        maxWidth="lg"
      >
        {activeEnquiry && (
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Opportunity Tag & Status Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Opportunity Program
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeEnquiry.opportunityName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block sm:text-right">
                  Current Status
                </span>
                <div className="mt-0.5">{renderStatusBadge(activeEnquiry.status)}</div>
              </div>
            </div>

            {/* Submitter Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <User className="w-3 h-3 text-[#004182]" />
                  <span>Full Name</span>
                </span>
                <p className="font-bold text-slate-900">{activeEnquiry.fullName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#004182]" />
                  <span>Email Address</span>
                </span>
                <a
                  href={`mailto:${activeEnquiry.email}`}
                  className="font-semibold text-[#004182] hover:underline block truncate"
                >
                  {activeEnquiry.email}
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#004182]" />
                  <span>Phone Number</span>
                </span>
                <a
                  href={`tel:${activeEnquiry.phone}`}
                  className="font-semibold text-slate-800 hover:text-[#004182] block font-mono"
                >
                  {activeEnquiry.phone}
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#004182]" />
                  <span>Submitted On</span>
                </span>
                <p className="font-medium text-slate-700">{formatDate(activeEnquiry.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#004182]" />
                  <span>Organization / College</span>
                </span>
                <p className="font-medium text-slate-800">
                  {activeEnquiry.organization || <span className="text-slate-400">Not provided</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-[#004182]" />
                  <span>Designation / Role</span>
                </span>
                <p className="font-medium text-slate-800">
                  {activeEnquiry.designation || <span className="text-slate-400">Not provided</span>}
                </p>
              </div>
            </div>

            {/* Message / Interest */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#004182]" />
                <span>Message / Specific Interest</span>
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {activeEnquiry.message || 'No additional message was provided with this enquiry.'}
              </div>
            </div>

            {/* Status Management Bar */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Update Enquiry Status
                </span>
                <span className="text-[11px] text-slate-500">
                  Mark this enquiry as New, Contacted, or Closed.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as EnquiryStatus)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:border-[#004182]"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || newStatus === activeEnquiry.status}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
