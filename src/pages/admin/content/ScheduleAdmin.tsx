import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { SCHEDULE_PREVIEW } from '../../../data/eventData';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import {
  getScheduleItems,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  type ScheduleEntry,
} from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

const seed: ScheduleEntry[] = SCHEDULE_PREVIEW.map((s, i) => ({
  id: `sch-${i}`,
  time: s.time,
  event: s.event,
  location: s.location,
  description: s.description,
  badge: s.badge,
  active: true,
  displayOrder: i + 1,
}));

const EMPTY: Omit<ScheduleEntry, 'id'> = {
  time: '',
  event: '',
  location: '',
  description: '',
  badge: '',
  active: true,
  displayOrder: 0,
};

export const ScheduleAdmin: React.FC = () => {
  const [items, setItems] = useState<ScheduleEntry[]>(seed);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ScheduleEntry, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();
  const { refreshContent } = useContent();

  const loadData = useCallback(async () => {
    try {
      const data = await getScheduleItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch schedule items:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, displayOrder: items.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (s: ScheduleEntry) => {
    setEditingId(s.id);
    setForm({
      time: s.time,
      event: s.event,
      location: s.location,
      description: s.description,
      badge: s.badge,
      active: s.active,
      displayOrder: s.displayOrder,
    });
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!form.time.trim() || !form.event.trim()) {
      addToast('error', 'Validation error', 'Time and Event Title are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateScheduleItem(editingId, form);
        addToast('success', 'Schedule item updated', 'Saved to Supabase database.');
      } else {
        await addScheduleItem(form);
        addToast('success', 'Schedule item added', 'New item saved to Supabase database.');
      }
      await loadData();
      await refreshContent();
      setModalOpen(false);
    } catch (err: unknown) {
      console.error('Save schedule item error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save item', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduleItem(id);
      await loadData();
      await refreshContent();
      setDeleteTarget(null);
      addToast('info', 'Item removed', 'Schedule item deleted from Supabase.');
    } catch (err: unknown) {
      console.error('Delete schedule item error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to delete item', msg);
    }
  };

  const toggleActive = async (id: string) => {
    const target = items.find((s) => s.id === id);
    if (!target) return;
    try {
      await updateScheduleItem(id, { active: !target.active });
      await loadData();
      await refreshContent();
    } catch (err: unknown) {
      console.error('Toggle active error:', err);
      addToast('error', 'Failed to update schedule status', 'Database error.');
    }
  };

  const setF = (key: keyof Omit<ScheduleEntry, 'id'>) => (value: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Schedule</h2>
          </div>
          <p className="text-xs text-slate-500">Manage the Expo Day timeline and schedule items.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isSupabaseConfigured && (
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              DB Not Connected
            </span>
          )}
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white font-bold px-4 py-2 rounded-xl text-sm shadow-sm transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No schedule items.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#004182] hover:underline font-semibold">Add first item</button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-4 hover:border-blue-100 transition-all ${!s.active ? 'opacity-50' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-[#004182]/5 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-black text-[#004182]">{s.displayOrder}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">{s.badge || 'Event'}</span>
                  <span className="text-xs font-bold text-slate-400">{s.time}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">{s.event}</p>
                {s.location && <p className="text-[11px] text-slate-500 mt-0.5">{s.location}</p>}
                {s.description && <p className="text-[11px] text-slate-400 mt-1 whitespace-pre-line line-clamp-3">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(s.id)} className="cursor-pointer" title={s.active ? 'Active (click to hide)' : 'Hidden (click to show)'}>
                  {s.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#004182] transition-colors cursor-pointer" title="Edit Item">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Delete Item">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Schedule Item' : 'Add Schedule Item'} maxWidth="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancel</button>
            <button onClick={handleSaveModal} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#004182] hover:bg-[#003366] text-white shadow-sm cursor-pointer disabled:opacity-60">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Add Item'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Time Slot *</label>
              <input type="text" value={form.time} onChange={(e) => setF('time')(e.target.value)} placeholder="e.g. 08:30 AM – 09:00 AM" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={(e) => setF('displayOrder')(parseInt(e.target.value, 10) || 0)} placeholder="1" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Program / Event Title *</label>
            <input type="text" value={form.event} onChange={(e) => setF('event')(e.target.value)} placeholder="e.g. Registration & Reporting of Participating Teams" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category / Badge</label>
              <input type="text" value={form.badge} onChange={(e) => setF('badge')(e.target.value)} placeholder="e.g. Registration, Inauguration, VIP Visit" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Venue / Location</label>
              <input type="text" value={form.location} onChange={(e) => setF('location')(e.target.value)} placeholder="e.g. SR University Campus, Main Auditorium" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Activity Details</label>
            <textarea rows={4} value={form.description} onChange={(e) => setF('description')(e.target.value)} placeholder="• Activity item 1&#10;• Activity item 2" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y" />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Published / Active Status</label>
            <button type="button" onClick={() => setF('active')(!form.active)} className="cursor-pointer">
              {form.active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
            <span className="text-xs text-slate-500">{form.active ? 'Visible on public schedule' : 'Hidden from public schedule'}</span>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Schedule Item?" maxWidth="sm"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancel</button>
            <button onClick={() => deleteTarget && handleDelete(deleteTarget.id)} className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer">Delete</button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Schedule item to delete</p>
              <p className="text-sm font-bold text-slate-900">{deleteTarget.event}</p>
              <p className="text-xs text-slate-500 mt-0.5">{deleteTarget.time}{deleteTarget.location ? ` — ${deleteTarget.location}` : ''}</p>
            </div>
            <p className="text-xs text-slate-600">This action cannot be undone.</p>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
