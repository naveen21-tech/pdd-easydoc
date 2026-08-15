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
} from 'lucide-react';
import { McqTestItem, McqQuestionItem } from '@/lib/types';

export default function StudentExamPage({ params }: { params: { id: string; testId: string } }) {
  const router = useRouter();
  const { id: groupId, testId } = params;

  const [test, setTest] = useState<McqTestItem | null>(null);
  const [questions, setQuestions] = useState<McqQuestionItem[]>([]);
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
      setEvaluationResult(data);
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

    return (
      <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
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
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
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
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-border">
                          <span>Unanswered</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options List with Highlighting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {[
                      { key: 'A', text: q.optionA },
                      { key: 'B', text: q.optionB },
                      { key: 'C', text: q.optionC },
                      { key: 'D', text: q.optionD },
                    ].map((opt) => {
                      const isOptionCorrect = opt.key === q.correctOption?.toUpperCase();
                      const isStudentSelected = opt.key === q.studentChoice?.toUpperCase();

                      let optStyle = 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-300';
                      if (isOptionCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold';
                      } else if (isStudentSelected && !isCorrect) {
                        optStyle = 'border-rose-400 bg-rose-100/70 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 line-through';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>

                          {isOptionCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded ml-2 shrink-0">
                              Correct Answer
                            </span>
                          )}
                          {isStudentSelected && !isOptionCorrect && (
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-200 dark:bg-rose-900 px-1.5 py-0.5 rounded ml-2 shrink-0">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Done Action */}
        <div className="flex justify-center pt-4">
          <Link
            href={`/groups/${groupId}`}
            className="px-6 py-3 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Classroom Overview</span>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE EXAM TAKING INTERFACE
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 300; // less than 5 minutes

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto">
      {/* 1. EXAM TOP HEADER BAR */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-brand-lavender">
            Official Classroom Examination
          </span>
          <h1 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white line-clamp-1">
            {test.title}
          </h1>
        </div>

        {/* Live Timer Gauge */}
        <div
          className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border transition-all ${
            isUrgent
              ? 'bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse'
              : 'bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-brand-lavender'
          }`}
        >
          <Clock className="w-5 h-5" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider block">Time Remaining</span>
            <span className="font-mono text-xl font-black">{formatTimer(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN EXAM CARD & NAVIGATION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Question Box */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border space-y-6 shadow-sm">
              {/* Question Header & Meta */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border/60 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender font-bold text-xs">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                {answers[currentQ.id] && (
                  <button
                    onClick={() => handleClearOption(currentQ.id)}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Question Text */}
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question}
              </h3>

              {/* 4 Choices */}
              <div className="space-y-3 pt-2">
                {[
                  { key: 'A', text: currentQ.optionA },
                  { key: 'B', text: currentQ.optionB },
                  { key: 'C', text: currentQ.optionC },
                  { key: 'D', text: currentQ.optionD },
                ].map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.key;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(currentQ.id, opt.key)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-purple-100/80 dark:bg-brand-purple/30 border-purple-600 text-purple-950 dark:text-white shadow-sm ring-2 ring-purple-500/20'
                          : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400 border-slate-300 dark:border-dark-border'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : opt.key}
                      </div>
                      <span className="flex-1 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Previous / Next Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-dark-border/60">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-hover disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Review & Submit</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Palette & Finish Action */}
        <div className="space-y-5">
          {/* Status Counter */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-dark-border space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-600 dark:text-slate-400">Answered Questions</span>
                <span className="text-purple-700 dark:text-brand-lavender font-black">
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-700 to-indigo-600 transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Navigator Grid */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Question Navigator
              </span>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentIndex === idx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center border ${
                        isCurrent
                          ? 'ring-2 ring-purple-600 border-purple-600 bg-purple-700 text-white'
                          : isAnswered
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-dark-surface text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-border hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
              <Send className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                Submit Examination?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have answered <strong className="text-purple-700 dark:text-brand-lavender">{answeredCount} of {questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="text-rose-500 block font-semibold mt-1">
                    ⚠️ {questions.length - answeredCount} unanswered questions will be marked 0.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs"
              >
                Back to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitExam(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Evaluating...' : 'Confirm Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
