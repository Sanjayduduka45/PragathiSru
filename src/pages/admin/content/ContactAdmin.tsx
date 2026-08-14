import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Undo2,
  X,
  Mail,
  UserCheck,
  Building2,
  Headphones,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import { EVENT_DETAILS } from '../../../utils/constants';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import {
  getEventSettings,
  updateEventSettings,
  getContactPeople,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
  type ContactPerson,
  DEFAULT_CONTACT_PEOPLE,
} from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

interface SettingsFormData {
  contactEmail: string;
  helpline: string;
  institution: string;
  venue: string;
}

const INITIAL_SETTINGS: SettingsFormData = {
  contactEmail: EVENT_DETAILS.contactEmail,
  helpline: EVENT_DETAILS.helpline,
  institution: EVENT_DETAILS.institution,
  venue: EVENT_DETAILS.venue,
};

interface PersonFormData {
  category: 'leadership' | 'coordinator';
  name: string;
  designation: string;
  mobile: string;
  email: string;
  order: number;
  active: boolean;
}

const EMPTY_PERSON_FORM: PersonFormData = {
  category: 'leadership',
  name: '',
  designation: '',
  mobile: '',
  email: '',
  order: 1,
  active: true,
};

export const ContactAdmin: React.FC = () => {
  // Settings State
  const [settingsForm, setSettingsForm] = useState<SettingsFormData>(INITIAL_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingSettings, setResettingSettings] = useState(false);

  // People State
  const [people, setPeople] = useState<ContactPerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [personForm, setPersonForm] = useState<PersonFormData>(EMPTY_PERSON_FORM);
  const [savingPerson, setSavingPerson] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<ContactPerson | null>(null);
  const [deletingPerson, setDeletingPerson] = useState(false);

  const { toasts, addToast, dismissToast } = useAdminToast();
  const { refreshContent } = useContent();

  const loadData = async () => {
    try {
      setLoadingPeople(true);
      const [settings, peopleList] = await Promise.all([
        getEventSettings(),
        getContactPeople(),
      ]);

      setSettingsForm({
        contactEmail: settings.contactEmail,
        helpline: settings.helpline,
        institution: settings.institution,
        venue: settings.venue,
      });

      setPeople(peopleList);
    } catch (err) {
      console.error('Failed to load contact admin data:', err);
      addToast('error', 'Load failed', 'Could not load existing contact records.');
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Settings Handlers ──────────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.contactEmail.trim() || !settingsForm.helpline.trim()) {
      addToast('error', 'Validation error', 'Support Email and Helpline Number are required.');
      return;
    }
    setSavingSettings(true);
    try {
      await updateEventSettings({
        contactEmail: settingsForm.contactEmail.trim(),
        helpline: settingsForm.helpline.trim(),
        institution: settingsForm.institution.trim(),
        venue: settingsForm.venue.trim(),
      });
      await refreshContent();
      addToast('success', 'Support details saved', 'Official channels and venue updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save support details', msg);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRestoreDefaultSettings = async () => {
    setResettingSettings(true);
    try {
      await updateEventSettings({
        contactEmail: INITIAL_SETTINGS.contactEmail,
        helpline: INITIAL_SETTINGS.helpline,
        institution: INITIAL_SETTINGS.institution,
        venue: INITIAL_SETTINGS.venue,
      });
      setSettingsForm(INITIAL_SETTINGS);
      await refreshContent();
      addToast('success', 'Defaults Restored', 'Support & Venue fields restored to original defaults.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to restore default settings', msg);
    } finally {
      setResettingSettings(false);
    }
  };

  // ─── Person Modal Handlers ──────────────────────────────────────────────────
  const openAddModal = (category: 'leadership' | 'coordinator') => {
    const existingOfCategory = people.filter((p) => p.category === category);
    const nextOrder = existingOfCategory.length > 0
      ? Math.max(...existingOfCategory.map((p) => p.order)) + 1
      : 1;

    setEditingPersonId(null);
    setPersonForm({
      ...EMPTY_PERSON_FORM,
      category,
      order: nextOrder,
    });
    setModalOpen(true);
  };

  const openEditModal = (person: ContactPerson) => {
    setEditingPersonId(person.id);
    setPersonForm({
      category: person.category,
      name: person.name,
      designation: person.designation,
      mobile: person.mobile,
      email: person.email || '',
      order: person.order,
      active: person.active,
    });
    setModalOpen(true);
  };

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personForm.name.trim() || !personForm.designation.trim() || !personForm.mobile.trim()) {
      addToast('error', 'Validation error', 'Full Name, Designation/Role, and Phone Number are required.');
      return;
    }

    if (personForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personForm.email.trim())) {
      addToast('error', 'Validation error', 'Please enter a valid email address.');
      return;
    }

    setSavingPerson(true);
    try {
      if (editingPersonId) {
        await updateContactPerson(editingPersonId, {
          category: personForm.category,
          name: personForm.name.trim(),
          designation: personForm.designation.trim(),
          mobile: personForm.mobile.trim(),
          email: personForm.email.trim(),
          order: Number(personForm.order) || 1,
          active: personForm.active,
        });
        addToast('success', 'Contact updated', `${personForm.name} updated successfully.`);
      } else {
        await createContactPerson({
          category: personForm.category,
          name: personForm.name.trim(),
          designation: personForm.designation.trim(),
          mobile: personForm.mobile.trim(),
          email: personForm.email.trim(),
          order: Number(personForm.order) || 1,
          active: personForm.active,
        });
        addToast('success', 'Contact added', `${personForm.name} added to ${personForm.category}.`);
      }

      await refreshContent();
      const updatedList = await getContactPeople();
      setPeople(updatedList);
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save contact', msg);
    } finally {
      setSavingPerson(false);
    }
  };

  const handleToggleActive = async (person: ContactPerson) => {
    try {
      const newStatus = !person.active;
      await updateContactPerson(person.id, { active: newStatus });
      setPeople((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, active: newStatus } : p))
      );
      await refreshContent();
      addToast(
        'info',
        newStatus ? 'Contact Activated' : 'Contact Deactivated',
        `${person.name} is now ${newStatus ? 'visible' : 'hidden'} on the public page.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Status update failed', msg);
    }
  };

  // ─── Delete Handlers ────────────────────────────────────────────────────────
  const openDeleteModal = (person: ContactPerson) => {
    setPersonToDelete(person);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;
    setDeletingPerson(true);
    try {
      await deleteContactPerson(personToDelete.id);
      setPeople((prev) => prev.filter((p) => p.id !== personToDelete.id));
      await refreshContent();
      addToast('success', 'Contact deleted', `${personToDelete.name} was removed.`);
      setDeleteModalOpen(false);
      setPersonToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Delete failed', msg);
    } finally {
      setDeletingPerson(false);
    }
  };

  const leadershipContacts = people
    .filter((p) => p.category === 'leadership')
    .sort((a, b) => a.order - b.order);

  const coordinatorContacts = people
    .filter((p) => p.category === 'coordinator')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Contact & Directory Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Manage official support channels, venue details, project showcase leadership, and event coordinators shown dynamically on the public Contact page.
          </p>
        </div>
        {!isSupabaseConfigured && (
          <span className="shrink-0 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            Local Fallback Active
          </span>
        )}
      </div>

      {/* ─── SECTION 1 & 2: OFFICIAL SUPPORT & VENUE ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Headphones className="w-4 h-4 text-[#004182]" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Official Helpdesk & Location Settings
          </h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="adm-ct-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Support Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="adm-ct-email"
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="e.g. pragathi2k26@sru.edu.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adm-ct-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                Helpline Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="adm-ct-phone"
                  type="text"
                  value={settingsForm.helpline}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, helpline: e.target.value }))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  placeholder="e.g. +91 870 281 8333"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="adm-ct-inst" className="block text-xs font-bold text-slate-700 mb-1.5">
              Organizing Institution
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="adm-ct-inst"
                type="text"
                value={settingsForm.institution}
                onChange={(e) => setSettingsForm((f) => ({ ...f, institution: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                placeholder="e.g. SR University"
              />
            </div>
          </div>

          <div>
            <label htmlFor="adm-ct-venue" className="block text-xs font-bold text-slate-700 mb-1.5">
              Official Venue Address
            </label>
            <textarea
              id="adm-ct-venue"
              rows={2}
              value={settingsForm.venue}
              onChange={(e) => setSettingsForm((f) => ({ ...f, venue: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y bg-white"
              placeholder="e.g. SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingSettings || resettingSettings}
                className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all cursor-pointer"
              >
                {savingSettings ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Helpdesk Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsForm(INITIAL_SETTINGS);
                  addToast('info', 'Form Reset', 'Form values reset to baseline.');
                }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Form
              </button>
            </div>

            <button
              type="button"
              disabled={savingSettings || resettingSettings}
              onClick={handleRestoreDefaultSettings}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              Restore Original Defaults
            </button>
          </div>
        </form>
      </div>

      {/* ─── SECTION 3: PROJECT SHOWCASE LEADERSHIP ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#004182]" />
              Project Showcase Leadership
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deans and Associate Deans governing the expo project showcase.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('leadership')}
            className="inline-flex items-center gap-1.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Leadership Contact
          </button>
        </div>

        {loadingPeople ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Loading contacts...
          </div>
        ) : leadershipContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadershipContacts.map((person) => (
              <div
                key={person.id}
                className={`p-4 rounded-xl border transition-all ${
                  person.active
                    ? 'border-slate-200 bg-white hover:border-blue-300 shadow-2xs'
                    : 'border-slate-200/60 bg-slate-50 opacity-75'
                } flex flex-col justify-between space-y-3`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {person.designation}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        #{person.order}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {person.name}
                    </h4>
                  </div>

                  <button
                    type="button"
                    title={person.active ? 'Click to deactivate' : 'Click to activate'}
                    onClick={() => handleToggleActive(person)}
                    className="cursor-pointer"
                  >
                    {person.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#004182] shrink-0" />
                    <span className="font-semibold text-slate-800">{person.mobile}</span>
                  </div>
                  {person.email && (
                    <div className="flex items-center gap-2 break-all">
                      <Mail className="w-3.5 h-3.5 text-[#004182] shrink-0" />
                      <span className="text-slate-600">{person.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(person)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#004182] bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(person)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              No leadership contacts listed.
            </p>
            <button
              type="button"
              onClick={() => openAddModal('leadership')}
              className="text-xs font-bold text-[#004182] hover:underline"
            >
              + Add first leadership contact
            </button>
          </div>
        )}
      </div>

      {/* ─── SECTION 4: EVENT COORDINATORS ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#004182]" />
              Event Coordinators
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Faculty and staff coordinating participant support and stall management.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAddModal('coordinator')}
            className="inline-flex items-center gap-1.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Coordinator
          </button>
        </div>

        {loadingPeople ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Loading coordinators...
          </div>
        ) : coordinatorContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coordinatorContacts.map((person) => (
              <div
                key={person.id}
                className={`p-4 rounded-xl border transition-all ${
                  person.active
                    ? 'border-slate-200 bg-white hover:border-blue-300 shadow-2xs'
                    : 'border-slate-200/60 bg-slate-50 opacity-75'
                } flex flex-col justify-between space-y-3`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {person.designation}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        #{person.order}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {person.name}
                    </h4>
                  </div>

                  <button
                    type="button"
                    title={person.active ? 'Click to deactivate' : 'Click to activate'}
                    onClick={() => handleToggleActive(person)}
                    className="cursor-pointer"
                  >
                    {person.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#004182] shrink-0" />
                    <span className="font-semibold text-slate-800">{person.mobile}</span>
                  </div>
                  {person.email && (
                    <div className="flex items-center gap-2 break-all">
                      <Mail className="w-3.5 h-3.5 text-[#004182] shrink-0" />
                      <span className="text-slate-600">{person.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(person)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#004182] bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(person)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              No event coordinators listed.
            </p>
            <button
              type="button"
              onClick={() => openAddModal('coordinator')}
              className="text-xs font-bold text-[#004182] hover:underline"
            >
              + Add first coordinator
            </button>
          </div>
        )}
      </div>

      {/* ─── ADD / EDIT PERSON MODAL ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingPersonId ? 'Edit Contact Person' : 'Add New Contact Person'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={personForm.category}
                  onChange={(e) =>
                    setPersonForm((f) => ({
                      ...f,
                      category: e.target.value as 'leadership' | 'coordinator',
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="leadership">Project Showcase Leadership</option>
                  <option value="coordinator">Event Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={(e) => setPersonForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dr. CH. Hussaian Basha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  value={personForm.designation}
                  onChange={(e) => setPersonForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Dean-Project Show Case or Coordinator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={personForm.mobile}
                    onChange={(e) => setPersonForm((f) => ({ ...f, mobile: e.target.value }))}
                    placeholder="e.g. 9514418276"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (optional)
                  </label>
                  <input
                    type="email"
                    value={personForm.email}
                    onChange={(e) => setPersonForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. dean.psc@sru.edu.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={personForm.order}
                    onChange={(e) =>
                      setPersonForm((f) => ({
                        ...f,
                        order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <span className="text-xs font-bold text-slate-700">Active Status:</span>
                  <button
                    type="button"
                    onClick={() => setPersonForm((f) => ({ ...f, active: !f.active }))}
                    className="flex items-center gap-2 cursor-pointer text-xs font-bold"
                  >
                    {personForm.active ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                    <span className={personForm.active ? 'text-emerald-700' : 'text-slate-500'}>
                      {personForm.active ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPerson}
                  className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingPerson ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingPersonId ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ──────────────────────────────────────── */}
      {deleteModalOpen && personToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Delete this contact?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900">{personToDelete.name}</strong> ({personToDelete.designation}) from the public Contact page?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={deletingPerson}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPersonToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPerson}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
              >
                {deletingPerson ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

