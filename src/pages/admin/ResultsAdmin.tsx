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
  Filter,
  Layers,
  Users,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ProjectResult, ResultsStats } from '../../types';
import { ResultsService } from '../../services/resultsService';
import { PROJECT_CATEGORIES } from '../../data/eventData';
import { Modal } from '../../components/ui/Modal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';

export const ResultsAdmin: React.FC = () => {
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [projects, setProjects] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Complete' | 'In Progress' | 'Not Evaluated'>('ALL');
  const [sortBy, setSortBy] = useState<'average' | 'evals' | 'team'>('average');

  // Details Modal State
  const [selectedProject, setSelectedProject] = useState<ProjectResult | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await ResultsService.getProjectResults();
      setProjects(results);
    } catch (err) {
      console.error('[ResultsAdmin] Failed to load results:', err);
      addToast('error', 'Load Failed', 'Could not load project results.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary statistics
  const stats = useMemo<ResultsStats>(() => {
    return ResultsService.getResultStats(projects);
  }, [projects]);

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
        if (sortBy === 'average') {
          return b.averageScore - a.averageScore;
        }
        if (sortBy === 'evals') {
          return b.completedJudges - a.completedJudges;
        }
        return a.teamName.localeCompare(b.teamName);
      });
  }, [projects, searchTerm, categoryFilter, statusFilter, sortBy]);

  const handleOpenDetails = (proj: ProjectResult) => {
    setSelectedProject(proj);
    setDetailsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
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
            Aggregate project evaluations, dynamic average scores, and judge evaluation breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Results
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Projects</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalProjects}</p>
          <p className="text-[11px] text-slate-500 font-medium">Registered teams</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Fully Evaluated</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.fullyEvaluated}</p>
          <p className="text-[11px] text-emerald-600 font-medium">3/3 judge evaluations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">In Progress</p>
          <p className="text-2xl font-extrabold text-amber-700">{stats.inProgress}</p>
          <p className="text-[11px] text-amber-600 font-medium">1–2 judge evaluations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#004182]">Highest Average</p>
          <p className="text-2xl font-extrabold text-[#004182]">
            {stats.highestScore > 0 ? stats.highestScore.toFixed(2) : '--'}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Top leaderboard score</p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
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
              <option value="average">Highest Average Score</option>
              <option value="evals">Most Evaluations</option>
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
            {(['ALL', 'Complete', 'In Progress', 'Not Evaluated'] as const).map((st) => (
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

      {/* Results Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto mb-2" />
          Loading project results...
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
            {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try clearing your filters or search keywords.'
              : 'Evaluations submitted by judges will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedProjects.map((proj, idx) => {
            const hasEvaluations = proj.completedJudges > 0;
            return (
              <div
                key={proj.registrationId}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Rank, Team & Project */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      idx === 0 && proj.averageScore > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : idx === 1 && proj.averageScore > 0
                        ? 'bg-slate-200 text-slate-800'
                        : idx === 2 && proj.averageScore > 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">
                        {proj.registrationId}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {proj.category}
                      </span>
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

                {/* Right: Scores, Status & View Details Button */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-center md:text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Judges</span>
                    <p className="text-xs font-extrabold text-slate-700">
                      {proj.completedJudges} / {proj.expectedJudges}
                    </p>
                  </div>

                  <div className="text-center md:text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Average Score</span>
                    <div className="flex items-baseline justify-center md:justify-end gap-1">
                      <span className="text-xl font-extrabold text-[#004182]">
                        {hasEvaluations ? proj.averageScore.toFixed(2) : '--'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-center md:text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        proj.status === 'Complete'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : proj.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {proj.status === 'Complete' && <CheckCircle2 className="w-3 h-3" />}
                      {proj.status === 'In Progress' && <Clock className="w-3 h-3" />}
                      {proj.status}
                    </span>
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

      {/* DETAILED PROJECT BREAKDOWN MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedProject ? `Evaluation Details: ${selectedProject.teamName}` : 'Details'}
      >
        {selectedProject && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Project Summary Banner */}
            <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-100 p-4 rounded-2xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-extrabold bg-[#004182] text-white px-2 py-0.5 rounded-md">
                  {selectedProject.registrationId}
                </span>
                <span className="text-xs font-bold bg-white text-[#004182] border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {selectedProject.category}
                </span>
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
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-2xl text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Judges Evaluated</p>
                <p className="text-xl font-extrabold mt-0.5">{selectedProject.completedJudges} / {selectedProject.expectedJudges}</p>
              </div>
              <div className="border-x border-slate-800">
                <p className="text-[10px] uppercase font-bold text-blue-300">Average Score</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">
                  {selectedProject.completedJudges > 0 ? selectedProject.averageScore.toFixed(2) : '--'}
                  <span className="text-xs text-slate-400 font-bold"> / 100</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                <p className="text-sm font-extrabold mt-1 text-emerald-400">{selectedProject.status}</p>
              </div>
            </div>

            {/* Individual Judge Evaluations List */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Individual Judge Evaluations ({selectedProject.evaluations.length})
              </h4>

              {selectedProject.evaluations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No evaluations submitted for this project yet.
                </div>
              ) : (
                selectedProject.evaluations.map((ev, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
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

                      <div className="text-right">
                        <span className="text-base font-extrabold text-[#004182]">{ev.totalScore}</span>
                        <span className="text-xs text-slate-400 font-bold"> / 100</span>
                      </div>
                    </div>

                    {/* Criteria Breakdown */}
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Innovation</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{ev.scores.innovation ?? 0}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Technical</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{ev.scores.technical ?? 0}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Relevance</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{ev.scores.relevance ?? 0}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Presentation</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{ev.scores.presentation ?? 0}/20</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Impact</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{ev.scores.impact ?? 0}/20</span>
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
    </div>
  );
};
