import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Layers, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { PROJECT_CATEGORIES, type ProjectCategory } from '../../../data/eventData';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

interface DomainItem extends ProjectCategory {
  active: boolean;
}

const seed: DomainItem[] = PROJECT_CATEGORIES.map((c) => ({ ...c, active: true }));

const EMPTY_DOMAIN: Omit<DomainItem, 'id'> = {
  title: '',
  description: '',
  iconName: 'Cpu',
  color: 'from-blue-600 to-indigo-600',
  badgeText: '',
  active: true,
};

export const DomainsAdmin: React.FC = () => {
  const [domains, setDomains] = useState<DomainItem[]>(seed);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DomainItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DomainItem, 'id'>>(EMPTY_DOMAIN);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_DOMAIN);
    setModalOpen(true);
  };

  const openEdit = (d: DomainItem) => {
    setEditingId(d.id);
    setForm({ title: d.title, description: d.description, iconName: d.iconName, color: d.color, badgeText: d.badgeText, active: d.active });
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.badgeText.trim()) {
      addToast('error', 'Validation error', 'Title, Description, and Badge Text are required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);

    if (editingId) {
      setDomains((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)));
      addToast(isSupabaseConfigured ? 'success' : 'warning', 'Domain updated', isSupabaseConfigured ? 'Saved to database.' : 'Local only — DB not connected.');
    } else {
      const newDomain: DomainItem = { id: `domain-${Date.now()}`, ...form };
      setDomains((prev) => [...prev, newDomain]);
      addToast(isSupabaseConfigured ? 'success' : 'warning', 'Domain added', isSupabaseConfigured ? 'Saved to database.' : 'Local only — DB not connected.');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
    setDeleteTarget(null);
    addToast('info', 'Domain removed', 'The domain has been deleted.');
  };

  const toggleActive = (id: string) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Project Domains</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage the innovation tracks / project categories for PRAGATHI 2K26.
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
            Add Domain
          </button>
        </div>
      </div>

      {domains.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No domains found.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#004182] hover:underline font-semibold">
            Add the first domain
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Domain</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hidden sm:table-cell">Track Badge</th>
                <th className="text-center px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Active</th>
                <th className="text-right px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.map((d) => (
                <tr key={d.id} className={`hover:bg-slate-50/50 transition-colors ${!d.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 text-xs">{d.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{d.description}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">
                      {d.badgeText}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleActive(d.id)} className="cursor-pointer text-slate-400 hover:text-[#004182] transition-colors">
                      {d.active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500 mx-auto" />
                        : <ToggleLeft className="w-5 h-5 mx-auto" />}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#004182] transition-colors cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
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

      {/* Edit / Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Domain' : 'Add Domain'}
        maxWidth="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSaveModal} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#004182] hover:bg-[#003366] text-white shadow-sm transition-all cursor-pointer disabled:opacity-60">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Add Domain'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Domain Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Software, AI & Data Science" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description *</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description of this domain..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Track Badge Text *</label>
            <input type="text" value={form.badgeText} onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))} placeholder="e.g. Software Track" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Active</label>
            <button type="button" onClick={() => setForm((f) => ({ ...f, active: !f.active }))}>
              {form.active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Domain?"
        maxWidth="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer">Cancel</button>
            <button onClick={() => deleteTarget && handleDelete(deleteTarget.id)} className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer">Delete</button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Domain to delete</p>
              <p className="text-sm font-bold text-slate-900">{deleteTarget.title}</p>
              {deleteTarget.badgeText && (
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full mt-1 inline-block">{deleteTarget.badgeText}</span>
              )}
            </div>
            <p className="text-xs text-slate-600">This action cannot be undone. The domain will be permanently removed.</p>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
