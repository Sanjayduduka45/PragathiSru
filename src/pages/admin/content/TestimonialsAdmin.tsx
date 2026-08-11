import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Video as VideoIcon,
  Film,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type TestimonialEntry,
} from '../../../services/contentService';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { ImageCropperModal } from '../../../components/admin/ImageCropperModal';

export const TestimonialsAdmin: React.FC = () => {
  const [items, setItems] = useState<TestimonialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Visual Image Cropper State
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  // Form Fields (NO person_name)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formEventName, setFormEventName] = useState('');
  const [formEventYear, setFormEventYear] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formImageAlt, setFormImageAlt] = useState('');
  const [formImageAspectRatio, setFormImageAspectRatio] = useState('16:9');
  const [formImagePosition, setFormImagePosition] = useState('center');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<TestimonialEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setFormDesignation('');
    setFormEventName('PRAGATHI 2K25');
    setFormEventYear('2025');
    setFormMediaType('image');
    setFormMediaUrl('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80');
    setFormThumbnailUrl('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80');
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
    setFormDesignation(item.designation || '');
    setFormEventName(item.eventName || '');
    setFormEventYear(item.eventYear || '');
    setFormMediaType(item.mediaType || 'image');
    setFormMediaUrl(item.mediaUrl || item.imageUrl || '');
    setFormThumbnailUrl(item.thumbnailUrl || item.imageUrl || '');
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

  const uploadMediaFile = async (file: File | Blob, customFilename?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = customFilename || (file as File).name || 'cropped_image.jpg';
      formData.append('file', file, filename);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET_KEY || 'pragathi_admin_secret_key_2026';
      const response = await fetch('/api/admin/testimonials/upload', {
        method: 'POST',
        headers: {
          'X-Admin-Secret': adminSecret,
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Upload server error');
      }

      const resData = await response.json();
      if (resData.url) {
        setFormMediaUrl(resData.url);
        if (resData.media_type === 'video') {
          setFormMediaType('video');
        } else {
          setFormThumbnailUrl(resData.url);
        }
        addToast('success', 'Media Uploaded', 'File saved persistently to Supabase Storage.');
        return resData.url;
      }
    } catch (err: any) {
      addToast('error', 'Upload Failed', err?.message || 'Failed to upload media file.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formMediaType === 'image') {
      const objectUrl = URL.createObjectURL(file);
      setCropperImageSrc(objectUrl);
    } else {
      await uploadMediaFile(file);
    }
  };

  const handleCroppedImageConfirm = async (croppedBlob: Blob, _dataUrl: string) => {
    setCropperImageSrc(null);
    await uploadMediaFile(croppedBlob, `cropped_${Date.now()}.jpg`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast('error', 'Validation Error', 'Title is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<TestimonialEntry, 'id'> = {
        title: formTitle,
        description: formDescription,
        personName: '',
        designation: formDesignation,
        eventName: formEventName,
        eventYear: formEventYear,
        imageUrl: formMediaUrl || formThumbnailUrl,
        imageAlt: formImageAlt,
        imageAspectRatio: formImageAspectRatio,
        imagePosition: formImagePosition,
        mediaType: formMediaType,
        mediaUrl: formMediaUrl,
        thumbnailUrl: formThumbnailUrl || formMediaUrl,
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
        `Item "${item.title || 'Showcase'}" is now ${!item.active ? 'Active' : 'Inactive'}.`
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
      {/* Visual Image Cropper Modal */}
      {cropperImageSrc && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          initialAspectRatio={formImageAspectRatio}
          onConfirm={handleCroppedImageConfirm}
          onCancel={() => setCropperImageSrc(null)}
        />
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#004182]" />
            <h2 className="text-xl font-extrabold text-slate-900">Event Memories & Testimonials</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage showcase images, videos, innovation stories, interactive visual cropper, and public display settings.
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
            Add showcase entries to display event memories, photos, and project videos on the public website.
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
          {items.map((item) => {
            const isVideo = item.mediaType === 'video';
            const mediaSrc = item.mediaUrl || item.imageUrl;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  item.active ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div>
                  {/* Image/Video Preview & Ratio Badge */}
                  <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden group">
                    {mediaSrc ? (
                      isVideo ? (
                        <video
                          src={mediaSrc}
                          poster={item.thumbnailUrl || item.imageUrl}
                          controls
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={item.imageAlt || item.title}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs">No Media Provided</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                        {isVideo ? <VideoIcon className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-blue-400" />}
                        {isVideo ? 'VIDEO' : 'IMAGE'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-blue-300 text-[10px] font-bold">
                        {item.imageAspectRatio || '16:9'}
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
                        {item.title}
                      </h3>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed">
                        “{item.description}”
                      </p>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {item.designation ? (
                        <div className="font-semibold text-blue-800 line-clamp-1">{item.designation}</div>
                      ) : (
                        <div className="text-slate-400">Event Showcase</div>
                      )}
                      {item.eventYear && (
                        <span className="text-[11px] font-bold text-slate-400">{item.eventYear}</span>
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
            );
          })}
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
              {/* Media Type & Upload Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-blue-600" />
                    <span>Media Type & File Upload</span>
                  </label>

                  {/* Media Type Switcher */}
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormMediaType('image')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        formMediaType === 'image'
                          ? 'bg-[#004182] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMediaType('video')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        formMediaType === 'video'
                          ? 'bg-[#004182] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Video
                    </button>
                  </div>
                </div>

                {/* Upload Button + File Input */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={formMediaType === 'video' ? 'video/*' : 'image/*'}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> : <Upload className="w-4 h-4 text-blue-600" />}
                    <span>{uploading ? 'Uploading to Supabase Storage...' : `Upload ${formMediaType === 'video' ? 'Video' : 'Image'}`}</span>
                  </button>

                  {formMediaType === 'image' && formMediaUrl && (
                    <button
                      type="button"
                      onClick={() => setCropperImageSrc(formMediaUrl)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      <Crop className="w-3.5 h-3.5 text-blue-600" />
                      <span>Open Visual Cropper</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formMediaType === 'video' ? 'Video URL' : 'Image URL'}
                  </label>
                  <input
                    type="url"
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    placeholder={formMediaType === 'video' ? 'https://example.com/video.mp4' : 'https://images.unsplash.com/...'}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                {formMediaType === 'video' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Video Thumbnail Poster URL (Optional)</label>
                    <input
                      type="url"
                      value={formThumbnailUrl}
                      onChange={(e) => setFormThumbnailUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/poster.jpg"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                )}

                {/* Aspect Ratio & Focal Position Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Crop className="w-3.5 h-3.5 text-slate-500" />
                      Aspect Ratio Preset
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
              </div>

              {/* Content Form Controls (NO person_name) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title / Caption *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Robotics & Autonomous Navigation Prototype"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role / Designation / Track</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="Robotics & Automation Track"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Showcase Description</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the prototype demonstration or event highlight..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formActiveCheck"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="formActiveCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Show on Public Website
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
              “{deleteTarget.title || 'Showcase Item'}”
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
