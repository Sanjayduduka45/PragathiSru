import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Building,
  Save,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { Project, Evaluation, EvaluationCriterion } from '../../types';
import { EvaluationService, DEFAULT_EVALUATION_CRITERIA } from '../../services/evaluationService';
import { EvaluationForm } from './EvaluationForm';
import { Modal } from '../ui/Modal';

interface ProjectEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  currentJudge: {
    name: string;
    email: string;
  };
  onEvaluationSubmitted?: (evalRecord: Evaluation) => void;
}

export const ProjectEvaluationModal: React.FC<ProjectEvaluationModalProps> = ({
  isOpen,
  onClose,
  project,
  currentJudge,
  onEvaluationSubmitted,
}) => {
  const [existingEval, setExistingEval] = useState<Evaluation | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(DEFAULT_EVALUATION_CRITERIA);

  // Check if current judge has already evaluated this project
  useEffect(() => {
    let isMounted = true;
    if (isOpen && project && (currentJudge.userId || currentJudge.id || currentJudge.email)) {
      setCheckingExisting(true);

      const judgeIdentifier = currentJudge.userId || currentJudge.id || currentJudge.email;
      Promise.all([
        EvaluationService.getEvaluationForJudgeAndProject(
          judgeIdentifier,
          project.registrationId
        ),
        EvaluationService.getCriteria(),
      ])
        .then(([foundEval, loadedCriteria]) => {
          if (!isMounted) return;
          setExistingEval(foundEval);
          if (loadedCriteria && loadedCriteria.length > 0) {
            setCriteria(loadedCriteria);
          }
        })
        .catch((err) => {
          console.warn('[ProjectEvaluationModal] Error checking evaluation:', err);
        })
        .finally(() => {
          if (isMounted) setCheckingExisting(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, project, currentJudge.userId, currentJudge.id, currentJudge.email]);

  const handleFormSuccess = (newEval: Evaluation) => {
    setExistingEval(newEval);
    onEvaluationSubmitted?.(newEval);
  };

  if (!isOpen || !project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evaluation: ${project.teamName}`}
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Project Header Info */}
        <div className="bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-100 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-mono text-xs font-extrabold bg-[#004182] text-white px-2 py-0.5 rounded-md">
              {project.registrationId}
            </span>
            <span className="text-xs font-bold bg-white text-[#004182] border border-blue-200 px-2.5 py-0.5 rounded-full">
              {project.category}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {project.title}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Team: <strong className="text-slate-900">{project.teamName}</strong> &bull; {project.institutionName || 'SR University'}
            </p>
          </div>

          {/* Problem Statement / Innovation Details */}
          {(project.problemStatement || project.proposedSolution || project.innovation) && (
            <div className="pt-2 border-t border-blue-100/80 text-xs text-slate-700 space-y-1 bg-white/70 p-2.5 rounded-xl">
              {project.problemStatement && (
                <p>
                  <strong className="text-slate-900">Problem:</strong> {project.problemStatement}
                </p>
              )}
              {project.proposedSolution && (
                <p>
                  <strong className="text-slate-900">Solution:</strong> {project.proposedSolution}
                </p>
              )}
              {project.innovation && (
                <p>
                  <strong className="text-[#004182]">Innovation:</strong> {project.innovation}
                </p>
              )}
            </div>
          )}

          {/* Team Members */}
          {project.members && project.members.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="font-bold text-slate-500">Members:</span>
              {project.members.map((m, idx) => (
                <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-700">
                  {m.name} {m.role === 'Leader' && '(Leader)'}
                </span>
              ))}
            </div>
          )}
        </div>

        {checkingExisting ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto mb-2" />
            Loading project evaluation status...
          </div>
        ) : existingEval ? (
          /* =========================================================================
             ALREADY EVALUATED VIEW (Read-Only Scorecard Review)
             ========================================================================= */
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  You have already evaluated this project
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  Your submitted scorecard is saved. Individual criteria scores are shown below.
                </p>
              </div>
            </div>

            <EvaluationForm
              registrationId={project.registrationId}
              projectTitle={project.title}
              teamName={project.teamName}
              category={project.category}
              judgeId={currentJudge.userId || currentJudge.id}
              judgeName={currentJudge.name}
              judgeEmail={currentJudge.email}
              criteria={criteria}
              initialScores={existingEval.scores}
              initialComments={existingEval.comments}
              isReadOnly={true}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             NEW EVALUATION FORM
             ========================================================================= */
          <EvaluationForm
            registrationId={project.registrationId}
            projectTitle={project.title}
            teamName={project.teamName}
            category={project.category}
            judgeId={currentJudge.userId || currentJudge.id}
            judgeName={currentJudge.name}
            judgeEmail={currentJudge.email}
            criteria={criteria}
            isReadOnly={false}
            onSuccess={handleFormSuccess}
            onCancel={onClose}
          />
        )}
      </div>
    </Modal>
  );
};
