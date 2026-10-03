import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  Trash2,
  AlertTriangle,
  Info,
  Medal,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { ProjectResult, AwardWinnerItem, ThemeSummaryItem, ResultsStats } from '../../types';
import { api } from '../../services/api';
import { PROJECT_CATEGORIES } from '../../data/eventData';
import { Modal } from '../../components/ui/Modal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';

export const ResultsAdmin: React.FC = () => {
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [projects, setProjects] = useState<ProjectResult[]>([]);
  const [themes, setThemes] = useState<ThemeSummaryItem[]>([]);
  const [awards, setAwards] = useState<AwardWinnerItem[]>([]);
  const [stats, setStats] = useState<ResultsStats>({
    totalProjects: 0,
    evaluatedProjects: 0,
    notEvaluatedProjects: 0,
    totalEvaluations: 0,
    highestRawScore: 0,
    highestMeritScore: 0,
  });

  const [notice, setNotice] = useState<string>(
    'Provisional Results — calculated from currently submitted evaluations. Final eligibility will use assigned-jury completion after Jury Assignment is configured.'
  );

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // View tabs: 'overall' | 'themes' | 'awards'
  const [viewMode, setViewMode] = useState<'overall' | 'themes' | 'awards'>('overall');

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Provisional' | 'Not Evaluated'>('ALL');
  const [sortBy, setSortBy] = useState<'merit' | 'raw' | 'evals' | 'team'>('merit');

  // Details Modal State
  const [selectedProject, setSelectedProject] = useState<ProjectResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Reset Evaluation Modal State
  const [evalToDelete, setEvalToDelete] = useState<{
    id: string;
    judgeName: string;
    judgeEmail: string;
    totalScore: number;
    projectTitle: string;
    registrationId: string;
  } | null>(null);
  const [resetReason, setResetReason] = useState('');
  const [deletingEval, setDeletingEval] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.results.get();

      if (res && res.success) {
        if (res.notice) setNotice(res.notice);

        // Map server stats
        setStats({
          totalProjects: res.stats.total_projects,
          evaluatedProjects: res.stats.evaluated_projects,
          notEvaluatedProjects: res.stats.not_evaluated_projects,
          totalEvaluations: res.stats.total_evaluations,
          highestRawScore: res.stats.highest_raw_score,
          highestMeritScore: res.stats.highest_merit_score,
          // Backwards compatibility
          fullyEvaluated: res.stats.evaluated_projects,
          inProgress: 0,
          notEvaluated: res.stats.not_evaluated_projects,
          highestScore: res.stats.highest_merit_score,
        });

        // Map theme summaries
        setThemes(res.themes || []);

        // Map awards
        setAwards(res.awards || []);

        // Map project results
        const mappedProjects: ProjectResult[] = (res.projects || []).map((p: any) => ({
          registrationId: p.registration_id,
          teamName: p.team_name,
          projectTitle: p.project_title,
          category: p.category,
          institutionName: p.institution_name,
          leaderName: p.leader_name,
          members: p.members || [],
          problemStatement: p.problem_statement,
          proposedSolution: p.proposed_solution,
          innovation: p.innovation,
          evaluationsCount: p.evaluations_count,
          rawAverage: p.raw_average,
          criteriaAverages: p.criteria_averages || {},
          themeMin: p.theme_min,
          themeMax: p.theme_max,
          normalizedScore: p.normalized_score,
          meritScore: p.merit_score,
          overallRank: p.overall_rank,
          themeRank: p.theme_rank,
          award: p.award,
          awardType: p.award_type,
          status: p.status,
          isEligible: p.is_eligible,
          tieStatus: p.tie_status,
          evaluations: (p.evaluations || []).map((ev: any) => ({
            id: ev.id,
            judgeId: ev.judge_id,
            judgeName: ev.judge_name,
            judgeEmail: ev.judge_email,
            totalScore: ev.total_score,
            scores: ev.scores || {},
            comments: ev.comments,
            submittedAt: ev.submitted_at,
          })),
          // Aliases
          completedJudges: p.evaluations_count,
          averageScore: p.raw_average,
          expectedJudges: p.evaluations_count,
        }));

        setProjects(mappedProjects);

        // If details modal is currently open, refresh the selected project
        if (selectedProject) {
          const updatedSelected = mappedProjects.find(
            (p) => p.registrationId === selectedProject.registrationId
          );
          if (updatedSelected) {
            setSelectedProject(updatedSelected);
          }
        }
      }
    } catch (err: any) {
      console.error('[ResultsAdmin] Failed to load results:', err);
      const msg = err.message || '';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setAuthError('Unauthorized: Please log in with an authorized Admin account.');
      } else if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
        setAuthError('Access Denied: Your account role does not have permission to view confidential event results.');
      } else {
        setAuthError('Unable to connect to the Admin Results engine. Verify backend server is running.');
      }
      addToast('error', 'Results Load Error', err.message || 'Could not load project results.');
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedProject]);

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted Projects
  const processedProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          p.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.leaderName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === 'ALL' ||
          p.category.toLowerCase() === categoryFilter.toLowerCase();

        const matchesStatus =
          statusFilter === 'ALL' || p.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'merit') {
          return (b.meritScore ?? -1) - (a.meritScore ?? -1);
        }
        if (sortBy === 'raw') {
          return b.rawAverage - a.rawAverage;
        }
        if (sortBy === 'evals') {
          return b.evaluationsCount - a.evaluationsCount;
        }
        return a.teamName.localeCompare(b.teamName);
      });
  }, [projects, searchTerm, categoryFilter, statusFilter, sortBy]);

  const handleOpenDetails = (proj: ProjectResult) => {
    setSelectedProject(proj);
    setDetailsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!evalToDelete) return;
    if (!resetReason.trim()) {
      addToast('error', 'Reset Reason Required', 'Please provide an administrative reason for resetting this evaluation.');
      return;
    }
    setDeletingEval(true);
    try {
      const res = await api.results.deleteEvaluation(evalToDelete.id, resetReason.trim());
      if (res && res.success) {
        addToast('success', 'Evaluation Reset', 'Evaluation was atomically reset. The jury member can now re-evaluate this project.');
        setEvalToDelete(null);
        setResetReason('');
        await loadData();
      } else {
        addToast('error', 'Reset Failed', res.message || 'Could not reset evaluation.');
      }
    } catch (err: any) {
      console.error('[ResultsAdmin] Reset evaluation error:', err);
      addToast('error', 'Reset Failed', err.message || 'Error occurred while resetting evaluation.');
    } finally {
      setDeletingEval(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004182] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Results & Evaluation Leaderboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative server-side evaluation engine: Dynamic jury averages, Min-Max theme normalization, and 70/30 Merit ranking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Results
          </button>
        </div>
      </div>

      {/* PROVISIONAL NOTICE BANNER */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
              PROVISIONAL RESULTS
            </span>
            <span className="text-xs font-bold text-amber-900">
              Active Evaluation Phase
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed pt-0.5">
            {notice}
          </p>
        </div>
      </div>

      {/* Security Auth Error State */}
      {authError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3 text-rose-800">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-rose-900">Access Restricted</p>
            <p className="text-xs leading-relaxed">{authError}</p>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Projects</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalProjects}</p>
          <p className="text-[11px] text-slate-500 font-medium">Registered teams</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Evaluated Projects</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.evaluatedProjects ?? 0}</p>
          <p className="text-[11px] text-emerald-600 font-medium">{stats.totalEvaluations ?? 0} jury evaluations recorded</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Not Evaluated</p>
          <p className="text-2xl font-extrabold text-slate-700">{stats.notEvaluatedProjects ?? 0}</p>
          <p className="text-[11px] text-slate-400 font-medium">Awaiting judging</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182]">Highest Merit Score</p>
          <p className="text-2xl font-extrabold text-[#004182]">
            {(stats.highestMeritScore ?? 0) > 0 ? (stats.highestMeritScore ?? 0).toFixed(2) : '--'}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">70% Norm + 30% Raw</p>
        </div>
      </div>

      {/* VIEW TABS: Overall Merit vs Theme Standings vs Prize Winners */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setViewMode('overall')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'overall'
              ? 'bg-white text-[#004182] shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Overall Merit Leaderboard
        </button>

        <button
          type="button"
          onClick={() => setViewMode('themes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'themes'
              ? 'bg-white text-[#004182] shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Theme Standings
        </button>

        <button
          type="button"
          onClick={() => setViewMode('awards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'awards'
              ? 'bg-white text-amber-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          Provisional Prize Standings
        </button>
      </div>

      {/* VIEW 1: OVERALL MERIT LEADERBOARD */}
      {viewMode === 'overall' && (
        <div className="space-y-4">
          {/* Filter & Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search team, project title, or registration ID..."
                  className="w-full pl-9.5 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-[#004182]"
                >
                  <option value="merit">Overall Merit Score (70/30)</option>
                  <option value="raw">Raw Average Score</option>
                  <option value="evals">Evaluations Count</option>
                  <option value="team">Team Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Categories and Status tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === 'ALL'
                      ? 'bg-[#004182] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Domains
                </button>
                {PROJECT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.title)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === cat.title
                        ? 'bg-[#004182] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(['ALL', 'Provisional', 'Not Evaluated'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto mb-2" />
              Calculating authoritative results...
            </div>
          ) : processedProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No project results match your criteria'
                  : 'No results available yet.'}
              </p>
              <p className="text-xs text-slate-400">
                Evaluations submitted by juries will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedProjects.map((proj) => {
                const hasEvaluations = proj.evaluationsCount > 0;
                return (
                  <div
                    key={proj.registrationId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    {/* Left: Rank, Team & Project */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-extrabold text-xs shrink-0 ${
                          proj.overallRank === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : proj.overallRank === 2
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : proj.overallRank === 3
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 font-bold leading-none">RANK</span>
                        <span className="text-sm font-black leading-none mt-0.5">
                          {proj.overallRank ? `#${proj.overallRank}` : '—'}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">
                            {proj.registrationId}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {proj.category}
                          </span>
                          {proj.award && (
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                proj.awardType === 'overall'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}
                            >
                              <Award className="w-3 h-3 text-amber-600" />
                              {proj.award}
                            </span>
                          )}
                          {proj.tieStatus === 'committee_review_required' && (
                            <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              Tie — Result Committee Review Required
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 truncate">
                          {proj.teamName}
                        </h4>

                        <p className="text-xs font-semibold text-slate-600 truncate max-w-xl">
                          {proj.projectTitle}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          Leader: <span className="font-medium text-slate-700">{proj.leaderName}</span> &bull; {proj.institutionName}
                        </p>
                      </div>
                    </div>

                    {/* Right: Scores & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap">
                      <div className="text-center md:text-right space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluations</span>
                        <p className="text-xs font-extrabold text-slate-800">
                          {proj.evaluationsCount} received
                        </p>
                      </div>

                      <div className="text-center md:text-right space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Raw Avg</span>
                        <div className="flex items-baseline justify-center md:justify-end gap-0.5">
                          <span className="text-sm font-extrabold text-slate-800 font-mono">
                            {hasEvaluations ? proj.rawAverage.toFixed(2) : '--'}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </div>

                      <div className="text-center md:text-right space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Normalized</span>
                        <div className="flex items-baseline justify-center md:justify-end gap-0.5">
                          <span className="text-sm font-extrabold text-slate-800 font-mono">
                            {proj.normalizedScore !== null && proj.normalizedScore !== undefined
                              ? proj.normalizedScore.toFixed(2)
                              : '--'}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </div>

                      <div className="text-center md:text-right space-y-0.5 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#004182] uppercase">Overall Merit</span>
                        <div className="flex items-baseline justify-center md:justify-end gap-0.5">
                          <span className="text-base font-black text-[#004182] font-mono">
                            {proj.meritScore !== null && proj.meritScore !== undefined
                              ? proj.meritScore.toFixed(2)
                              : '--'}
                          </span>
                          <span className="text-[10px] text-blue-400 font-bold">/100</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDetails(proj)}
                        className="inline-flex items-center gap-1 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: THEME STANDINGS */}
      {viewMode === 'themes' && (
        <div className="space-y-6">
          {themes.map((t) => {
            const themeProjects = projects.filter((p) => p.category === t.category && p.isEligible);
            return (
              <div key={t.category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Theme Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{t.category}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.evaluated_projects} evaluated of {t.total_projects} registered projects
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="bg-white border border-slate-200 px-3 py-1 rounded-xl">
                      <span className="text-slate-400 font-bold">Theme Min:</span>{' '}
                      <span className="font-mono font-extrabold text-slate-700">
                        {t.theme_min !== null && t.theme_min !== undefined ? t.theme_min.toFixed(2) : '--'}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 px-3 py-1 rounded-xl">
                      <span className="text-slate-400 font-bold">Theme Max:</span>{' '}
                      <span className="font-mono font-extrabold text-slate-700">
                        {t.theme_max !== null && t.theme_max !== undefined ? t.theme_max.toFixed(2) : '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Projects Table */}
                {themeProjects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No evaluations submitted in this theme yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {themeProjects.map((p) => (
                      <div key={p.registrationId} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-black text-xs flex items-center justify-center">
                              #{p.themeRank || '—'}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#004182]">{p.registrationId}</span>
                            <span className="font-extrabold text-sm text-slate-900">{p.teamName}</span>
                            {p.award && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                                {p.award}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 pl-8">{p.projectTitle}</p>
                        </div>

                        <div className="flex items-center gap-4 pl-8 sm:pl-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold">Raw Avg (Theme Rank)</span>
                            <span className="font-mono font-extrabold text-slate-900 text-sm">
                              {p.rawAverage.toFixed(2)}/100
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold">Overall Merit</span>
                            <span className="font-mono font-extrabold text-[#004182] text-sm">
                              {p.meritScore ? p.meritScore.toFixed(2) : '--'}/100
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenDetails(p)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: PRIZE WINNERS PODIUM */}
      {viewMode === 'awards' && (
        <div className="space-y-6">
          {/* Overall Winners Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-slate-50 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Current Overall Standings</h3>
                <p className="text-xs text-slate-600">
                  Current standings based on the 70% Normalized + 30% Raw Overall Merit Score.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {['Overall First Prize', 'Overall Second Prize', 'Overall Third Prize'].map((awardTitle, idx) => {
                const winner = awards.find((a) => a.award_name === awardTitle);
                const isDisputed = winner?.is_disputed || winner?.tie_status === 'committee_review_required';
                return (
                  <div
                    key={awardTitle}
                    className={`p-5 rounded-2xl border space-y-2 shadow-2xs ${
                      isDisputed
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/50'
                        : idx === 0
                        ? 'border-amber-300 ring-2 ring-amber-300/40 bg-white'
                        : idx === 1
                        ? 'border-slate-300 bg-white'
                        : 'border-amber-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-amber-800">
                        {idx === 0
                          ? 'Current Overall Rank #1'
                          : idx === 1
                          ? 'Current Overall Rank #2'
                          : 'Current Overall Rank #3'}
                      </span>
                      {isDisputed ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
                      ) : (
                        <Medal className={`w-5 h-5 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`} />
                      )}
                    </div>

                    {winner ? (
                      <div className="space-y-1.5 pt-1">
                        {isDisputed ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" />
                              Tie — Result Committee Review Required
                            </span>
                            <p className="text-xs font-semibold text-slate-700 leading-snug">
                              {winner.project_title}
                            </p>
                            {winner.disputed_teams && winner.disputed_teams.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {winner.disputed_teams.map((dt) => (
                                  <span key={dt.registration_id} className="text-[10px] font-mono font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-amber-200">
                                    {dt.team_name} ({dt.registration_id})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-[10px] font-bold bg-blue-50 text-[#004182] px-2 py-0.5 rounded-full border border-blue-100">
                              {winner.registration_id}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">{winner.team_name}</h4>
                            <p className="text-xs text-slate-600 line-clamp-1">{winner.project_title}</p>
                            <p className="text-[11px] text-slate-400">{winner.category}</p>
                          </>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">Merit Score:</span>
                          <span className="font-mono font-black text-[#004182]">
                            {winner.merit_score ? winner.merit_score.toFixed(2) : '--'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic pt-2">Awaiting evaluations</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme Winners Section */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Current Theme Standings (Actual Raw Average)
            </h3>
            <p className="text-xs text-slate-500 -mt-2">
              Current overall top positions are excluded from provisional theme prize positions, following the one-prize-per-project rule.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((t) => (
                <div key={t.category} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{t.category}</h4>
                    <span className="text-[10px] font-bold text-slate-400">{t.evaluated_projects} evaluated</span>
                  </div>

                  <div className="space-y-2">
                    {/* Theme First */}
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      t.theme_first?.is_disputed
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-blue-50/50 border-blue-100'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={t.theme_first?.is_disputed ? 'text-amber-900 flex items-center gap-1' : 'text-blue-900'}>
                          {t.theme_first?.is_disputed && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          Current Theme Rank #1
                        </span>
                        <span className="font-mono text-[#004182]">
                          {t.theme_first?.raw_average ? `${t.theme_first.raw_average.toFixed(2)}/100` : '--'}
                        </span>
                      </div>
                      {t.theme_first ? (
                        t.theme_first.is_disputed ? (
                          <div className="space-y-1 pt-1">
                            <span className="inline-block text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                              Tie — Result Committee Review Required
                            </span>
                            <p className="text-[11px] text-slate-700 leading-snug">{t.theme_first.project_title}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{t.theme_first.team_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{t.theme_first.project_title}</p>
                          </div>
                        )
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No eligible winner yet</p>
                      )}
                    </div>

                    {/* Theme Second */}
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      t.theme_second?.is_disputed
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={t.theme_second?.is_disputed ? 'text-amber-900 flex items-center gap-1' : 'text-slate-700'}>
                          {t.theme_second?.is_disputed && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          Current Theme Rank #2
                        </span>
                        <span className="font-mono text-slate-700">
                          {t.theme_second?.raw_average ? `${t.theme_second.raw_average.toFixed(2)}/100` : '--'}
                        </span>
                      </div>
                      {t.theme_second ? (
                        t.theme_second.is_disputed ? (
                          <div className="space-y-1 pt-1">
                            <span className="inline-block text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                              Tie — Result Committee Review Required
                            </span>
                            <p className="text-[11px] text-slate-700 leading-snug">{t.theme_second.project_title}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{t.theme_second.team_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{t.theme_second.project_title}</p>
                          </div>
                        )
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No eligible winner yet</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PROJECT BREAKDOWN MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedProject ? `Evaluation Details: ${selectedProject.teamName}` : 'Details'}
      >
        {selectedProject && (
          <div className="space-y-5">
            {/* Project Summary Banner */}
            <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 p-4 rounded-2xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-extrabold bg-[#004182] text-white px-2 py-0.5 rounded-md">
                  {selectedProject.registrationId}
                </span>
                <span className="text-xs font-bold bg-white text-[#004182] border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {selectedProject.category}
                </span>
                {selectedProject.award && (
                  <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    {selectedProject.award === 'Overall First Prize'
                      ? 'Current Overall Rank #1'
                      : selectedProject.award === 'Overall Second Prize'
                      ? 'Current Overall Rank #2'
                      : selectedProject.award === 'Overall Third Prize'
                      ? 'Current Overall Rank #3'
                      : selectedProject.award}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedProject.projectTitle}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-bold">Institution:</span> {selectedProject.institutionName}
                </p>
              </div>

              {selectedProject.problemStatement && (
                <div className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-blue-100/60 mt-2 space-y-1">
                  <p className="font-bold text-slate-900 text-[11px] uppercase">Problem Statement:</p>
                  <p className="leading-relaxed">{selectedProject.problemStatement}</p>
                </div>
              )}

              {/* Members */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="font-bold text-slate-500">Members:</span>
                {selectedProject.members.map((m, i) => (
                  <span key={i} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 text-[11px] font-medium">
                    {m.name} {m.role === 'Leader' && <strong className="text-[#004182]">(Leader)</strong>}
                  </span>
                ))}
              </div>
            </div>

            {/* Scorecard Aggregate Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 text-white rounded-2xl text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Evaluations Received</p>
                <p className="text-xl font-extrabold mt-0.5 font-mono">{selectedProject.evaluationsCount}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Raw Average</p>
                <p className="text-xl font-extrabold mt-0.5 font-mono text-slate-100">
                  {selectedProject.evaluationsCount > 0 ? selectedProject.rawAverage.toFixed(2) : '--'}
                  <span className="text-xs text-slate-400 font-bold"> /100</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Normalized Score</p>
                <p className="text-xl font-extrabold mt-0.5 font-mono text-blue-300">
                  {selectedProject.normalizedScore !== null && selectedProject.normalizedScore !== undefined
                    ? selectedProject.normalizedScore.toFixed(2)
                    : '--'}
                  <span className="text-xs text-slate-400 font-bold"> /100</span>
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-1">
                <p className="text-[10px] uppercase font-extrabold text-amber-300">Overall Merit</p>
                <p className="text-2xl font-black mt-0.5 font-mono text-amber-400">
                  {selectedProject.meritScore !== null && selectedProject.meritScore !== undefined
                    ? selectedProject.meritScore.toFixed(2)
                    : '--'}
                  <span className="text-xs text-slate-400 font-bold"> /100</span>
                </p>
              </div>
            </div>

            {/* Individual Jury Evaluations List with Delete Option */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Individual Jury Evaluations ({selectedProject.evaluations.length})
              </h4>

              {selectedProject.evaluations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No evaluations submitted for this project yet.
                </div>
              ) : (
                selectedProject.evaluations.map((ev, index) => (
                  <div key={ev.id || index} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#004182] flex items-center justify-center font-bold text-xs">
                          J{index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{ev.judgeName}</p>
                          <p className="text-[10px] text-slate-400">{ev.judgeEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-[#004182]">{ev.totalScore}</span>
                          <span className="text-xs text-slate-400 font-bold"> / 100</span>
                        </div>

                        {ev.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetReason('');
                              setEvalToDelete({
                                id: ev.id!,
                                judgeName: ev.judgeName,
                                judgeEmail: ev.judgeEmail,
                                totalScore: ev.totalScore,
                                projectTitle: selectedProject.projectTitle,
                                registrationId: selectedProject.registrationId,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Reset this jury evaluation"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset Evaluation
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Official Criteria Breakdown with Standard Labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold block leading-snug">Innovation & Originality</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1 block font-mono">
                          {ev.scores.innovation ?? 0} / 20
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold block leading-snug">Technical / Conceptual</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1 block font-mono">
                          {ev.scores.technical ?? 0} / 20
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold block leading-snug">Working Model / Prototype</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1 block font-mono">
                          {ev.scores.implementation ?? ev.scores.relevance ?? 0} / 20
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold block leading-snug">Applicability & Impact</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1 block font-mono">
                          {ev.scores.impact ?? 0} / 20
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold block leading-snug">Presentation & Response</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1 block font-mono">
                          {ev.scores.presentation ?? 0} / 20
                        </span>
                      </div>
                    </div>

                    {ev.comments && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Feedback / Comments:</span>
                        <p className="italic mt-0.5 leading-relaxed">{ev.comments}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 text-right">
                      Submitted on {new Date(ev.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ATOMIC RESET EVALUATION MODAL */}
      <Modal
        isOpen={Boolean(evalToDelete)}
        onClose={() => {
          if (!deletingEval) {
            setEvalToDelete(null);
            setResetReason('');
          }
        }}
        title="Reset Jury Evaluation"
      >
        {evalToDelete && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-amber-950">
                  Are you sure you want to reset this jury evaluation?
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Only this Jury&apos;s evaluation will be reset. Project, domain assignment, and other Jury scores remain unchanged. This Jury will be able to evaluate this project again immediately.
                </p>
                <div className="text-[11px] text-amber-700 bg-amber-100/60 p-2 rounded-lg font-medium border border-amber-200/50">
                  <strong>Atomic Audit Guarantee:</strong> A complete snapshot of these scores and the provided reason will be safely archived to <code className="font-mono text-[10px] bg-amber-200/60 px-1 py-0.5 rounded">evaluation_reset_audit</code> before clearing.
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Project:</span>
                <span className="font-extrabold text-slate-900">{evalToDelete.projectTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Registration ID:</span>
                <span className="font-mono font-bold text-[#004182]">{evalToDelete.registrationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Jury:</span>
                <span className="font-medium text-slate-800">{evalToDelete.judgeName} ({evalToDelete.judgeEmail})</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-bold">Current Raw Score:</span>
                <span className="font-mono font-black text-[#004182]">{evalToDelete.totalScore} / 100</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Administrative Reset Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="e.g. Scored incorrect team by mistake, rubric recalculation requested, technical error during scoring, etc."
                rows={3}
                disabled={deletingEval}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#004182] focus:border-transparent bg-white text-slate-900 resize-none disabled:bg-slate-100"
                required
              />
              <p className="text-[11px] text-slate-400">
                A valid reason is required for compliance audit trails.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEvalToDelete(null);
                  setResetReason('');
                }}
                disabled={deletingEval}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingEval || !resetReason.trim()}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {deletingEval ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                {deletingEval ? 'Resetting…' : 'Confirm Reset Evaluation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
