import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Move,
  Crop,
  Layers,
} from 'lucide-react';
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type TestimonialEntry,
} from '../../../services/contentService';
import { useAdminToast } from '../../../hooks/useAdminToast';

export const TestimonialsAdmin: React.FC = () => {
  const [items, setItems] = useState<TestimonialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPersonName, setFormPersonName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formEventName, setFormEventName] = useState('');
  const [formEventYear, setFormEventYear] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageAlt, setFormImageAlt] = useState('');
  const [formImageAspectRatio, setFormImageAspectRatio] = useState('16:9');
  const [formImagePosition, setFormImagePosition] = useState('center');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<TestimonialEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useAdminToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTestimonials();
      setItems(data);
    } catch (err: any) {
      addToast('error', 'Load failed', err?.message || 'Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormPersonName('');
    setFormDesignation('');
    setFormEventName('PRAGATHI 2K25');
    setFormEventYear('2025');
    setFormImageUrl('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80');
    setFormImageAlt('');
    setFormImageAspectRatio('16:9');
    setFormImagePosition('center');
    setFormActive(true);
    setFormOrder((items.length > 0 ? Math.max(...items.map((i) => i.order || 0)) : 0) + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (item: TestimonialEntry) => {
    setEditingItem(item);
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    setFormPersonName(item.personName || '');
    setFormDesignation(item.designation || '');
    setFormEventName(item.eventName || '');
    setFormEventYear(item.eventYear || '');
    setFormImageUrl(item.imageUrl || '');
    setFormImageAlt(item.imageAlt || '');
    setFormImageAspectRatio(item.imageAspectRatio || '16:9');
    setFormImagePosition(item.imagePosition || 'center');
    setFormActive(item.active);
    setFormOrder(item.order || 1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPersonName.trim()) {
      addToast('error', 'Validation Error', 'Person Name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        personName: formPersonName,
        designation: formDesignation,
        eventName: formEventName,
        eventYear: formEventYear,
        imageUrl: formImageUrl,
        imageAlt: formImageAlt,
        imageAspectRatio: formImageAspectRatio,
        imagePosition: formImagePosition,
        active: formActive,
        order: Number(formOrder),
      };

      if (editingItem) {
        await updateTestimonial(editingItem.id, payload);
        addToast('success', 'Showcase Saved', 'Testimonial item updated successfully.');
      } else {
        await addTestimonial(payload);
        addToast('success', 'Showcase Created', 'New testimonial item added successfully.');
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Unable to save testimonial item.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: TestimonialEntry) => {
    try {
      await updateTestimonial(item.id, { active: !item.active });
      addToast(
        'info',
        'Status Updated',
        `Item "${item.personName}" is now ${!item.active ? 'Active' : 'Inactive'}.`
      );
      await loadData();
    } catch (err: any) {
      addToast('error', 'Update Failed', err?.message || 'Unable to update active status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTestimonial(deleteTarget.id);
      addToast('success', 'Deleted', 'Testimonial item deleted successfully.');
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err?.message || 'Unable to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#004182]" />
            <h2 className="text-xl font-extrabold text-slate-900">Previous Events & Testimonials</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage showcase images, quotes, participant reviews, and custom crop/aspect ratio settings for the public website.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#004182] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Showcase Item
          </button>
        </div>
      </div>

      {/* Item List Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-sm font-semibold">Loading Testimonials & Event Showcase...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-700">No Showcase Items Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add showcase entries to display event memories, photos, and participant feedback on the public home page.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#004182] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                item.active ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div>
                {/* Image Preview & Ratio Badge */}
                <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden group">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt || item.personName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">No Image Provided</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold">
                      Ratio: {item.imageAspectRatio || '16:9'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-blue-300 text-[10px] font-bold">
                      Pos: {item.imagePosition || 'center'}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md cursor-pointer transition-all ${
                        item.active
                          ? 'bg-emerald-500/90 text-white shadow-xs'
                          : 'bg-amber-500/90 text-white shadow-xs'
                      }`}
                    >
                      {item.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{item.active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Info Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {item.eventName || item.eventYear || 'Event Showcase'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Order: #{item.order}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
                      {item.title || item.personName}
                    </h3>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed">
                      “{item.description}”
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{item.personName}</div>
                    {item.designation && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">{item.designation}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(item)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {item.active ? 'Hide from Website' : 'Show on Website'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#004182]" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingItem ? 'Edit Showcase Item' : 'Add New Showcase Item'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Image Control Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Image & Display Settings</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Provide an absolute URL for event photos or participant showcase images.
                  </p>
                </div>

                {/* Aspect Ratio & Focal Position Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Crop className="w-3.5 h-3.5 text-slate-500" />
                      Aspect Ratio Crop
                    </label>
                    <select
                      value={formImageAspectRatio}
                      onChange={(e) => setFormImageAspectRatio(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="16:9">16 : 9 (Landscape Widescreen)</option>
                      <option value="4:3">4 : 3 (Standard Photo)</option>
                      <option value="1:1">1 : 1 (Square Crop)</option>
                      <option value="free">Free / Natural Height</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-slate-500" />
                      Object Alignment Position
                    </label>
                    <select
                      value={formImagePosition}
                      onChange={(e) => setFormImagePosition(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top Focal</option>
                      <option value="bottom">Bottom Focal</option>
                      <option value="left">Left Focal</option>
                      <option value="right">Right Focal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image Alt Text</label>
                  <input
                    type="text"
                    value={formImageAlt}
                    onChange={(e) => setFormImageAlt(e.target.value)}
                    placeholder="PRAGATHI 2K25 Student Presentation"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Content Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title / Caption</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="PRAGATHI 2K25 — Project Expo Showcase"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Person Name *</label>
                  <input
                    type="text"
                    required
                    value={formPersonName}
                    onChange={(e) => setFormPersonName(e.target.value)}
                    placeholder="Ananya Rao"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="Team Lead, AgriSense IoT"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={formEventName}
                    onChange={(e) => setFormEventName(e.target.value)}
                    placeholder="PRAGATHI 2K25"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Year</label>
                  <input
                    type="text"
                    value={formEventYear}
                    onChange={(e) => setFormEventYear(e.target.value)}
                    placeholder="2025"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Testimonial / Review Quote</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Write participant feedback or event description..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="formActiveCheck"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="formActiveCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Show on Public Home Page
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#004182] hover:bg-blue-900 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Saving...' : 'Save Showcase Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-2xl bg-red-50 border border-red-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Showcase Item?</h3>
                <p className="text-xs text-slate-500">This item will be permanently removed from Supabase.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-bold border border-slate-200">
              “{deleteTarget.personName} — {deleteTarget.title || 'Showcase'}”
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
