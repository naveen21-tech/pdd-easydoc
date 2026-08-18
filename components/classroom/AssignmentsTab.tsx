'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Shield,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  groupId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  totalMarks: number;
  requiredSections: string[];
  minReferences: number;
  requiredKeywords: string[];
  minWordCount: number;
  autoReviewEnabled: boolean;
  createdAt: string;
  creator?: { id: string; name: string; email: string };
  submissionSummary?: {
    totalStudents: number;
    completedCount: number;
    pendingCount: number;
    lateCount: number;
    averageQualityScore: number;
  };
  mySubmission?: any | null;
}

interface AssignmentsTabProps {
  groupId: string;
  classroomName: string;
  isAdmin: boolean;
}

export default function AssignmentsTab({ groupId, classroomName, isAdmin }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for Faculty Overview
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'pending' | 'late' | 'low_score' | 'high_score'>('all');

  // Selected Assignment for Faculty Drill-Down
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Assignment Modal (Faculty)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createTotalMarks, setCreateTotalMarks] = useState(100);
  const [createMinReferences, setCreateMinReferences] = useState(3);
  const [createMinWordCount, setCreateMinWordCount] = useState(400);
  const [createKeywordsStr, setCreateKeywordsStr] = useState('deadlock, synchronization, throughput');
  const [createSectionsStr, setCreateSectionsStr] = useState(
    'Title Page, Introduction, Problem Statement, Objectives, Methodology, Results, Conclusion, References'
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Student Submit Modal
  const [submitModalAssignment, setSubmitModalAssignment] = useState<AssignmentItem | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestReviewResult, setLatestReviewResult] = useState<any | null>(null);

  // Student Review View Modal
  const [viewReviewModal, setViewReviewModal] = useState<any | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [groupId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        if (data.assignments && data.assignments.length > 0 && !selectedAssignmentId && isAdmin) {
          fetchAssignmentDetails(data.assignments[0].id, activeFilter);
        }
      }
    } catch (e) {
      console.error('Fetch assignments error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentDetails = async (assignmentId: string, filter: string) => {
    try {
      setLoadingDetails(true);
      setSelectedAssignmentId(assignmentId);
      const res = await fetch(`/api/groups/${groupId}/assignments/${assignmentId}?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAssignmentDetails(data);
      }
    } catch (e) {
      console.error('Fetch assignment details error:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError('Please enter an assignment title');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const requiredSections = createSectionsStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const requiredKeywords = createKeywordsStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch(`/api/groups/${groupId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim() || undefined,
          dueDate: createDueDate || undefined,
          totalMarks: createTotalMarks,
          minReferences: createMinReferences,
          minWordCount: createMinWordCount,
          requiredSections,
          requiredKeywords,
          autoReviewEnabled: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create assignment');
        return;
      }

      setShowCreateModal(false);
      setCreateTitle('');
      setCreateDescription('');
      fetchAssignments();
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalAssignment) return;
    if (!submitFile) {
      setSubmitError('Please select a document file to submit');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.append('title', submitFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('file', submitFile);

      const res = await fetch(
        `/api/groups/${groupId}/assignments/${submitModalAssignment.id}/submit`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit assignment');
        return;
      }

      setLatestReviewResult(data.review);
      fetchAssignments();
    } catch (err: any) {
      setSubmitError(err?.message || 'Error submitting assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-slate-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-dark-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                Classroom Assignments & Auto-Review
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {isAdmin
                ? 'Create assignments, configure section requirements, and monitor automated submission reviews.'
                : 'Submit coursework documents and receive immediate automated structural and completeness reviews.'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ASSIGNMENTS LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-xs">Loading classroom assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Assignments Posted</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAdmin
              ? 'Click "Create Assignment" to post a new coursework requirement with rubric and auto-review.'
              : 'Your instructor has not posted any assignments yet for this classroom.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Assignment Cards */}
          {assignments.map((asgn) => {
            const hasSubmitted = !!asgn.mySubmission;
            const review = asgn.mySubmission?.reviewResult;
            const summary = asgn.submissionSummary;

            return (
              <div
                key={asgn.id}
                className="glass-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-sm space-y-5 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                        {asgn.totalMarks} Marks
                      </span>
                      {asgn.dueDate && (
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(asgn.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ⚡ Auto-Review Active
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {asgn.title}
                    </h3>

                    {asgn.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                        {asgn.description}
                      </p>
                    )}

                    {/* Required Sections Preview */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Required Sections Rubric:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(asgn.requiredSections || []).map((sec, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0">
                    {isAdmin ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => fetchAssignmentDetails(asgn.id, activeFilter)}
                          className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender text-xs font-bold hover:bg-purple-200 transition-colors"
                        >
                          View Class Submissions ({summary?.completedCount || 0})
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(asgn.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-right w-full sm:w-auto">
                        {hasSubmitted ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 justify-end">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submitted • Quality: {asgn.mySubmission.qualityScore}/100</span>
                            </div>
                            <div className="flex items-center space-x-2 justify-end">
                              <button
                                onClick={() => setViewReviewModal(asgn.mySubmission)}
                                className="px-3.5 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender text-xs font-bold hover:bg-purple-200 shadow-xs transition-all"
                              >
                                View Review
                              </button>
                              <button
                                onClick={() => {
                                  setSubmitModalAssignment(asgn);
                                  setSubmitFile(null);
                                  setSubmitError(null);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 shadow-xs transition-all flex items-center space-x-1"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Resubmit</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSubmitModalAssignment(asgn);
                              setSubmitFile(null);
                              setSubmitError(null);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Submit Document</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Faculty Summary Pill for this assignment */}
                {isAdmin && summary && (
                  <div className="pt-3 border-t border-slate-100 dark:border-dark-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                      <span className="text-[10px] text-slate-400 font-bold block">COMPLETED</span>
                      <span className="text-sm font-black text-emerald-600">{summary.completedCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                      <span className="text-[10px] text-slate-400 font-bold block">PENDING</span>
                      <span className="text-sm font-black text-amber-600">{summary.pendingCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                      <span className="text-[10px] text-slate-400 font-bold block">LATE</span>
                      <span className="text-sm font-black text-rose-600">{summary.lateCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                      <span className="text-[10px] text-slate-400 font-bold block">AVG QUALITY</span>
                      <span className="text-sm font-black text-purple-600">{summary.averageQualityScore}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. FACULTY SUBMISSION OVERVIEW DRILL-DOWN PANEL */}
      {isAdmin && selectedAssignmentDetails && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border space-y-5 animate-fade-in shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-brand-lavender block">
                Class Submissions Overview
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {selectedAssignmentDetails.assignment?.title}
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'late', label: 'Late' },
                  { id: 'low_score', label: 'Low Score (<70)' },
                  { id: 'high_score', label: 'High Score (≥85)' },
                ] as const
              ).map((flt) => (
                <button
                  key={flt.id}
                  onClick={() => {
                    setActiveFilter(flt.id);
                    if (selectedAssignmentId) {
                      fetchAssignmentDetails(selectedAssignmentId, flt.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeFilter === flt.id
                      ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Table */}
          {loadingDetails ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs">Loading class submissions...</p>
            </div>
          ) : selectedAssignmentDetails.submissions?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No submissions match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-dark-border text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Quality Score</th>
                    <th className="py-3 px-3">Submitted At</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40">
                  {selectedAssignmentDetails.submissions?.map((sub: any) => {
                    const isPending = sub.status === 'PENDING';
                    const name = sub.user?.name || (sub.user?.email ? sub.user.email.split('@')[0] : 'Student');
                    const email = sub.user?.email || '';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-surface/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{name}</div>
                          <div className="text-[11px] text-slate-400">{email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : sub.status === 'LATE'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {sub.qualityScore !== null ? (
                            <span
                              className={`font-black text-sm ${
                                sub.qualityScore >= 80
                                  ? 'text-emerald-600'
                                  : sub.qualityScore >= 60
                                  ? 'text-purple-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {sub.qualityScore}/100
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Not submitted'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isPending && (
                            <button
                              onClick={() => setViewReviewModal(sub)}
                              className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender font-bold hover:bg-purple-200 transition-colors"
                            >
                              View Review
                            </button>
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
      )}

      {/* 4. STUDENT SUBMIT MODAL */}
      {submitModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setSubmitModalAssignment(null);
                setLatestReviewResult(null);
              }}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Submit: {submitModalAssignment.title}
              </h3>
              <p className="text-xs text-slate-500">
                Upload your document to undergo instant automated structural and requirement review.
              </p>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-semibold">
                {submitError}
              </div>
            )}

            {latestReviewResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                    Submission Received & Reviewed!
                  </h4>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {latestReviewResult.qualityScore}/100 Quality Score
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Section Checklist:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {latestReviewResult.sectionChecks?.map((chk: any, i: number) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center space-x-1.5 ${
                          chk.present
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {chk.present ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{chk.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {latestReviewResult.missingRequirements?.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <span className="font-bold block">Improvement Areas:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {latestReviewResult.missingRequirements.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 italic">
                  * {latestReviewResult.disclaimer}
                </div>

                <button
                  onClick={() => {
                    setSubmitModalAssignment(null);
                    setLatestReviewResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Document (DOCX, PDF, TXT, MD) *
                  </label>
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.txt,.md"
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-950 dark:file:text-brand-lavender cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Expected Rubric:
                  </span>
                  <div>• Sections: {submitModalAssignment.requiredSections?.join(', ')}</div>
                  <div>• Minimum References: {submitModalAssignment.minReferences}</div>
                  <div>• Minimum Words: {submitModalAssignment.minWordCount} words</div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitModalAssignment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Submit & Run Review</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. VIEW REVIEW MODAL (FOR STUDENT OR FACULTY) */}
      {viewReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewReviewModal(null)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-brand-lavender">
                Automated Submission Review
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {viewReviewModal.title}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Quality Score</span>
                <span className="text-2xl font-black text-purple-700 dark:text-brand-lavender">
                  {viewReviewModal.qualityScore}/100
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  viewReviewModal.status === 'LATE'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {viewReviewModal.status}
              </span>
            </div>

            {/* Section Breakdown */}
            {viewReviewModal.reviewResult?.sectionChecks && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Required Section Verification:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {viewReviewModal.reviewResult.sectionChecks.map((chk: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center space-x-1.5 ${
                        chk.present
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {chk.present ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{chk.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">References Found</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {viewReviewModal.reviewResult?.referencesCount || 0} citations
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">Word Count</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {viewReviewModal.reviewResult?.wordCount || 0} words
                </span>
              </div>
            </div>

            {/* Missing items */}
            {viewReviewModal.reviewResult?.missingRequirements?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <span className="font-bold block">Review Notes & Missing Items:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {viewReviewModal.reviewResult.missingRequirements.map((req: string, i: number) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {viewReviewModal.fileUrl && (
              <a
                href={viewReviewModal.fileUrl}
                download={viewReviewModal.fileName || 'submission.docx'}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <span>Download Original Document</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 6. CREATE ASSIGNMENT MODAL (FACULTY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Create New Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Define required sections and rubric criteria for automated submission review.
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Software Engineering Case Study Report"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Prompt
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={2}
                  placeholder="Instructions for students..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={createTotalMarks}
                    onChange={(e) => setCreateTotalMarks(parseInt(e.target.value, 10) || 100)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Document Sections (comma separated)
                </label>
                <input
                  type="text"
                  value={createSectionsStr}
                  onChange={(e) => setCreateSectionsStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Min References
                  </label>
                  <input
                    type="number"
                    value={createMinReferences}
                    onChange={(e) => setCreateMinReferences(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Word Count
                  </label>
                  <input
                    type="number"
                    value={createMinWordCount}
                    onChange={(e) => setCreateMinWordCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Keywords / Concepts (comma separated)
                </label>
                <input
                  type="text"
                  value={createKeywordsStr}
                  onChange={(e) => setCreateKeywordsStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 disabled:opacity-50 flex items-center space-x-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publish Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
