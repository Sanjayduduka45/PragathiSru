import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Key,
  FolderPlus,
  Trash2,
  Edit3,
  ExternalLink,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  JuryProfile,
  DomainAssignmentItem,
  ProjectAssignmentItem,
  JuryCompletionOverviewResponse,
  ProjectCompletionItem,
  JuryProjectProgressResponse,
  JuryProjectProgressItem,
} from '../../types';
import { JuryService } from '../../services/juryService';
import { api } from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { sessionManager } from '../../services/sessionManager';

export const JuryAdmin: React.FC = () => {
  const { toasts, addToast, dismissToast } = useAdminToast();

  // Active Tab: 'juries' | 'assignments' | 'completion'
  const [activeTab, setActiveTab] = useState<'juries' | 'assignments' | 'completion'>('juries');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [juryLoadError, setJuryLoadError] = useState<string | null>(null);

  // Data Stores
  const [juries, setJuries] = useState<JuryProfile[]>([]);
  const [completionData, setCompletionData] = useState<JuryCompletionOverviewResponse | null>(null);
  const [domains, setDomains] = useState<Array<{ id: string; title: string; category?: string }>>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);

  // Selected Jury for Assignments Tab
  const [selectedJuryId, setSelectedJuryId] = useState<string | null>(null);
  const [selectedJuryAssignments, setSelectedJuryAssignments] = useState<DomainAssignmentItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Selected Jury's Project Progress
  const [projectProgress, setProjectProgress] = useState<JuryProjectProgressResponse | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressSearch, setProgressSearch] = useState('');
  const [progressStatusFilter, setProgressStatusFilter] = useState<'ALL' | 'EVALUATED' | 'PENDING'>('ALL');

  // Modals
  const [createJuryModalOpen, setCreateJuryModalOpen] = useState(false);
  const [createJuryForm, setCreateJuryForm] = useState({
    name: '',
    email: '',
    department: '',
    temporaryPassword: '',
    isActive: true,
  });
  const [creatingJury, setCreatingJury] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password?: string } | null>(null);

  // Edit Jury Profile Modal
  const [editJuryModalOpen, setEditJuryModalOpen] = useState(false);
  const [juryToEdit, setJuryToEdit] = useState<{ id: string; user_id: string; name: string; department: string; is_active: boolean } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Assign Domain Modal
  const [assignDomainModalOpen, setAssignDomainModalOpen] = useState(false);
  const [assignDomainForm, setAssignDomainForm] = useState<{
    domain_id: string;
    assignment_mode: 'ALL' | 'SELECTED';
    selected_reg_ids: string[];
  }>({
    domain_id: '',
    assignment_mode: 'ALL',
    selected_reg_ids: [],
  });
  const [assigningDomain, setAssigningDomain] = useState(false);

  // Manage Selected Projects Modal (for an existing SELECTED assignment)
  const [manageProjectsModalOpen, setManageProjectsModalOpen] = useState(false);
  const [activeAssignmentForProjects, setActiveAssignmentForProjects] = useState<DomainAssignmentItem | null>(null);
  const [selectedAssignmentProjects, setSelectedAssignmentProjects] = useState<ProjectAssignmentItem[]>([]);
  const [loadingSelectedProjects, setLoadingSelectedProjects] = useState(false);
  const [additionalRegIdsToAdd, setAdditionalRegIdsToAdd] = useState<string[]>([]);
  const [savingProjects, setSavingProjects] = useState(false);

  // Filters & Search
  const [jurySearch, setJurySearch] = useState('');
  const [completionSearch, setCompletionSearch] = useState('');
  const [completionStatusFilter, setCompletionStatusFilter] = useState<string>('ALL');
  const [completionDomainFilter, setCompletionDomainFilter] = useState<string>('ALL');

  // ─── LAZY TAB DATA LOADER ───────────────────────────────────────────────────
  const loadedTabsRef = React.useRef(new Set<string>());

  // Tab 1: Juries only
  const loadJuries = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setJuryLoadError(null);
    try {
      const juriesRes = await JuryService.listJuries();
      setJuries(juriesRes || []);
      setJuryLoadError(null);
      loadedTabsRef.current.add('juries');
      return juriesRes || [];
    } catch (jErr: any) {
      console.error('[JuryAdmin] Failed to load juries:', jErr);
      const errMsg = jErr.message || 'Unable to load jury accounts.';
      setJuryLoadError(errMsg);
      addToast('error', 'Jury Load Error', errMsg);
      return [];
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  // ─── JURY PROJECT PROGRESS LOADER ──────────────────────────────────────────
  const loadJuryProjectProgress = useCallback(async (judgeUserId: string) => {
    setLoadingProgress(true);
    setProgressError(null);
    try {
      const res = await JuryService.getProjectProgress(judgeUserId);
      setProjectProgress(res);
      setProgressError(null);
    } catch (err: any) {
      console.error('[JuryAdmin] Load jury project progress error:', err);
      const msg = err.message || 'Unable to load jury project progress';
      setProgressError(msg);
      setProjectProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  // ─── JURY ASSIGNMENTS LOADER ────────────────────────────────────────────────
  const loadJuryAssignments = useCallback(async (judgeUserId: string) => {
    setLoadingAssignments(true);
    try {
      const res = await JuryService.getJuryAssignments(judgeUserId);
      setSelectedJuryAssignments(res || []);
    } catch (err: any) {
      console.error('[JuryAdmin] Load assignments error:', err);
      addToast('error', 'Assignments Error', err.message || 'Failed to load jury assignments.');
    } finally {
      setLoadingAssignments(false);
    }
    loadJuryProjectProgress(judgeUserId);
  }, [loadJuryProjectProgress, addToast]);

  // Tab 2: Domain & Project Assignments (auxiliary data + selected jury progress)
  const loadAssignmentsTab = useCallback(async (targetJuryId?: string, force = false) => {
    if (!force && loadedTabsRef.current.has('assignments') && domains.length > 0 && allRegistrations.length > 0) {
      const jId = targetJuryId || selectedJuryId;
      if (jId) {
        loadJuryAssignments(jId);
      }
      return;
    }

    try {
      const [domainsRes, regsRes] = await Promise.all([
        domains.length === 0 || force ? api.domains.get().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: domains }),
        allRegistrations.length === 0 || force ? api.admin.getRegistrations().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: allRegistrations }),
      ]);

      if (domainsRes?.data) setDomains(domainsRes.data);
      if (regsRes?.data) setAllRegistrations(regsRes.data);
      loadedTabsRef.current.add('assignments');

      const jId = targetJuryId || selectedJuryId || (juries.length > 0 ? juries[0].user_id : null);
      if (jId) {
        if (!selectedJuryId) setSelectedJuryId(jId);
        loadJuryAssignments(jId);
      }
    } catch (err: any) {
      console.error('[JuryAdmin] Load assignments tab error:', err);
    }
  }, [domains, allRegistrations, selectedJuryId, juries, loadJuryAssignments]);

  // Tab 3: Evaluation Completion Matrix only
  const loadCompletionTab = useCallback(async (force = false) => {
    if (!force && loadedTabsRef.current.has('completion') && completionData) {
      return;
    }
    try {
      const res = await JuryService.getCompletionOverview();
      setCompletionData(res);
      loadedTabsRef.current.add('completion');
    } catch (err: any) {
      console.error('[JuryAdmin] Load completion overview error:', err);
      addToast('error', 'Completion Error', 'Failed to load evaluation completion matrix.');
    }
  }, [completionData, addToast]);

  // Initial load: Only load juries + auto-revalidate on wake/focus
  useEffect(() => {
    loadJuries();
    const unsub = sessionManager.onRevalidate(() => {
      loadJuries(false);
    });
    return unsub;
  }, [loadJuries]);

  // Trigger lazy loading when tab switches
  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignmentsTab();
    } else if (activeTab === 'completion') {
      loadCompletionTab();
    }
  }, [activeTab, loadAssignmentsTab, loadCompletionTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'juries') {
      await loadJuries(false);
    } else if (activeTab === 'assignments') {
      await loadJuries(false);
      await loadAssignmentsTab(selectedJuryId || undefined, true);
    } else if (activeTab === 'completion') {
      await loadCompletionTab(true);
    }
    setRefreshing(false);
  };


  const handleSelectJury = (judgeUserId: string) => {
    setSelectedJuryId(judgeUserId);
    loadJuryAssignments(judgeUserId);
  };

  // ─── CREATE JURY ────────────────────────────────────────────────────────────
  const handleCreateJurySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createJuryForm.name.trim() || !createJuryForm.email.trim() || !createJuryForm.department.trim()) {
      addToast('error', 'Missing Information', 'Please fill in Name, Email, and Department.');
      return;
    }

    setCreatingJury(true);
    try {
      const res = await JuryService.createJury({
        name: createJuryForm.name.trim(),
        email: createJuryForm.email.trim().toLowerCase(),
        department: createJuryForm.department.trim(),
        temporaryPassword: createJuryForm.temporaryPassword.trim() || undefined,
        isActive: createJuryForm.isActive,
      });

      addToast('success', 'Jury Account Created', `Created account for ${createJuryForm.name}`);
      setCreatedCredentials({
        email: createJuryForm.email.trim().toLowerCase(),
        password: res?.temporaryPassword || createJuryForm.temporaryPassword || 'Generated by system',
      });
      setCreateJuryForm({
        name: '',
        email: '',
        department: '',
        temporaryPassword: '',
        isActive: true,
      });
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Create jury error:', err);
      addToast('error', 'Account Creation Failed', err.message || 'Failed to create jury account via Edge Function.');
    } finally {
      setCreatingJury(false);
    }
  };

  // ─── EDIT JURY PROFILE ──────────────────────────────────────────────────────
  const handleSaveJuryEdit = async () => {
    if (!juryToEdit) return;
    setSavingEdit(true);
    try {
      await JuryService.updateJuryProfile(juryToEdit.user_id, {
        name: juryToEdit.name.trim(),
        department: juryToEdit.department.trim(),
        is_active: juryToEdit.is_active,
      });
      addToast('success', 'Profile Updated', 'Jury profile updated successfully.');
      setEditJuryModalOpen(false);
      setJuryToEdit(null);
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Edit jury error:', err);
      addToast('error', 'Update Failed', err.message || 'Could not update jury profile.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleJuryActive = async (jury: JuryProfile) => {
    const nextState = !jury.is_active;
    try {
      await JuryService.updateJuryProfile(jury.user_id, { is_active: nextState });
      addToast(
        'success',
        nextState ? 'Jury Activated' : 'Jury Deactivated',
        `${jury.name} is now ${nextState ? 'active' : 'inactive'}.`
      );
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Toggle status error:', err);
      addToast('error', 'Status Update Failed', err.message || 'Failed to update active status.');
    }
  };

  // ─── ASSIGN DOMAIN SUBMIT ───────────────────────────────────────────────────
  const handleAssignDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJuryId) {
      addToast('error', 'No Jury Selected', 'Please select a jury first.');
      return;
    }
    if (!assignDomainForm.domain_id) {
      addToast('error', 'No Domain Selected', 'Please choose a target domain to assign.');
      return;
    }

    setAssigningDomain(true);
    try {
      const res = await JuryService.assignDomain(selectedJuryId, {
        domain_id: assignDomainForm.domain_id,
        assignment_mode: assignDomainForm.assignment_mode,
      });

      // If SELECTED mode and projects were checked, add them
      if (
        assignDomainForm.assignment_mode === 'SELECTED' &&
        assignDomainForm.selected_reg_ids.length > 0 &&
        res?.assignment?.id
      ) {
        await JuryService.addSelectedProjects(res.assignment.id, assignDomainForm.selected_reg_ids);
      }

      addToast('success', 'Domain Assigned', 'Domain assignment configured successfully.');
      setAssignDomainModalOpen(false);
      setAssignDomainForm({
        domain_id: '',
        assignment_mode: 'ALL',
        selected_reg_ids: [],
      });
      await loadJuryAssignments(selectedJuryId);
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Assign domain error:', err);
      addToast('error', 'Assignment Failed', err.message || 'Could not assign domain to jury.');
    } finally {
      setAssigningDomain(false);
    }
  };

  // ─── REMOVE ASSIGNMENT ──────────────────────────────────────────────────────
  const handleRemoveAssignment = async (assignment: DomainAssignmentItem) => {
    if (!window.confirm(`Are you sure you want to remove the domain assignment for "${assignment.domain_title}"?`)) {
      return;
    }

    try {
      await JuryService.removeAssignment(assignment.id);
      addToast('success', 'Assignment Removed', `Removed ${assignment.domain_title} assignment.`);
      if (selectedJuryId) {
        await loadJuryAssignments(selectedJuryId);
      }
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Remove assignment error:', err);
      // Assignment Integrity check error handling
      if (err.message?.includes('already submitted evaluations') || err.message?.includes('conflict')) {
        addToast(
          'error',
          'Assignment Locked by Evaluations',
          'Cannot remove assignment: this jury has already submitted evaluations for projects in this domain. Please reset the affected evaluations in Results first.'
        );
      } else {
        addToast('error', 'Removal Failed', err.message || 'Failed to remove domain assignment.');
      }
    }
  };

  // ─── TOGGLE ASSIGNMENT MODE ─────────────────────────────────────────────────
  const handleToggleAssignmentMode = async (assignment: DomainAssignmentItem) => {
    const nextMode = assignment.assignment_mode === 'ALL' ? 'SELECTED' : 'ALL';
    try {
      await JuryService.updateAssignmentMode(assignment.id, nextMode);
      addToast('success', 'Mode Updated', `Assignment mode switched to ${nextMode}.`);
      if (selectedJuryId) {
        await loadJuryAssignments(selectedJuryId);
      }
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Update mode error:', err);
      addToast('error', 'Update Failed', err.message || 'Could not update assignment mode.');
    }
  };

  // ─── MANAGE SELECTED PROJECTS FOR ASSIGNMENT ────────────────────────────────
  const handleOpenManageProjects = async (assignment: DomainAssignmentItem) => {
    setActiveAssignmentForProjects(assignment);
    setManageProjectsModalOpen(true);
    setLoadingSelectedProjects(true);
    setAdditionalRegIdsToAdd([]);
    try {
      const res = await JuryService.getSelectedProjects(assignment.id);
      setSelectedAssignmentProjects(res || []);
    } catch (err: any) {
      console.error('[JuryAdmin] Load selected projects error:', err);
      addToast('error', 'Error', 'Failed to load projects for assignment.');
    } finally {
      setLoadingSelectedProjects(false);
    }
  };

  const handleRemoveProjectAssignment = async (projectAssignmentId: string) => {
    try {
      await JuryService.removeSelectedProject(projectAssignmentId);
      setSelectedAssignmentProjects((prev) => prev.filter((p) => p.id !== projectAssignmentId));
      addToast('success', 'Project Removed', 'Project removed from jury assignment.');
      if (selectedJuryId) {
        await loadJuryAssignments(selectedJuryId);
      }
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Remove project error:', err);
      if (err.message?.includes('already evaluated')) {
        addToast(
          'error',
          'Project Locked',
          'Cannot remove project: jury has already submitted an evaluation for this project. Reset the evaluation in Results first.'
        );
      } else {
        addToast('error', 'Removal Failed', err.message || 'Failed to remove project assignment.');
      }
    }
  };

  const handleSaveAdditionalProjects = async () => {
    if (!activeAssignmentForProjects || additionalRegIdsToAdd.length === 0) return;
    setSavingProjects(true);
    try {
      await JuryService.addSelectedProjects(activeAssignmentForProjects.id, additionalRegIdsToAdd);
      addToast('success', 'Projects Added', `Added ${additionalRegIdsToAdd.length} projects to assignment.`);
      setAdditionalRegIdsToAdd([]);
      const updated = await JuryService.getSelectedProjects(activeAssignmentForProjects.id);
      setSelectedAssignmentProjects(updated || []);
      if (selectedJuryId) {
        await loadJuryAssignments(selectedJuryId);
      }
      await loadData();
    } catch (err: any) {
      console.error('[JuryAdmin] Add projects error:', err);
      addToast('error', 'Addition Failed', err.message || 'Could not add projects to assignment.');
    } finally {
      setSavingProjects(false);
    }
  };

  // ─── FILTERED VIEWS ─────────────────────────────────────────────────────────
  const filteredJuries = useMemo(() => {
    const q = jurySearch.toLowerCase().trim();
    if (!q) return juries;
    return juries.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.email.toLowerCase().includes(q) ||
        (j.department || '').toLowerCase().includes(q)
    );
  }, [juries, jurySearch]);

  const selectedJury = useMemo(() => {
    return juries.find((j) => j.user_id === selectedJuryId) || null;
  }, [juries, selectedJuryId]);

  // Filtered Project Progress for Selected Jury
  const filteredProjectProgress = useMemo(() => {
    if (!projectProgress?.projects) return [];
    return projectProgress.projects.filter((p) => {
      const q = progressSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.project_title.toLowerCase().includes(q) ||
        p.registration_id.toLowerCase().includes(q) ||
        p.team_name.toLowerCase().includes(q) ||
        (p.domain_title || '').toLowerCase().includes(q);

      const matchesStatus =
        progressStatusFilter === 'ALL' || p.evaluation_status === progressStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projectProgress, progressSearch, progressStatusFilter]);

  // Projects available for selected domain in Assign Modal
  const availableProjectsForDomain = useMemo(() => {
    if (!assignDomainForm.domain_id) return [];
    const domObj = domains.find((d) => d.id === assignDomainForm.domain_id);
    const domTitle = domObj?.title?.toLowerCase() || '';

    return allRegistrations.filter((r) => {
      const regCat = (r.category || '').toLowerCase();
      // Match category loosely or exact
      return (
        regCat.includes(domTitle) ||
        domTitle.includes(regCat) ||
        r.domain_id === assignDomainForm.domain_id
      );
    });
  }, [assignDomainForm.domain_id, domains, allRegistrations]);

  // Available projects to add in Manage Projects Modal
  const availableProjectsForActiveAssignment = useMemo(() => {
    if (!activeAssignmentForProjects) return [];
    const assignedRegIds = new Set(selectedAssignmentProjects.map((p) => p.registration_id));
    const domTitle = activeAssignmentForProjects.domain_title.toLowerCase();

    return allRegistrations.filter((r) => {
      if (assignedRegIds.has(r.registration_id)) return false;
      const regCat = (r.category || '').toLowerCase();
      return (
        regCat.includes(domTitle) ||
        domTitle.includes(regCat) ||
        r.domain_id === activeAssignmentForProjects.domain_id
      );
    });
  }, [activeAssignmentForProjects, selectedAssignmentProjects, allRegistrations]);

  // Filtered Completion Rows
  const filteredCompletionRows = useMemo(() => {
    if (!completionData?.projects) return [];
    return completionData.projects.filter((p) => {
      // Search
      const q = completionSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.project_title.toLowerCase().includes(q) ||
        p.registration_id.toLowerCase().includes(q) ||
        p.team_name.toLowerCase().includes(q);

      // Status Filter
      const matchesStatus =
        completionStatusFilter === 'ALL' || p.status === completionStatusFilter;

      // Domain Filter
      const matchesDomain =
        completionDomainFilter === 'ALL' ||
        p.domain_id === completionDomainFilter ||
        p.domain_title === completionDomainFilter ||
        p.category === completionDomainFilter;

      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [completionData, completionSearch, completionStatusFilter, completionDomainFilter]);

  // Completion Stats Summary
  const stats = useMemo(() => {
    const total = completionData?.total_projects || 0;
    const completed = completionData?.completed_projects || 0;
    const inProgress = completionData?.in_progress_projects || 0;
    const notEvaluated = completionData?.not_evaluated_projects || 0;
    const unassigned = completionData?.unassigned_projects || 0;

    return { total, completed, inProgress, notEvaluated, unassigned };
  }, [completionData]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Jury &amp; Domain Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic jury creation, canonical domain assignment, and authoritative real-time completion tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateJuryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Jury Member
          </button>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('juries')}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'juries'
                ? 'border-[#004182] text-[#004182]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Juries Panel
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'juries'
                  ? 'bg-blue-100 text-[#004182]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {loading ? '—' : (juryLoadError && juries.length === 0 ? '—' : juries.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'assignments'
                ? 'border-[#004182] text-[#004182]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Domain &amp; Project Assignments
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completion')}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
              activeTab === 'completion'
                ? 'border-[#004182] text-[#004182]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Evaluation Completion Matrix
            {stats.completed > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {stats.completed}/{stats.total}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ─── TAB 1: JURIES ───────────────────────────────────────────────────── */}
      {activeTab === 'juries' && (
        <div className="space-y-6">
          {/* Error Banner when jury API fails */}
          {juryLoadError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-900">Unable to load jury accounts</p>
                  <p className="text-[11px] text-rose-700">{juryLoadError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Retry Loading
              </button>
            </div>
          )}

          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Juries
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {loading || (juryLoadError && juries.length === 0) ? '—' : juries.length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Active Juries
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {loading || (juryLoadError && juries.length === 0) ? '—' : juries.filter((j) => j.is_active).length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Inactive Juries
              </span>
              <span className="text-2xl font-black text-slate-500 mt-1 block">
                {loading || (juryLoadError && juries.length === 0) ? '—' : juries.filter((j) => !j.is_active).length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                Total Evaluations Conducted
              </span>
              <span className="text-2xl font-black text-[#004182] mt-1 block">
                {loading || (juryLoadError && juries.length === 0) ? '—' : juries.reduce((sum, j) => sum + (j.evaluations_completed || 0), 0)}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={jurySearch}
              onChange={(e) => setJurySearch(e.target.value)}
              placeholder="Search jury by name, email, or department..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {jurySearch && (
              <button
                type="button"
                onClick={() => setJurySearch('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Juries Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Jury Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Assigned Domains</th>
                    <th className="py-3 px-4 text-center">Evaluations Completed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {juryLoadError && juries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-slate-800">Unable to load jury accounts</p>
                          <p className="text-xs text-slate-500">{juryLoadError}</p>
                          <button
                            type="button"
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredJuries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No jury accounts found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredJuries.map((jury) => (
                      <tr key={jury.user_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#004182] font-black text-xs flex items-center justify-center shrink-0 uppercase">
                              {jury.name.charAt(0) || 'J'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{jury.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{jury.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {jury.department || 'General'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {jury.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <UserCheck className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              <UserX className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {jury.assigned_domains_count}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-extrabold text-[#004182] bg-blue-50 px-2 py-0.5 rounded-md">
                            {jury.evaluations_completed}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setJuryToEdit({
                                  id: jury.id,
                                  user_id: jury.user_id,
                                  name: jury.name,
                                  department: jury.department || '',
                                  is_active: jury.is_active,
                                });
                                setEditJuryModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Jury Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleJuryActive(jury)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                jury.is_active
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={jury.is_active ? 'Deactivate Jury' : 'Activate Jury'}
                            >
                              {jury.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJuryId(jury.user_id);
                                loadJuryAssignments(jury.user_id);
                                setActiveTab('assignments');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#004182] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Assign
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ASSIGNMENTS ─────────────────────────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Jury Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Select Jury Member
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">{juries.length} total</span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {juries.map((jury) => {
                const isSelected = jury.user_id === selectedJuryId;
                return (
                  <button
                    key={jury.user_id}
                    type="button"
                    onClick={() => handleSelectJury(jury.user_id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#004182] shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-[#004182]' : 'text-slate-900'}`}>
                        {jury.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                        {jury.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          jury.assigned_domains_count > 0
                            ? 'bg-blue-100 text-[#004182]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {jury.assigned_domains_count} domains
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Jury's Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJury ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                {/* Header Profile Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedJury.name}
                      </h3>
                      {selectedJury.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedJury.email} • {selectedJury.department || 'Department Unassigned'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignDomainForm({
                        domain_id: '',
                        assignment_mode: 'ALL',
                        selected_reg_ids: [],
                      });
                      setAssignDomainModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Assign Domain
                  </button>
                </div>

                {/* ─── SECTION B: PROGRESS SUMMARY CARDS ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Assigned Projects */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Assigned Projects
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                        {progressError ? '—' : loadingProgress ? '…' : (projectProgress?.assigned_projects ?? 0)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004182] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Evaluated Projects */}
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Evaluated
                      </span>
                      <span className="text-2xl font-black text-emerald-800 mt-0.5 block">
                        {progressError ? '—' : loadingProgress ? '…' : (projectProgress?.evaluated_projects ?? 0)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Remaining Projects */}
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                        Remaining
                      </span>
                      <span className="text-2xl font-black text-amber-800 mt-0.5 block">
                        {progressError ? '—' : loadingProgress ? '…' : (projectProgress?.remaining_projects ?? 0)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Progress Load Error Banner with Retry */}
                {progressError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-rose-900">Unable to load jury project progress</p>
                        <p className="text-[11px] text-rose-700">{progressError}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectedJuryId && loadJuryProjectProgress(selectedJuryId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingProgress ? 'animate-spin' : ''}`} />
                      Retry
                    </button>
                  </div>
                )}

                {/* ─── SECTION C: ASSIGNED DOMAINS ─── */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                    Assigned Domains ({selectedJuryAssignments.length})
                  </h4>

                  {loadingAssignments ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#004182]" />
                      Loading assignments…
                    </div>
                  ) : selectedJuryAssignments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs font-medium">No domains assigned to this jury member yet.</p>
                      <button
                        type="button"
                        onClick={() => setAssignDomainModalOpen(true)}
                        className="mt-2 text-xs text-[#004182] font-bold hover:underline cursor-pointer"
                      >
                        + Click here to assign their first domain
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedJuryAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {assignment.domain_title}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                {assignment.domain_id}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              {assignment.assignment_mode === 'ALL' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  <Sparkles className="w-3 h-3 text-blue-600" />
                                  ALL Mode (Dynamic: all current &amp; future projects)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                  <CheckSquare className="w-3 h-3 text-purple-600" />
                                  SELECTED Mode ({assignment.selected_projects_count} projects curated)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Toggle Mode Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleAssignmentMode(assignment)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Toggle between ALL and SELECTED modes"
                            >
                              Switch to {assignment.assignment_mode === 'ALL' ? 'SELECTED' : 'ALL'}
                            </button>

                            {/* If SELECTED: Manage Projects Button */}
                            {assignment.assignment_mode === 'SELECTED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenManageProjects(assignment)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                              >
                                Manage Projects
                              </button>
                            )}

                            {/* Remove Assignment Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(assignment)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove domain assignment (Assignment Integrity Rule applies)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── SECTION D: PROJECT EVALUATION PROGRESS ─── */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Project Evaluation Progress
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Authoritative live progress for projects assigned to this jury member.
                      </p>
                    </div>

                    {/* Search & Status Filter */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={progressSearch}
                          onChange={(e) => setProgressSearch(e.target.value)}
                          placeholder="Filter projects…"
                          className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-800 placeholder-slate-400 w-36 sm:w-44"
                        />
                      </div>

                      <select
                        value={progressStatusFilter}
                        onChange={(e) => setProgressStatusFilter(e.target.value as any)}
                        className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Status</option>
                        <option value="EVALUATED">Evaluated</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>
                  </div>

                  {loadingProgress ? (
                    <div className="py-10 text-center text-slate-400 flex items-center justify-center gap-2 text-xs bg-slate-50 rounded-xl border border-slate-200">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#004182]" />
                      Loading project evaluation progress…
                    </div>
                  ) : progressError ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-rose-200">
                      <p className="text-xs font-medium text-rose-700">Unable to load project evaluation progress.</p>
                      <button
                        type="button"
                        onClick={() => selectedJuryId && loadJuryProjectProgress(selectedJuryId)}
                        className="mt-2 text-xs text-[#004182] font-bold hover:underline cursor-pointer"
                      >
                        Click to retry loading progress
                      </button>
                    </div>
                  ) : !projectProgress || projectProgress.projects.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs font-medium text-slate-600">No projects currently assigned to this jury.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Assign domains or explicit projects above to populate evaluation queue.</p>
                    </div>
                  ) : filteredProjectProgress.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-medium">No assigned projects match your search/filter.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                            <th className="py-2.5 px-3">Project &amp; Team</th>
                            <th className="py-2.5 px-3">Registration ID</th>
                            <th className="py-2.5 px-3">Canonical Domain</th>
                            <th className="py-2.5 px-3 text-center">Assignment Source</th>
                            <th className="py-2.5 px-3 text-center">Evaluation Status</th>
                            <th className="py-2.5 px-3 text-center">Score</th>
                            <th className="py-2.5 px-3 text-right">Submitted At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProjectProgress.map((p) => {
                            const isEvaluated = p.evaluation_status === 'EVALUATED';
                            return (
                              <tr key={p.registration_id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-3 max-w-[200px]">
                                  <p className="font-extrabold text-slate-900 truncate" title={p.project_title}>
                                    {p.project_title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {p.team_name}
                                  </p>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-mono text-[11px] font-bold text-[#004182] bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">
                                    {p.registration_id}
                                  </span>
                                </td>
                                <td className="py-3 px-3 max-w-[180px]">
                                  <p className="font-bold text-slate-800 text-[11px] truncate" title={p.domain_title || ''}>
                                    {p.domain_title || '—'}
                                  </p>
                                  {p.domain_id && (
                                    <span className="font-mono text-[9px] text-slate-400">
                                      {p.domain_id}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {p.assignment_mode === 'ALL' ? (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                      <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                                      ALL
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                      <CheckSquare className="w-2.5 h-2.5 text-purple-600" />
                                      SELECTED
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isEvaluated ? (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      EVALUATED
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-[10px] text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      PENDING
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {isEvaluated && p.total_score !== null ? (
                                    <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {p.total_score}/100
                                    </span>
                                  ) : (
                                    <span className="font-mono text-slate-400 text-xs">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {p.submitted_at ? (
                                    <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                                      {new Date(p.submitted_at).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                Please select a jury member from the left to view and configure their domain assignments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPLETION MATRIX ───────────────────────────────────────── */}
      {activeTab === 'completion' && (
        <div className="space-y-6">
          {/* Summary Badges Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Projects
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Completed (M/N)
              </span>
              <span className="text-xl font-black text-emerald-800 mt-0.5 block">{stats.completed}</span>
            </div>
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-xl font-black text-amber-800 mt-0.5 block">{stats.inProgress}</span>
            </div>
            <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Not Evaluated
              </span>
              <span className="text-xl font-black text-rose-800 mt-0.5 block">{stats.notEvaluated}</span>
            </div>
            <div className="bg-slate-100/60 p-3.5 rounded-2xl border border-slate-300 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Unassigned
              </span>
              <span className="text-xl font-black text-slate-700 mt-0.5 block">{stats.unassigned}</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={completionSearch}
                onChange={(e) => setCompletionSearch(e.target.value)}
                placeholder="Search by project title, team name, or registration ID..."
                className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
              />
              {completionSearch && (
                <button
                  type="button"
                  onClick={() => setCompletionSearch('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={completionStatusFilter}
                onChange={(e) => setCompletionStatusFilter(e.target.value)}
                className="p-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-bold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NOT_EVALUATED">Not Evaluated</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>

              <select
                value={completionDomainFilter}
                onChange={(e) => setCompletionDomainFilter(e.target.value)}
                className="p-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-bold focus:outline-none"
              >
                <option value="ALL">All Domains</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Completion Table Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Project &amp; Team</th>
                    <th className="py-3 px-4">Canonical Domain</th>
                    <th className="py-3 px-4">Assigned Juries</th>
                    <th className="py-3 px-4">Submitted Juries</th>
                    <th className="py-3 px-4 text-center">Completion (M/N)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompletionRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No projects found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCompletionRows.map((row) => {
                      const ratio = row.assigned_count > 0 ? (row.submitted_count / row.assigned_count) * 100 : 0;
                      return (
                        <tr key={row.registration_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 max-w-[260px]">
                            <p className="font-extrabold text-slate-900 truncate">
                              {row.project_title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-[#004182]">
                                {row.registration_id}
                              </span>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] text-slate-500 truncate">{row.team_name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block text-xs">
                              {row.domain_title || row.category}
                            </span>
                            {row.domain_id && (
                              <span className="font-mono text-[10px] text-slate-400">
                                {row.domain_id}
                              </span>
                            )}
                          </td>

                          {/* Assigned Juries */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {row.assigned_juries.length === 0 ? (
                                <span className="text-slate-400 text-[11px] italic">None</span>
                              ) : (
                                row.assigned_juries.map((j) => (
                                  <span
                                    key={j.user_id}
                                    className="bg-blue-50 text-[#004182] font-medium text-[10px] px-2 py-0.5 rounded-md"
                                    title={j.email}
                                  >
                                    {j.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Submitted Juries */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {row.submitted_juries.length === 0 ? (
                                <span className="text-slate-400 text-[11px] italic">None yet</span>
                              ) : (
                                row.submitted_juries.map((sj) => (
                                  <span
                                    key={sj.judge_id}
                                    className="bg-emerald-50 text-emerald-800 font-medium text-[10px] px-2 py-0.5 rounded-md border border-emerald-100"
                                    title={`${sj.judge_email} — Score: ${sj.total_score}`}
                                  >
                                    {sj.judge_name} ({sj.total_score})
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Completion Ratio M/N with Progress Bar */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono font-extrabold text-xs text-slate-800">
                                {row.submitted_count} / {row.assigned_count}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    row.status === 'COMPLETED'
                                      ? 'bg-emerald-500'
                                      : row.status === 'IN_PROGRESS'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${Math.min(ratio, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 text-center">
                            {row.status === 'COMPLETED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                COMPLETED
                              </span>
                            )}
                            {row.status === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3 text-amber-600" />
                                IN PROGRESS
                              </span>
                            )}
                            {row.status === 'NOT_EVALUATED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                NOT EVALUATED
                              </span>
                            )}
                            {row.status === 'UNASSIGNED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                                UNASSIGNED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: CREATE JURY ────────────────────────────────────────────── */}
      <Modal
        isOpen={createJuryModalOpen}
        onClose={() => setCreateJuryModalOpen(false)}
        title="Create Jury Account"
      >
        <form onSubmit={handleCreateJurySubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Securely creates an authenticated jury account using the Edge Function service boundary.
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={createJuryForm.name}
              onChange={(e) => setCreateJuryForm({ ...createJuryForm, name: e.target.value })}
              placeholder="e.g. Dr. Ramesh Kumar"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              value={createJuryForm.email}
              onChange={(e) => setCreateJuryForm({ ...createJuryForm, email: e.target.value })}
              placeholder="e.g. ramesh.kumar@example.com"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Department / Institution *</label>
            <input
              type="text"
              required
              value={createJuryForm.department}
              onChange={(e) => setCreateJuryForm({ ...createJuryForm, department: e.target.value })}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Temporary Password (Optional)
            </label>
            <input
              type="text"
              value={createJuryForm.temporaryPassword}
              onChange={(e) => setCreateJuryForm({ ...createJuryForm, temporaryPassword: e.target.value })}
              placeholder="Leave blank to auto-generate a secure random password"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="juryIsActiveCheck"
              checked={createJuryForm.isActive}
              onChange={(e) => setCreateJuryForm({ ...createJuryForm, isActive: e.target.checked })}
              className="rounded text-[#004182] focus:ring-[#004182] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="juryIsActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
              Active account (eligible for domain assignment and evaluations)
            </label>
          </div>

          {createdCredentials && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-emerald-800">Account Credentials Created:</p>
              <p className="text-slate-700">
                Email: <span className="font-mono font-bold">{createdCredentials.email}</span>
              </p>
              <p className="text-slate-700">
                Password: <span className="font-mono font-bold">{createdCredentials.password}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setCreateJuryModalOpen(false);
                setCreatedCredentials(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={creatingJury}
              className="inline-flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {creatingJury && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {creatingJury ? 'Creating…' : 'Create Jury Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: EDIT JURY PROFILE ──────────────────────────────────────── */}
      <Modal
        isOpen={editJuryModalOpen}
        onClose={() => setEditJuryModalOpen(false)}
        title="Edit Jury Profile"
      >
        {juryToEdit && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={juryToEdit.name}
                onChange={(e) => setJuryToEdit({ ...juryToEdit, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Department</label>
              <input
                type="text"
                value={juryToEdit.department}
                onChange={(e) => setJuryToEdit({ ...juryToEdit, department: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editJuryActiveCheck"
                checked={juryToEdit.is_active}
                onChange={(e) => setJuryToEdit({ ...juryToEdit, is_active: e.target.checked })}
                className="rounded text-[#004182] focus:ring-[#004182] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="editJuryActiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                Is Active (Soft Deactivate instead of hard delete)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditJuryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJuryEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 3: ASSIGN DOMAIN ─────────────────────────────────────────── */}
      <Modal
        isOpen={assignDomainModalOpen}
        onClose={() => setAssignDomainModalOpen(false)}
        title={`Assign Domain to ${selectedJury?.name || 'Jury'}`}
      >
        <form onSubmit={handleAssignDomainSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Target Domain *</label>
            <select
              required
              value={assignDomainForm.domain_id}
              onChange={(e) => setAssignDomainForm({ ...assignDomainForm, domain_id: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182] bg-white font-bold"
            >
              <option value="">-- Choose Canonical Domain --</option>
              {domains.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.title} ({dom.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Assignment Mode *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between ${
                  assignDomainForm.assignment_mode === 'ALL'
                    ? 'border-[#004182] bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="assignMode"
                    value="ALL"
                    checked={assignDomainForm.assignment_mode === 'ALL'}
                    onChange={() => setAssignDomainForm({ ...assignDomainForm, assignment_mode: 'ALL' })}
                    className="text-[#004182]"
                  />
                  <span className="text-xs font-bold text-slate-900">ALL Mode</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Evaluates all current and future projects in this canonical domain automatically.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between ${
                  assignDomainForm.assignment_mode === 'SELECTED'
                    ? 'border-purple-600 bg-purple-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="assignMode"
                    value="SELECTED"
                    checked={assignDomainForm.assignment_mode === 'SELECTED'}
                    onChange={() => setAssignDomainForm({ ...assignDomainForm, assignment_mode: 'SELECTED' })}
                    className="text-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-900">SELECTED Mode</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only explicitly selected projects are assigned to this jury member.
                </p>
              </label>
            </div>
          </div>

          {/* If SELECTED mode: Show project selector */}
          {assignDomainForm.assignment_mode === 'SELECTED' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Select Projects to Assign ({assignDomainForm.selected_reg_ids.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const allIds = availableProjectsForDomain.map((p) => p.registration_id);
                    setAssignDomainForm({ ...assignDomainForm, selected_reg_ids: allIds });
                  }}
                  className="text-[11px] font-bold text-[#004182] hover:underline"
                >
                  Select All
                </button>
              </div>

              {availableProjectsForDomain.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center italic bg-slate-50 rounded-xl">
                  {assignDomainForm.domain_id
                    ? 'No matching projects found registered under this domain.'
                    : 'Please select a domain above to view projects.'}
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                  {availableProjectsForDomain.map((p) => {
                    const isChecked = assignDomainForm.selected_reg_ids.includes(p.registration_id);
                    return (
                      <div
                        key={p.registration_id}
                        onClick={() => {
                          const next = isChecked
                            ? assignDomainForm.selected_reg_ids.filter((id) => id !== p.registration_id)
                            : [...assignDomainForm.selected_reg_ids, p.registration_id];
                          setAssignDomainForm({ ...assignDomainForm, selected_reg_ids: next });
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#004182] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-extrabold text-slate-900 block truncate">
                            {p.project_title || p.projects?.title}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {p.registration_id} • {p.team_name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignDomainModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigningDomain}
              className="inline-flex items-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {assigningDomain && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 4: MANAGE SELECTED PROJECTS ───────────────────────────────── */}
      <Modal
        isOpen={manageProjectsModalOpen}
        onClose={() => setManageProjectsModalOpen(false)}
        title={`Curated Projects for ${activeAssignmentForProjects?.domain_title || 'Domain'}`}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Currently Assigned Projects:</h4>
            {loadingSelectedProjects ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading projects…</div>
            ) : selectedAssignmentProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No projects explicitly assigned yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                {selectedAssignmentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{p.project_title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.registration_id} • {p.team_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectAssignment(p.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded"
                      title="Remove from this jury's assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add more projects section */}
          {availableProjectsForActiveAssignment.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">Add More Projects from Domain:</label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                {availableProjectsForActiveAssignment.map((p) => {
                  const isChecked = additionalRegIdsToAdd.includes(p.registration_id);
                  return (
                    <div
                      key={p.registration_id}
                      onClick={() => {
                        const next = isChecked
                          ? additionalRegIdsToAdd.filter((id) => id !== p.registration_id)
                          : [...additionalRegIdsToAdd, p.registration_id];
                        setAdditionalRegIdsToAdd(next);
                      }}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#004182] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">
                          {p.project_title || p.projects?.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {p.registration_id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {additionalRegIdsToAdd.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAdditionalProjects}
                  disabled={savingProjects}
                  className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {savingProjects ? 'Adding…' : `Add ${additionalRegIdsToAdd.length} Projects to Assignment`}
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManageProjectsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
