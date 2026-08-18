'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  ShieldAlert,
  Award,
  BookOpen,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { McqTestItem, McqQuestionItem } from '@/lib/types';

export default function StudentExamPage({ params }: { params: { id: string; testId: string } }) {
  const router = useRouter();
  const { id: groupId, testId } = params;

  const [test, setTest] = useState<McqTestItem | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Result state after submission
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  useEffect(() => {
    fetchTestForExam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupId, testId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || evaluationResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, evaluationResult]);

  const fetchTestForExam = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if student already has a result
      const myResultRes = await fetch(`/api/groups/${groupId}/tests/${testId}/my-result`);
      if (myResultRes.ok) {
        const myResultData = await myResultRes.json();
        setTest(myResultData.test);
        setEvaluationResult({
          attempt: myResultData.attempt,
          evaluation: {
            score: myResultData.attempt.score,
            totalMarks: myResultData.attempt.totalMarks,
            percentage: myResultData.attempt.percentage,
            passed: myResultData.attempt.passed,
            correctCount: myResultData.attempt.correctCount,
            wrongCount: myResultData.attempt.wrongCount,
            unansweredCount: myResultData.attempt.unansweredCount,
            totalQuestions: myResultData.attempt.totalQuestions,
            passingMarks: myResultData.test?.passingMarks || 4,
          },
          topicScores: myResultData.topicScores || myResultData.attempt?.topicScores || {},
          questionResults: myResultData.questionBreakdown || [],
        });
        setLoading(false);
        return;
      }

      // Fetch test without correct answers
      const res = await fetch(`/api/groups/${groupId}/tests/${testId}/take`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load test');
        return;
      }

      setTest(data.test);
      setQuestions(data.questions || []);
      setTimeLeft((data.test.duration || 20) * 60);
    } catch (e: any) {
      setError(e?.message || 'Network error starting exam');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleClearOption = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleAutoSubmit = async () => {
    await submitExam(true);
  };

  const submitExam = async (isAuto = false) => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await fetch(`/api/groups/${groupId}/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          isAutoSubmit: isAuto,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Submission failed');
        return;
      }

      setShowSubmitModal(false);
      setEvaluationResult({
        attempt: data.result,
        evaluation: data.result,
        topicScores: data.result?.topicScores || {},
        weakTopic: data.result?.weakTopic || null,
        questionResults: data.result?.questionResults || [],
      });
    } catch (e: any) {
      alert(e?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 className="w-9 h-9 text-purple-600 dark:text-brand-lavender animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Preparing test environment...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="glass-card p-10 text-center rounded-3xl border border-slate-200 dark:border-dark-border max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
          Test Unavailable
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error || 'Test not found or already completed.'}
        </p>
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classroom</span>
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------
  // POST-EXAM EVALUATION REVIEW SCREEN
  // -------------------------------------------------------------
  if (evaluationResult) {
    const evalData = evaluationResult.evaluation || {};
    const passed = evalData.passed;
    const qResults = evaluationResult.questionResults || [];
    const topicScores = evaluationResult.topicScores || {};

    return (
      <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto py-6 px-4 sm:px-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/groups/${groupId}`}
            className="inline-flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Classroom</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            {test.title}
          </span>
        </div>

        {/* Score Hero Card */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-md text-center space-y-4 relative overflow-hidden ${
            passed
              ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300 dark:border-emerald-800'
              : 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-800'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center border shadow-sm ${
              passed
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}
          >
            {passed ? <Award className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                passed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
              }`}
            >
              {passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white">
              {evalData.score} / {evalData.totalMarks} Marks
            </h2>

            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Overall Score: {evalData.percentage}% • Passing Threshold: {evalData.passingMarks} Marks
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Questions</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">{evalData.totalQuestions}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Correct</span>
              <p className="text-lg font-black text-emerald-600">{evalData.correctCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Incorrect</span>
              <p className="text-lg font-black text-rose-500">{evalData.wrongCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Unanswered</span>
              <p className="text-lg font-black text-slate-500">{evalData.unansweredCount}</p>
            </div>
          </div>
        </div>

        {/* Topic-Wise Performance Breakdown */}
        {Object.keys(topicScores).length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span>Topic Proficiency Breakdown</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(topicScores).map(([tName, stats]: [string, any], idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{tName}</span>
                    <span className="font-mono font-black">{stats.percentage}% ({stats.correct}/{stats.total})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-dark-bg overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stats.percentage >= 75
                          ? 'bg-emerald-500'
                          : stats.percentage >= 50
                          ? 'bg-purple-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, stats.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Solutions Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <span>Detailed Question Review</span>
            </h3>
            <span className="text-xs text-slate-500">
              Review correct answers and explanations
            </span>
          </div>

          <div className="space-y-4">
            {qResults.map((q: any, idx: number) => {
              const isCorrect = q.isCorrect;
              const hasAnswered = !!q.studentChoice;

              return (
                <div
                  key={q.questionId || idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : hasAnswered
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender">
                          Question {idx + 1}
                        </span>
                        {q.topic && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                            {q.topic}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            [{q.difficulty}]
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-relaxed">
                        {q.question}
                      </h4>
                    </div>

                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct (+{q.marks})</span>
                        </span>
                      ) : hasAnswered ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect (0)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-dark-bg text-slate-600 dark:text-slate-400">
                          <span>Skipped (0)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const optText = q[`option${opt}`];
                      const isStudentChoice = q.studentChoice === opt;
                      const isCorrectOpt = q.correctOption === opt;

                      let style = 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300';
                      if (isCorrectOpt) {
                        style = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isStudentChoice && !isCorrectOpt) {
                        style = 'bg-rose-100 dark:bg-rose-950/80 border-rose-400 text-rose-800 dark:text-rose-200 line-through';
                      }

                      return (
                        <div key={opt} className={`p-3 rounded-xl border flex items-center space-x-2 ${style}`}>
                          <span className="w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 bg-slate-100 dark:bg-dark-bg">
                            {opt}
                          </span>
                          <span className="flex-1">{optText}</span>
                          {isCorrectOpt && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE EXAM TAKING INTERFACE
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* 1. TOP TIMER & EXAM BAR */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-dark-border flex items-center justify-between gap-4 sticky top-4 z-40 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md shadow-md">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
            Classroom Examination
          </span>
          <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
            {test.title}
          </h2>
        </div>

        {/* Live Timer */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl border font-mono font-black text-sm shadow-xs ${
              timeLeft < 300
                ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 border-rose-300 dark:border-rose-800 animate-pulse'
                : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border-purple-200 dark:border-purple-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 transition-all flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </div>

      {/* 2. QUESTION PALETTE STRIP */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-2 bg-slate-100 dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!answers[q.id];

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isCurrent
                  ? 'bg-purple-700 text-white shadow-md'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-white dark:bg-dark-bg text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE QUESTION CARD */}
      {currentQ && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {currentQ.topic && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800">
                  {currentQ.topic}
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-slate-500 font-mono">
              {currentQ.marks || 1} Mark
            </span>
          </div>

          <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optText = currentQ[`option${opt}`];
              const isSelected = answers[currentQ.id] === opt;

              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 text-xs ${
                    isSelected
                      ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                      : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-200 hover:border-purple-300'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt}
                  </span>
                  <span className="flex-1 font-medium leading-relaxed">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => handleClearOption(currentQ.id)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Clear Choice
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800"
                >
                  Review & Submit
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4 text-center">
            <HelpCircle className="w-10 h-10 text-purple-600 mx-auto" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Ready to Submit Your Exam?
            </h3>
            <p className="text-xs text-slate-500">
              You have answered <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> out of{' '}
              <strong className="text-slate-900 dark:text-white">{totalQuestions}</strong> questions.
            </p>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Return to Exam
              </button>
              <button
                onClick={() => submitExam(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
