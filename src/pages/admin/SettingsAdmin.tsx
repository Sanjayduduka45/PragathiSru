import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Calendar,
  Bell,
  Shield,
  Sliders,
  History,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  X,
  Mail,
  Building,
  Key,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  getAdminSettings,
  updateAdminSettings,
  resetAdminSettings,
  getUserRoles,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  getAuditLogs,
  type FullSettings,
  type UserRoleItem,
  type AuditLogItem,
  DEFAULT_FULL_SETTINGS,
} from '../../services/settingsService';

type TabKey = 'account' | 'event' | 'notifications' | 'roles' | 'system' | 'audit';

export const SettingsAdmin: React.FC = () => {
  const { user } = useAdminAuth();
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FullSettings>(DEFAULT_FULL_SETTINGS);

  // Form states
  const [eventForm, setEventForm] = useState(DEFAULT_FULL_SETTINGS.event);
  const [notifForm, setNotifForm] = useState(DEFAULT_FULL_SETTINGS.notifications);
  const [systemForm, setSystemForm] = useState(DEFAULT_FULL_SETTINGS.system);
  const [profileForm, setProfileForm] = useState(DEFAULT_FULL_SETTINGS.adminProfile);

  // Saving states
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Roles state
  const [roles, setRoles] = useState<UserRoleItem[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<{
    userEmail: string;
    role: 'admin' | 'coordinator' | 'jury' | 'participant';
    displayName: string;
    department: string;
    isActive: boolean;
  }>({
    userEmail: '',
    role: 'coordinator',
    displayName: '',
    department: '',
    isActive: true,
  });
  const [savingRole, setSavingRole] = useState(false);

  // Delete Role Modal
  const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<UserRoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Reset Confirmation Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetSection, setResetSection] = useState<'event' | 'notifications' | 'system' | 'all'>('all');
  const [resetting, setResetting] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedRoles] = await Promise.all([
        getAdminSettings(),
        getUserRoles(),
      ]);

      setSettings(fetchedSettings);
      setEventForm(fetchedSettings.event);
      setNotifForm(fetchedSettings.notifications);
      setSystemForm(fetchedSettings.system);
      setProfileForm({
        ...fetchedSettings.adminProfile,
        email: user?.email || fetchedSettings.adminProfile.email,
        lastSignIn: user?.last_sign_in_at || fetchedSettings.adminProfile.lastSignIn,
      });

      setRoles(fetchedRoles);
    } catch (err) {
      console.error('Failed to load admin settings:', err);
      addToast('error', 'Load Failed', 'Could not load configuration from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await getAuditLogs(50);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs();
    }
  }, [activeTab]);

  // ─── Save Handlers ──────────────────────────────────────────────────────────

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('account');
    try {
      const updated = await updateAdminSettings({ adminProfile: profileForm });
      setSettings(updated);
      addToast('success', 'Profile Updated', 'Administrator profile details saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Update Failed', msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('event');
    try {
      const updated = await updateAdminSettings({ event: eventForm });
      setSettings(updated);
      addToast('success', 'Event Configuration Saved', 'Event lifecycle and registration parameters updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Update Failed', msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('notifications');
    try {
      const updated = await updateAdminSettings({ notifications: notifForm });
      setSettings(updated);
      addToast('success', 'Notification Settings Saved', 'Email notification switches updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Update Failed', msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection('system');
    try {
      const updated = await updateAdminSettings({ system: systemForm });
      setSettings(updated);
      addToast('success', 'System Settings Saved', 'Security, banner, and maintenance settings updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Update Failed', msg);
    } finally {
      setSavingSection(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('error', 'Validation Error', 'Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Validation Error', 'Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      addToast('success', 'Password Updated', 'Your administrator password has been changed securely.');
      setPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      addToast('error', 'Password Update Failed', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      const reset = await resetAdminSettings(resetSection);
      setSettings(reset);
      if (resetSection === 'all' || resetSection === 'event') setEventForm(reset.event);
      if (resetSection === 'all' || resetSection === 'notifications') setNotifForm(reset.notifications);
      if (resetSection === 'all' || resetSection === 'system') setSystemForm(reset.system);
      addToast('success', 'Defaults Restored', `Settings restored to default baseline.`);
      setResetModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      addToast('error', 'Reset Failed', msg);
    } finally {
      setResetting(false);
    }
  };

  // ─── Role Handlers ──────────────────────────────────────────────────────────

  const openAddRoleModal = () => {
    setEditingRoleId(null);
    setRoleForm({
      userEmail: '',
      role: 'coordinator',
      displayName: '',
      department: '',
      isActive: true,
    });
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (roleItem: UserRoleItem) => {
    setEditingRoleId(roleItem.id);
    setRoleForm({
      userEmail: roleItem.userEmail,
      role: roleItem.role,
      displayName: roleItem.displayName,
      department: roleItem.department,
      isActive: roleItem.isActive,
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.userEmail || !roleForm.userEmail.includes('@')) {
      addToast('error', 'Validation Error', 'A valid email address is required.');
      return;
    }

    setSavingRole(true);
    try {
      if (editingRoleId) {
        await updateUserRole(editingRoleId, {
          role: roleForm.role,
          displayName: roleForm.displayName,
          department: roleForm.department,
          isActive: roleForm.isActive,
        });
        addToast('success', 'Role Updated', `Updated permissions for ${roleForm.userEmail}.`);
      } else {
        await createUserRole(roleForm);
        addToast('success', 'Role Assigned', `Assigned ${roleForm.role} to ${roleForm.userEmail}.`);
      }

      const updatedRoles = await getUserRoles();
      setRoles(updatedRoles);
      setRoleModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save role.';
      addToast('error', 'Role Save Failed', msg);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleRoleStatus = async (roleItem: UserRoleItem) => {
    try {
      const newStatus = !roleItem.isActive;
      await updateUserRole(roleItem.id, { isActive: newStatus });
      setRoles((prev) =>
        prev.map((r) => (r.id === roleItem.id ? { ...r, isActive: newStatus } : r))
      );
      addToast('info', 'Status Updated', `${roleItem.userEmail} is now ${newStatus ? 'active' : 'suspended'}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status.';
      addToast('error', 'Status Toggle Failed', msg);
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeletingRole(true);
    try {
      await deleteUserRole(roleToDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      addToast('success', 'Role Revoked', `Removed role for ${roleToDelete.userEmail}.`);
      setDeleteRoleModalOpen(false);
      setRoleToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      addToast('error', 'Revoke Failed', msg);
    } finally {
      setDeletingRole(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Settings & Platform Administration
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Configure system lifecycle parameters, administrative authentication, notification flags, role access matrices, and operational maintenance controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live DB Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              Local Store Active
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'account', label: 'Admin Account', icon: <User className="w-4 h-4" /> },
          { key: 'event', label: 'Event Configuration', icon: <Calendar className="w-4 h-4" /> },
          { key: 'notifications', label: 'Email & Alerts', icon: <Bell className="w-4 h-4" /> },
          { key: 'roles', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" /> },
          { key: 'system', label: 'System & Security', icon: <Sliders className="w-4 h-4" /> },
          { key: 'audit', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#004182] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 font-medium">
          Loading platform configuration...
        </div>
      ) : (
        <>
          {/* ─── TAB 1: ADMIN ACCOUNT ────────────────────────────────────────── */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#004182]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      Administrator Profile & Authentication
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                    Primary Account
                  </span>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profileForm.email}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Managed via Supabase Authentication identity</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, displayName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Role</span>
                      <p className="font-bold text-slate-800 capitalize">{profileForm.role}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Status</span>
                      <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {profileForm.accountStatus}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last Sign In</span>
                      <p className="font-bold text-slate-800 truncate">
                        {profileForm.lastSignIn ? new Date(profileForm.lastSignIn).toLocaleString() : 'Current Session Active'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingSection === 'account'}
                      className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      {savingSection === 'account' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Profile Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── TAB 2: EVENT CONFIGURATION ──────────────────────────────────── */}
          {activeTab === 'event' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#004182]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      Event Lifecycle & Registration Windows
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                    Public Event Parameters
                  </span>
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={eventForm.eventName}
                        onChange={(e) => setEventForm((f) => ({ ...f, eventName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Official Expo Date
                      </label>
                      <input
                        type="text"
                        value={eventForm.eventDate}
                        onChange={(e) => setEventForm((f) => ({ ...f, eventDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Registration Status
                      </label>
                      <select
                        value={eventForm.registrationStatus}
                        onChange={(e) => setEventForm((f) => ({ ...f, registrationStatus: e.target.value as 'open' | 'closed' | 'paused' }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="open">🟢 Open (Accepting Teams)</option>
                        <option value="paused">🟡 Paused (Temporarily Halted)</option>
                        <option value="closed">🔴 Closed (Registrations Concluded)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Website Visibility
                      </label>
                      <select
                        value={eventForm.websiteVisibility}
                        onChange={(e) => setEventForm((f) => ({ ...f, websiteVisibility: e.target.value as 'published' | 'maintenance' }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="published">Published & Live</option>
                        <option value="maintenance">Maintenance Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Event Lifecycle Status
                      </label>
                      <select
                        value={eventForm.eventStatus}
                        onChange={(e) => setEventForm((f) => ({ ...f, eventStatus: e.target.value as 'planning' | 'active' | 'completed' }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      >
                        <option value="planning">Planning Phase</option>
                        <option value="active">Active / In Progress</option>
                        <option value="completed">Completed / Post-Expo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Registration Open Date (ISO)
                      </label>
                      <input
                        type="text"
                        value={eventForm.registrationOpenDate}
                        onChange={(e) => setEventForm((f) => ({ ...f, registrationOpenDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Registration Close Date (ISO)
                      </label>
                      <input
                        type="text"
                        value={eventForm.registrationCloseDate}
                        onChange={(e) => setEventForm((f) => ({ ...f, registrationCloseDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingSection === 'event'}
                      className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      {savingSection === 'event' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Event Configuration
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResetSection('event');
                        setResetModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Event Defaults
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── TAB 3: EMAIL & NOTIFICATIONS ────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#004182]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      Email & Notification Dispatches
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                    Provider: {notifForm.providerStatus}
                  </span>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Sender Name / Header
                    </label>
                    <input
                      type="text"
                      value={notifForm.emailSenderName}
                      onChange={(e) => setNotifForm((f) => ({ ...f, emailSenderName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">Registration Confirmation Emails</p>
                        <p className="text-xs text-slate-500">Automatically send instant receipt & ID confirmation upon team registration submission.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifForm((f) => ({ ...f, registrationConfirmationEmailsEnabled: !f.registrationConfirmationEmailsEnabled }))}
                        className="cursor-pointer"
                      >
                        {notifForm.registrationConfirmationEmailsEnabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">General Announcement Emails</p>
                        <p className="text-xs text-slate-500">Allow bulk broadcasting of domain updates, schedule modifications, and venue instructions.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifForm((f) => ({ ...f, announcementEmailsEnabled: !f.announcementEmailsEnabled }))}
                        className="cursor-pointer"
                      >
                        {notifForm.announcementEmailsEnabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">Critical Expo Reminders</p>
                        <p className="text-xs text-slate-500">Send automatic countdown reminders and verification alerts to registered team leaders.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifForm((f) => ({ ...f, eventReminderAlertsEnabled: !f.eventReminderAlertsEnabled }))}
                        className="cursor-pointer"
                      >
                        {notifForm.eventReminderAlertsEnabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingSection === 'notifications'}
                      className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      {savingSection === 'notifications' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Notification Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── TAB 4: ROLES & PERMISSIONS ──────────────────────────────────── */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#004182]" />
                      Role-Based Access Control (RBAC)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Assign administrative, coordinator, jury, and participant roles to authenticated users.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddRoleModal}
                    className="inline-flex items-center gap-1.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign New Role
                  </button>
                </div>

                {/* Roles List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        item.isActive
                          ? 'border-slate-200 bg-white hover:border-blue-300 shadow-2xs'
                          : 'border-slate-200/60 bg-slate-50 opacity-75'
                      } flex flex-col justify-between space-y-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              item.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : item.role === 'coordinator'
                                ? 'bg-blue-50 text-[#004182] border-blue-100'
                                : item.role === 'jury'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {item.role}
                            </span>
                            {item.department && (
                              <span className="text-[10px] font-bold text-slate-400">
                                {item.department}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {item.displayName || item.userEmail}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{item.userEmail}</p>
                        </div>

                        <button
                          type="button"
                          title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
                          onClick={() => handleToggleRoleStatus(item)}
                          className="cursor-pointer"
                        >
                          {item.isActive ? (
                            <ToggleRight className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>Assigned by {item.assignedBy}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditRoleModal(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#004182] bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          {item.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoleToDelete(item);
                                setDeleteRoleModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capability Matrix */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Role Capabilities Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Capability / Module</th>
                          <th className="p-3 text-center">Admin</th>
                          <th className="p-3 text-center">Coordinator</th>
                          <th className="p-3 text-center">Jury</th>
                          <th className="p-3 text-center">Participant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr>
                          <td className="p-3">Content Management (About, Domains, Schedule, FAQs, etc.)</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✓ Full CRUD</td>
                          <td className="p-3 text-center text-slate-400">Read-Only</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                        </tr>
                        <tr>
                          <td className="p-3">System Settings & RBAC Management</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                        </tr>
                        <tr>
                          <td className="p-3">Registrations & Team Approvals</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✓ Approve / Reject</td>
                          <td className="p-3 text-center text-blue-600 font-bold">✓ Verify & Review</td>
                          <td className="p-3 text-center text-slate-400">Assigned Teams</td>
                          <td className="p-3 text-center text-slate-400">Own Team Only</td>
                        </tr>
                        <tr>
                          <td className="p-3">Score Evaluation & Scoring Rubrics</td>
                          <td className="p-3 text-center text-emerald-600 font-bold">✓ Full Override</td>
                          <td className="p-3 text-center text-slate-400">Stall Monitoring</td>
                          <td className="p-3 text-center text-amber-600 font-bold">✓ Score Submissions</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 5: SYSTEM & SECURITY ────────────────────────────────────── */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#004182]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      System Controls, Capacity & Maintenance
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                    Security Level: High
                  </span>
                </div>

                <form onSubmit={handleSaveSystem} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Maximum Registration Capacity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={systemForm.maxRegistrations}
                        onChange={(e) => setSystemForm((f) => ({ ...f, maxRegistrations: parseInt(e.target.value, 10) || 500 }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Stops incoming submissions when capacity limit is reached</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Maintenance Mode
                      </label>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">
                          {systemForm.maintenanceMode ? '🔒 Active (Public Access Blocked)' : '🔓 Inactive (Public Live)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSystemForm((f) => ({ ...f, maintenanceMode: !f.maintenanceMode }))}
                          className="cursor-pointer"
                        >
                          {systemForm.maintenanceMode ? (
                            <ToggleRight className="w-7 h-7 text-rose-500" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Global Portal Announcement Banner
                      </label>
                      <button
                        type="button"
                        onClick={() => setSystemForm((f) => ({ ...f, announcementBannerEnabled: !f.announcementBannerEnabled }))}
                        className="cursor-pointer"
                      >
                        {systemForm.announcementBannerEnabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={systemForm.announcementBannerText}
                      onChange={(e) => setSystemForm((f) => ({ ...f, announcementBannerText: e.target.value }))}
                      placeholder="e.g. Important: Last date for project abstract submission is 01 October 2026!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">Enhanced Diagnostic Logging</p>
                      <p className="text-[11px] text-slate-500">Record verbose API and database transaction telemetry in server logs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSystemForm((f) => ({ ...f, debugLogging: !f.debugLogging }))}
                      className="cursor-pointer"
                    >
                      {systemForm.debugLogging ? (
                        <ToggleRight className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingSection === 'system'}
                      className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      {savingSection === 'system' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save System Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResetSection('all');
                        setResetModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore All System Defaults
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── TAB 6: AUDIT TRAIL ──────────────────────────────────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#004182]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      System Audit Log & Activity Trail
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={loadLogs}
                    className="text-xs font-bold text-[#004182] hover:underline cursor-pointer"
                  >
                    Refresh Logs
                  </button>
                </div>

                {loadingAudit ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    Loading audit trail...
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#004182] uppercase bg-blue-50 px-2 py-0.5 rounded text-[10px] border border-blue-100">
                              {log.action}
                            </span>
                            <span className="font-semibold text-slate-800">{log.details}</span>
                          </div>
                          {log.target && (
                            <p className="text-[11px] text-slate-400">Target: {log.target}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 text-slate-400 text-[11px]">
                          <div>By: <strong className="text-slate-600">{log.performedBy}</strong></div>
                          <div>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-xl text-center text-xs text-slate-400">
                    No recent audit logs available.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── MODAL: CHANGE PASSWORD ─────────────────────────────────────────── */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#004182]" />
                Change Password
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {changingPassword ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT ROLE ─────────────────────────────────────────── */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#004182]" />
                {editingRoleId ? 'Edit Role Assignment' : 'Assign New Role'}
              </h3>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  User Email *
                </label>
                <input
                  type="email"
                  disabled={!!editingRoleId}
                  value={roleForm.userEmail}
                  onChange={(e) => setRoleForm((f) => ({ ...f, userEmail: e.target.value }))}
                  placeholder="e.g. coordinator.cse@sru.edu.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Role Category *
                  </label>
                  <select
                    value={roleForm.role}
                    onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="coordinator">Event Coordinator</option>
                    <option value="jury">Jury / Evaluator</option>
                    <option value="participant">Participant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.displayName}
                    onChange={(e) => setRoleForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="e.g. Prof. Ramesh Rao"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department / Organization
                </label>
                <input
                  type="text"
                  value={roleForm.department}
                  onChange={(e) => setRoleForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-700">Account Status:</span>
                <button
                  type="button"
                  onClick={() => setRoleForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="flex items-center gap-2 cursor-pointer text-xs font-bold"
                >
                  {roleForm.isActive ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                  <span className={roleForm.isActive ? 'text-emerald-700' : 'text-slate-500'}>
                    {roleForm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {savingRole ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingRoleId ? 'Update Role' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE ROLE CONFIRMATION ────────────────────────────────── */}
      {deleteRoleModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Revoke Role Assignment?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to revoke <strong className="text-slate-900">{roleToDelete.role}</strong> access for <strong className="text-slate-900">{roleToDelete.userEmail}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={deletingRole}
                onClick={() => {
                  setDeleteRoleModalOpen(false);
                  setRoleToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRole}
                onClick={handleConfirmDeleteRole}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {deletingRole ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RESET DEFAULTS CONFIRMATION ─────────────────────────────── */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Restore Default Baseline?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will reset the <strong className="text-slate-900">{resetSection}</strong> configuration back to the factory defaults. This action cannot be undone automatically.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetConfirm}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {resetting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
