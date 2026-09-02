import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit3, Trash2, Star, Save, ToggleLeft, ToggleRight, Upload, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import {
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  uploadSponsorLogo,
  deleteSponsorLogo,
  type SponsorEntry,
} from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

const EMPTY: Omit<SponsorEntry, 'id'> = {
  name: '',
  type: 'Title Sponsor',
  role: '',
  logoText: '',
  logoUrl: '',
  website: '',
  active: true,
  order: 1,
};

export const SponsorsAdmin: React.FC = () => {
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SponsorEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SponsorEntry, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setUploadError(null);
    setForm({ ...EMPTY, order: sponsors.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (s: SponsorEntry) => {
    setEditingId(s.id);
    setUploadError(null);
    setForm({
      name: s.name,
      type: s.type,
      role: s.role || '',
      logoText: s.logoText || '',
      logoUrl: s.logoUrl || '',
      website: s.website || '',
      active: s.active,
      order: s.order,
    });
    setModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    const hasValidExt = file.name.match(/\.(png|jpe?g|webp|svg|gif)$/i);
    if (!validTypes.includes(file.type) && !hasValidExt) {
      const err = 'Unsupported file format. Please upload a PNG, JPG, WEBP, or SVG image.';
      setUploadError(err);
      addToast('error', 'Invalid File Format', err);
      return;
    }

    // Validate size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const err = `Image file exceeds 5MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
      setUploadError(err);
      addToast('error', 'File Too Large', err);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadSponsorLogo(file);
      setForm((prev) => ({
        ...prev,
        logoUrl: url,
        // Auto-generate monogram fallback if logoText is empty
        logoText: prev.logoText || file.name.split('.')[0].substring(0, 4).toUpperCase(),
      }));
      addToast('success', 'Logo Uploaded', 'Sponsor logo saved successfully.');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      const msg = err?.message || 'Failed to upload logo to storage.';
      setUploadError(msg);
      addToast('error', 'Upload Failed', msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
    setUploadError(null);
  };

  const handleSaveModal = async () => {
    if (!form.name.trim() || !form.type.trim()) {
      addToast('error', 'Validation error', 'Sponsor Name and Sponsor Type are required.');
      return;
    }

    if (!form.logoUrl && !form.logoText.trim()) {
      addToast('error', 'Validation error', 'Please upload a Sponsor Logo image or enter Logo Text.');
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
    const target = deleteTarget;
    try {
      await deleteSponsor(id);
      if (target?.logoUrl) {
        await deleteSponsorLogo(target.logoUrl);
      }
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
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.logoUrl ? (
                          <img
                            src={s.logoUrl}
                            alt={`${s.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[#004182] font-bold text-xs">
                            {s.logoText || s.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                        {s.role ? (
                          <p className="text-[11px] text-slate-500 mt-0.5">{s.role}</p>
                        ) : s.website ? (
                          <p className="text-[11px] text-blue-600 mt-0.5 truncate max-w-xs">{s.website}</p>
                        ) : null}
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
                        title="Edit Sponsor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Sponsor"
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
              disabled={saving || uploading}
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
              placeholder="e.g. Connect Global"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sponsor Type *</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="e.g. Title Sponsor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Logo Text / Monogram</label>
              <input
                type="text"
                value={form.logoText}
                onChange={(e) => setForm((f) => ({ ...f, logoText: e.target.value }))}
                placeholder="e.g. CG"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* SPONSOR LOGO IMAGE UPLOAD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Sponsor Logo Image *
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
            />

            {form.logoUrl ? (
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col items-center justify-center space-y-3">
                <div className="h-28 w-full max-w-xs flex items-center justify-center bg-white rounded-xl border border-slate-200/80 p-3 overflow-hidden shadow-2xs">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#004182] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  uploading
                    ? 'border-blue-300 bg-blue-50/40 cursor-not-allowed'
                    : 'border-slate-200 hover:border-[#004182] hover:bg-blue-50/20'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#004182]/30 border-t-[#004182] rounded-full animate-spin" />
                    <p className="text-xs font-bold text-[#004182]">Uploading logo to Supabase Storage...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload sponsor logo
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, WEBP, or SVG (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-xs font-semibold text-rose-600 mt-1.5">{uploadError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Website URL (Optional)</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
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
              <div className="flex items-center gap-3 mt-1">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  {deleteTarget.logoUrl ? (
                    <img src={deleteTarget.logoUrl} alt={`${deleteTarget.name} logo`} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[#004182] font-bold text-xs">{deleteTarget.logoText || deleteTarget.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{deleteTarget.name}</p>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full mt-0.5 inline-block">{deleteTarget.type}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600">This action cannot be undone. The sponsor and associated logo will be permanently removed.</p>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
