'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Users,
  FileText,
  HelpCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  User,
  X,
  Target,
  Zap,
} from 'lucide-react';

interface IntelligenceData {
  classroomName: string;
  summary: {
    totalStudents: number;
    assignmentSubmissionRate: number;
    averageAssignmentQuality: number;
    mcqAverage: number;
    participationRate: number;
    topPerformingCount: number;
    needsAttentionCount: number;
  };
  topicAnalysis: {
    strongestTopic: { topic: string; averagePercentage: number } | null;
    weakestTopic: { topic: string; averagePercentage: number } | null;
    topics: Array<{ topic: string; averagePercentage: number; totalEvaluations: number }>;
  };
  mcqInsights: {
    mostMissedQuestion: {
      questionId: string;
      questionText: string;
      topic: string;
      testName: string;
      correctCount: number;
      incorrectCount: number;
      totalResponses: number;
      missPercentage: number;
    } | null;
    allMissedQuestions: any[];
  };
  assignmentInsights: Array<{
    id: string;
    title: string;
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    lateCount: number;
    submissionPercentage: number;
    averageQualityScore: number;
  }>;
  studentPerformance: {
    topPerformers: any[];
    needsAttention: any[];
    allProfiles: any[];
  };
  automaticInsights: string[];
}

interface FacultyIntelligenceTabProps {
  groupId: string;
  classroomName: string;
}

export default function FacultyIntelligenceTab({ groupId, classroomName }: FacultyIntelligenceTabProps) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    fetchIntelligence();
  }, [groupId]);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/intelligence`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Fetch intelligence error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
        <p className="text-xs">Computing real-time faculty intelligence analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p className="text-xs">Failed to load classroom intelligence.</p>
      </div>
    );
  }

  const { summary, topicAnalysis, mcqInsights, assignmentInsights, studentPerformance, automaticInsights } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HERO HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-slate-900/20 dark:from-purple-950/60 dark:via-indigo-950/40 dark:to-dark-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                <Brain className="w-5 h-5" />
              </span>
              <span className="text-xs font-black tracking-widest uppercase text-purple-700 dark:text-brand-lavender">
                FACULTY INTELLIGENCE
              </span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Class Performance Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Real-time synthesis across assignments, adaptive MCQ tests, topic proficiencies, and coursework engagement.
            </p>
          </div>

          <button
            onClick={fetchIntelligence}
            className="px-4 py-2 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-hover shadow-sm transition-all"
          >
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center space-x-1 text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">Students</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.totalStudents}</p>
          <span className="text-[10px] text-slate-500 font-semibold block">Enrolled Roster</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center space-x-1 text-indigo-500">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">Assignments</span>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {summary.assignmentSubmissionRate}%
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block">Submission Rate</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center space-x-1 text-purple-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">MCQ Average</span>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-brand-lavender">{summary.mcqAverage}%</p>
          <span className="text-[10px] text-slate-500 font-semibold block">Class Mean Score</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm">
          <div className="flex items-center justify-center space-x-1 text-emerald-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">Participation</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.participationRate}%</p>
          <span className="text-[10px] text-slate-500 font-semibold block">Active Learners</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-center space-x-1 text-emerald-600">
            <Award className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">Top Performing</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{summary.topPerformingCount}</p>
          <span className="text-[10px] text-emerald-600/80 font-bold block">Score ≥ 75%</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-center space-y-1 shadow-sm bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-center space-x-1 text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase">Needs Attention</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{summary.needsAttentionCount}</p>
          <span className="text-[10px] text-amber-600/80 font-bold block">At-Risk or Pending</span>
        </div>
      </div>

      {/* 3. AUTOMATIC CLASSROOM INSIGHTS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender animate-pulse" />
          <h3 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-purple-900 dark:text-purple-200">
            Automated Academic Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {automaticInsights.map((insight, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white dark:bg-dark-surface border border-purple-100 dark:border-purple-900/50 text-xs text-slate-800 dark:text-slate-200 flex items-start space-x-2.5 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-brand-lavender mt-1.5 shrink-0" />
              <span className="leading-relaxed font-medium">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TOPIC ANALYSIS & MOST MISSED QUESTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Analysis */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Topic Mastery Analysis</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Curriculum Distribution</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Strongest Topic</span>
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-0.5 line-clamp-1">
                {topicAnalysis.strongestTopic ? topicAnalysis.strongestTopic.topic : 'Evaluating...'}
              </p>
              {topicAnalysis.strongestTopic && (
                <span className="text-xs font-extrabold text-emerald-600">
                  {topicAnalysis.strongestTopic.averagePercentage}% Avg Mastery
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <span className="text-[10px] font-bold text-rose-600 uppercase block">Weakest Topic</span>
              <p className="text-sm font-black text-rose-800 dark:text-rose-300 mt-0.5 line-clamp-1">
                {topicAnalysis.weakestTopic ? topicAnalysis.weakestTopic.topic : 'Evaluating...'}
              </p>
              {topicAnalysis.weakestTopic && (
                <span className="text-xs font-extrabold text-rose-600">
                  {topicAnalysis.weakestTopic.averagePercentage}% Avg Mastery
                </span>
              )}
            </div>
          </div>

          {/* Topic Progress Bars */}
          <div className="space-y-3 pt-2">
            {topicAnalysis.topics.map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{t.topic}</span>
                  <span className="font-mono font-black">{t.averagePercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.averagePercentage >= 75
                        ? 'bg-emerald-500'
                        : t.averagePercentage >= 55
                        ? 'bg-purple-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, t.averagePercentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Missed Question Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-rose-500" />
                <span>MCQ Question Insights</span>
              </h3>
              <span className="text-[10px] text-rose-500 font-extrabold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                Frequent Errors
              </span>
            </div>

            {mcqInsights.mostMissedQuestion ? (
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Most Missed Question ({mcqInsights.mostMissedQuestion.testName})
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  &quot;{mcqInsights.mostMissedQuestion.questionText}&quot;
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-dark-bg">
                    <span className="text-[10px] text-slate-400 block font-bold">Topic</span>
                    <span className="font-bold text-purple-600 line-clamp-1">{mcqInsights.mostMissedQuestion.topic}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                    <span className="text-[10px] text-rose-600 block font-bold">Incorrect</span>
                    <span className="font-black text-rose-600">
                      {mcqInsights.mostMissedQuestion.incorrectCount} / {mcqInsights.mostMissedQuestion.totalResponses}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                    <span className="text-[10px] text-rose-600 block font-bold">Miss Rate</span>
                    <span className="font-black text-rose-600">
                      {mcqInsights.mostMissedQuestion.missPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No question misses recorded yet. Publish tests and gather student responses to view insights.
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
            <strong>Faculty Recommendation:</strong> Consider reviewing the concepts behind frequently missed questions in your next class lecture or upload summary notes.
          </div>
        </div>
      </div>

      {/* 5. STUDENT PERFORMANCE TIERS & DRILL-DOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Top Performing Students</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              {studentPerformance.topPerformers.length} High Achievers
            </span>
          </div>

          {studentPerformance.topPerformers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No student profiles meet the high-achievement threshold yet.
            </div>
          ) : (
            <div className="space-y-2">
              {studentPerformance.topPerformers.map((st) => (
                <div
                  key={st.userId}
                  onClick={() => setSelectedStudent(st)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-emerald-400 transition-all flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                      {st.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</h4>
                      <p className="text-[11px] text-slate-400">{st.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
                      {st.overallScore}% Composite
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Needing Attention */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Students Needing Attention</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              {studentPerformance.needsAttention.length} Interventions
            </span>
          </div>

          {studentPerformance.needsAttention.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              All enrolled students are progressing satisfactorily!
            </div>
          ) : (
            <div className="space-y-2">
              {studentPerformance.needsAttention.map((st) => (
                <div
                  key={st.userId}
                  onClick={() => setSelectedStudent(st)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-amber-400 transition-all flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                      {st.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</h4>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        {st.pendingAssignments > 0 ? `${st.pendingAssignments} pending assignment(s)` : 'Low test score'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl">
                      {st.overallScore}% Score
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. STUDENT DRILL-DOWN MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender font-black text-base flex items-center justify-center border border-purple-200">
                {selectedStudent.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">Assignments</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedStudent.assignmentsCompleted} / {selectedStudent.assignmentsTotal}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">MCQ Tests</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedStudent.mcqTestsAttempted} Attempted
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">Avg Doc Quality</span>
                <span className="font-black text-indigo-600">
                  {selectedStudent.averageAssignmentScore !== null ? `${selectedStudent.averageAssignmentScore}%` : '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                <span className="text-slate-400 block font-bold">Composite Score</span>
                <span className="font-black text-purple-600">{selectedStudent.overallScore}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <span className="font-bold block">Intervention Action:</span>
              <p className="text-[11px] leading-relaxed">
                Recommend the student review relevant Knowledge Hub notes and attempt practice adaptive MCQs to strengthen weak concepts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
