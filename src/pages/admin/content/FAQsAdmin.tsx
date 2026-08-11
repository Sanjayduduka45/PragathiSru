import React, { useState } from 'react';
import { Plus, Edit3, Trash2, HelpCircle, Save, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { FAQS, type FAQItem } from '../../../data/eventData';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

interface FAQEntry extends FAQItem {
  active: boolean;
  order: number;
}

const seed: FAQEntry[] = FAQS.map((f, i) => ({ ...f, active: true, order: i + 1 }));

const EMPTY: Omit<FAQEntry, 'id'> = {
  question: '',
  answer: '',
  category: 'Registration',
  active: true,
  order: 0,
};

export const FAQsAdmin: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQEntry[]>(seed);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FAQEntry, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, order: faqs.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (f: FAQEntry) => {
    setEditingId(f.id);
    setForm({ question: f.question, answer: f.answer, category: f.category, active: f.active, order: f.order });
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      addToast('error', 'Validation error', 'Question and Answer are required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    if (editingId) {
      setFaqs((prev) => prev.map((f) => (f.id === editingId ? { ...f, ...form } : f)));
    } else {
      setFaqs((prev) => [...prev, { id: `faq-${Date.now()}`, ...form }]);
    }
    addToast(
      isSupabaseConfigured ? 'success' : 'warning',
      editingId ? 'FAQ updated' : 'FAQ added',
      isSupabaseConfigured ? undefined : 'Local only — DB not connected.'
    );
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setDeleteTarget(null);
    addToast('info', 'FAQ removed', 'The FAQ item has been deleted.');
  };

  const toggleActive = (id: string) =>
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));

  const moveUp = (id: string) => {
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((f, i) => ({ ...f, order: i + 1 }));
    });
  };

  const moveDown = (id: string) => {
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((f, i) => ({ ...f, order: i + 1 }));
    });
  };

  const categories: FAQItem['category'][] = ['Registration', 'General', 'Expo Rules'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">FAQs</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage frequently asked questions. Use the arrows to reorder.
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
            Add FAQ
          </button>
        </div>
      </div>

      {faqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No FAQs found.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#004182] hover:underline font-semibold">Add the first FAQ</button>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((f, idx) => (
            <div key={f.id} className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3 hover:border-blue-100 transition-all ${!f.active ? 'opacity-50' : ''}`}>
              {/* Order controls */}
              <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
                <button onClick={() => moveUp(f.id)} disabled={idx === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer text-slate-400 hover:text-slate-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                </button>
                <span className="text-[9px] font-bold text-slate-300">{f.order}</span>
                <button onClick={() => moveDown(f.id)} disabled={idx === faqs.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer text-slate-400 hover:text-slate-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{f.category}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{f.question}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.answer}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(f.id)} className="cursor-pointer">
                  {f.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
                </button>
                <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#004182] cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit FAQ' : 'Add FAQ'} maxWidth="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Cancel</button>
            <button onClick={handleSaveModal} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-[#004182] hover:bg-[#003366] text-white shadow-sm cursor-pointer disabled:opacity-60">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Add FAQ'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Question *</label>
            <input type="text" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="Enter the question..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Answer *</label>
            <textarea rows={5} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} placeholder="Enter the answer..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FAQItem['category'] }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
            <input type="number" min={1} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Active</label>
            <button type="button" onClick={() => setForm((f) => ({ ...f, active: !f.active }))}>
              {form.active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete FAQ?" maxWidth="sm"
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
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">FAQ to delete</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">{deleteTarget.question}</p>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1 inline-block">{deleteTarget.category}</span>
            </div>
            <p className="text-xs text-slate-600">This action cannot be undone.</p>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
