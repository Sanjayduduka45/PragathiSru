import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { SCHEDULE_PREVIEW, type ScheduleItem } from '../../../data/eventData';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

interface ScheduleEntry extends ScheduleItem {
  id: string;
  active: boolean;
}

const seed: ScheduleEntry[] = SCHEDULE_PREVIEW.map((s, i) => ({
  ...s,
  id: `sch-${i}`,
  active: true,
}));

const EMPTY: Omit<ScheduleEntry, 'id'> = {
  time: '',
  event: '',
  location: '',
  description: '',
  badge: '',
  active: true,
};

export const ScheduleAdmin: React.FC = () => {
  const [items, setItems] = useState<ScheduleEntry[]>(seed);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ScheduleEntry, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const openAdd = () => { setEditingId(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s: ScheduleEntry) => {
    setEditingId(s.id);
    setForm({ time: s.time, event: s.event, location: s.location, description: s.description, badge: s.badge, active: s.active });
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!form.time.trim() || !form.event.trim()) {
      addToast('error', 'Validation error', 'Time and Event Title are required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    if (editingId) {
      setItems((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...form } : s)));
    } else {
      setItems((prev) => [...prev, { id: `sch-${Date.now()}`, ...form }]);
    }
    addToast(isSupabaseConfigured ? 'success' : 'warning', editingId ? 'Schedule item updated' : 'Schedule item added', isSupabaseConfigured ? undefined : 'Local only — DB not connected.');
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((s) => s.id !== id));
    setDeleteId(null);
    addToast('info', 'Item removed', 'Schedule item deleted.');
  };

  const toggleActive = (id: string) => setItems((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  const setF = (key: keyof Omit<ScheduleEntry, 'id'>) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

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

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No schedule items.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#004182] hover:underline font-semibold">Add first item</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-4 hover:border-blue-100 transition-all ${!s.active ? 'opacity-50' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-[#004182]/5 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#004182]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">{s.badge || 'Event'}</span>
                  <span className="text-xs font-bold text-slate-400">{s.time}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">{s.event}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.location}</p>
                {s.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(s.id)} className="cursor-pointer">
                  {s.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#004182] transition-colors cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
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
          {[
            { label: 'Time Slot *', key: 'time', placeholder: 'e.g. 09:30 AM – 10:15 AM' },
            { label: 'Event Title *', key: 'event', placeholder: 'e.g. Grand Inauguration Ceremony' },
            { label: 'Location', key: 'location', placeholder: 'e.g. Main University Auditorium' },
            { label: 'Badge / Label', key: 'badge', placeholder: 'e.g. Inauguration' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
              <input type="text" value={form[key as keyof typeof form] as string} onChange={(e) => setF(key as keyof Omit<ScheduleEntry, 'id'>)(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setF('description')(e.target.value)} placeholder="Optional description..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Active</label>
            <button type="button" onClick={() => setF('active')(!form.active)}>
              {form.active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Schedule Item" maxWidth="sm"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancel</button>
            <button onClick={() => deleteId && handleDelete(deleteId)} className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer">Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-700">Are you sure you want to delete this schedule item? This cannot be undone.</p>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
