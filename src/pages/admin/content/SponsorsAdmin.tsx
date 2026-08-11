import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Star, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { SPONSORS_PARTNERS } from '../../../data/eventData';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import {
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  type SponsorEntry,
} from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

const seed: SponsorEntry[] = SPONSORS_PARTNERS.map((s, i) => ({
  id: `sponsor-${i}`,
  name: s.name,
  type: s.type,
  role: s.role,
  logoText: s.logoText,
  website: '',
  active: true,
  order: i + 1,
}));

const EMPTY: Omit<SponsorEntry, 'id'> = {
  name: '',
  type: 'Partner',
  role: '',
  logoText: '',
  website: '',
  active: true,
  order: 0,
};

export const SponsorsAdmin: React.FC = () => {
  const [sponsors, setSponsors] = useState<SponsorEntry[]>(seed);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SponsorEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SponsorEntry, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();
  const { refreshContent } = useContent();

  const loadData = useCallback(async () => {
    try {
      const data = await getSponsors();
      setSponsors(data);
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, order: sponsors.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (s: SponsorEntry) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      type: s.type,
      role: s.role,
      logoText: s.logoText,
      website: s.website || '',
      active: s.active,
      order: s.order,
    });
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      addToast('error', 'Validation error', 'Sponsor Name and Role are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateSponsor(editingId, form);
        addToast('success', 'Sponsor updated', 'Saved to Supabase database.');
      } else {
        await addSponsor(form);
        addToast('success', 'Sponsor added', 'New sponsor saved to Supabase database.');
      }
      await loadData();
      await refreshContent();
      setModalOpen(false);
    } catch (err: unknown) {
      console.error('Save sponsor error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save sponsor', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSponsor(id);
      await loadData();
      await refreshContent();
      setDeleteTarget(null);
      addToast('info', 'Sponsor removed', 'Sponsor deleted from Supabase.');
    } catch (err: unknown) {
      console.error('Delete sponsor error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to delete sponsor', msg);
    }
  };

  const toggleActive = async (id: string) => {
    const target = sponsors.find((s) => s.id === id);
    if (!target) return;
    try {
      await updateSponsor(id, { active: !target.active });
      await loadData();
      await refreshContent();
    } catch (err: unknown) {
      console.error('Toggle active error:', err);
      addToast('error', 'Failed to update sponsor status', 'Database error.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Sponsors & Partners</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage event partners, sponsors, and institutional supporters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isSupabaseConfigured && (
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              DB Not Connected
            </span>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white font-bold px-4 py-2 rounded-xl text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </button>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No sponsors found.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#004182] hover:underline font-semibold">
            Add the first sponsor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Sponsor / Partner
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-center px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Active
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sponsors.map((s) => (
                <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${!s.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#004182] font-bold text-xs flex items-center justify-center shrink-0">
                        {s.logoText || s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      {s.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleActive(s.id)} className="cursor-pointer">
                      {s.active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#004182] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Sponsor' : 'Add Sponsor'}
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveModal}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#004182] hover:bg-[#003366] text-white shadow-sm cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingId ? 'Save Changes' : 'Add Sponsor'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Sponsor / Partner Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. SRiX Incubator"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sponsor Category / Type</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Incubation Partner"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Logo Text / Monogram</label>
              <input
                type="text"
                value={form.logoText}
                onChange={(e) => setForm((f) => ({ ...f, logoText: e.target.value }))}
                placeholder="e.g. SRiX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Role / Contribution *</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Startup Seed Grants & Mentorship"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Website URL (Optional)</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
              <input
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="text-xs font-bold text-slate-700">Active</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, active: !f.active }))}>
                {form.active ? (
                  <ToggleRight className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Sponsor?"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
            >
              Delete
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Sponsor to delete</p>
              <p className="text-sm font-bold text-slate-900">{deleteTarget.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{deleteTarget.role}</p>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full mt-1 inline-block">{deleteTarget.type}</span>
            </div>
            <p className="text-xs text-slate-600">This action cannot be undone. The sponsor will be permanently removed.</p>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
