'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Sparkles,
  CheckCircle2,
  FileQuestion,
  Mic,
  Zap,
  Loader2,
  ArrowRight,
  Target,
  FileText,
} from 'lucide-react';

interface RecommendationItem {
  topic: string;
  proficiencyScore: number;
  status: string;
  recommendedMaterial?: {
    id: string;
    title: string;
    subject: string;
    unit: string;
    chapter: string;
  } | null;
  suggestedActions: Array<{
    label: string;
    action: string;
    query: string;
  }>;
}

interface MyPerformanceTabProps {
  groupId: string;
  classroomName: string;
  onNavigateToKnowledgeHub?: (action: string, query: string) => void;
}

export default function MyPerformanceTab({
  groupId,
  classroomName,
  onNavigateToKnowledgeHub,
}: MyPerformanceTabProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [assignmentAdvice, setAssignmentAdvice] = useState<string[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);

  useEffect(() => {
    fetchRecommendations();
  }, [groupId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/recommendations`);
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.recommendations || []);
        setAssignmentAdvice(json.assignmentAdvice || []);
        setTotalTopics(json.totalEvaluatedTopics || 0);
      }
    } catch (e) {
      console.error('Fetch recommendations error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
        <p className="text-xs">Analyzing your academic progress and computing personalized recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-slate-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-dark-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                <Award className="w-5 h-5" />
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                My Performance & Smart Recommendations
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Personalized concept diagnostics and direct learning pathways based on your MCQ tests and assignment submissions.
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOPIC MASTERY BREAKDOWN */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span>Curriculum Topic Mastery</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {totalTopics} Topic{totalTopics !== 1 ? 's' : ''} Evaluated
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
              Excellent Academic Mastery!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              All your evaluated topics meet or exceed proficiency standards (≥75%). Keep up the great work!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {rec.topic}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      rec.proficiencyScore < 50
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {rec.proficiencyScore}% • {rec.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      rec.proficiencyScore < 50 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, rec.proficiencyScore))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. PERSONALIZED LEARNING RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-brand-lavender animate-pulse" />
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Recommended Study Actions For You
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="glass-card rounded-3xl border border-purple-200 dark:border-purple-800/60 p-6 shadow-sm space-y-4 bg-purple-50/20 dark:bg-purple-950/10 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                      Weak Topic • {rec.proficiencyScore}%
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    Mastering {rec.topic}
                  </h4>

                  {rec.recommendedMaterial && (
                    <div className="p-3 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-xs flex items-center space-x-2 shadow-xs">
                      <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 truncate">
                        <strong>Recommended Notes:</strong> {rec.recommendedMaterial.title} ({rec.recommendedMaterial.unit})
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggested Smart Actions */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Instant Remediation Tools:
                  </span>
                  {rec.suggestedActions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={() => {
                        if (onNavigateToKnowledgeHub) {
                          onNavigateToKnowledgeHub(act.action, act.query);
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-dark-surface hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {act.action === 'generate-mcq' && <FileQuestion className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        {act.action === 'generate-viva' && <Mic className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        {act.action === 'summarize' && <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {act.action === 'ask' && <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        <span className="truncate">{act.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ASSIGNMENT RUBRIC IMPROVEMENTS */}
      {assignmentAdvice.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10 space-y-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Assignment Quality Check Warnings
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Recent auto-reviews flagged the following missing structural requirements in your submissions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {assignmentAdvice.map((adv, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-amber-100 dark:border-amber-900/40 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center space-x-2 shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
