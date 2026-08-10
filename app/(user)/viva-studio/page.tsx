'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Send,
  Eye,
  RotateCcw,
  Award,
  TrendingUp,
  Brain,
  ShieldCheck,
  Code2,
  Database,
  Layers,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Copy,
  Volume2,
} from 'lucide-react';
import { VivaQuestionItem, VivaDifficulty, VivaCategory, ProjectItem, DocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VIVA_CATEGORIES: VivaCategory[] = [
  'General',
  'Technical',
  'Architecture',
  'Database',
  'Programming',
  'Security',
  'Testing',
  'Deployment',
  'Project-specific',
];

const DIFFICULTY_LEVELS: VivaDifficulty[] = ['Basic', 'Intermediate', 'Advanced', 'Expert'];

function VivaStudioContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');
  const initialDocId = searchParams.get('docId');


  // Input states
  const [sourceType, setSourceType] = useState<'project' | 'document' | 'custom'>(
    initialProjectId ? 'project' : initialDocId ? 'document' : 'project'
  );
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<VivaDifficulty>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [selectedCategories, setSelectedCategories] = useState<VivaCategory[]>(VIVA_CATEGORIES);

  // Active Session & View Mode
  const [viewMode, setViewMode] = useState<'generator' | 'bank' | 'practice' | 'scorecard'>('generator');
  const [questions, setQuestions] = useState<VivaQuestionItem[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  // Interactive Practice Mode State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [showExpectedAnswer, setShowExpectedAnswer] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, { userAnswer: string; evaluation: any }>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [projRes, docRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/documents'),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (!selectedProjectId && pData.projects?.length > 0) {
          setSelectedProjectId(pData.projects[0].id);
        }
      }

      if (docRes.ok) {
        const dData = await docRes.json();
        setDocuments(dData.documents || []);
        if (!selectedDocId && dData.documents?.length > 0) {
          setSelectedDocId(dData.documents[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCategory = (cat: VivaCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleGenerateViva = async () => {
    setGenerating(true);
    setToastMessage(null);

    try {
      const payload: any = {
        difficulty,
        questionCount,
        categories: selectedCategories,
      };

      if (sourceType === 'project') {
        payload.projectId = selectedProjectId;
      } else if (sourceType === 'document') {
        payload.documentId = selectedDocId;
      } else {
        payload.title = customTopic || 'Custom Software Topic';
      }

      const res = await fetch('/api/viva/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setSessionTitle(data.title || 'Viva Session');
        setViewMode('practice');
        setCurrentQuestionIndex(0);
        setUserAnswerText('');
        setCurrentEvaluation(null);
        setShowExpectedAnswer(false);
        setSessionAnswers({});
        setToastMessage(`Generated ${data.questions?.length || 0} viva defense questions!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate viva questions.');
      }
    } catch (e: any) {
      alert(e?.message || 'Error creating viva questions.');
    } finally {
      setGenerating(false);
    }
  };

  // Speech Recognition Mic Toggle
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    if (!userAnswerText.trim()) {
      alert('Please type or speak your answer before submitting.');
      return;
    }

    setEvaluating(true);
    const activeQ = questions[currentQuestionIndex];

    try {
      const res = await fetch('/api/viva/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ.question,
          expectedAnswer: activeQ.answer,
          userAnswer: userAnswerText,
          category: activeQ.category,
          difficulty: activeQ.difficulty,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentEvaluation(data.evaluation);
        setSessionAnswers((prev) => ({
          ...prev,
          [currentQuestionIndex]: {
            userAnswer: userAnswerText,
            evaluation: data.evaluation,
          },
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const existing = sessionAnswers[nextIdx];
      setUserAnswerText(existing?.userAnswer || '');
      setCurrentEvaluation(existing?.evaluation || null);
      setShowExpectedAnswer(false);
    } else {
      // Finished all questions -> View Scorecard
      setViewMode('scorecard');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      const existing = sessionAnswers[prevIdx];
      setUserAnswerText(existing?.userAnswer || '');
      setCurrentEvaluation(existing?.evaluation || null);
      setShowExpectedAnswer(false);
    }
  };

  // Calculate Overall Final Score
  const evaluatedKeys = Object.keys(sessionAnswers);
  const totalEvaluated = evaluatedKeys.length;
  const averageScore = totalEvaluated > 0
    ? Math.round(
        evaluatedKeys.reduce((acc, k) => acc + (sessionAnswers[Number(k)]?.evaluation?.score || 0), 0) /
          totalEvaluated
      )
    : 0;

  const currentQ = questions[currentQuestionIndex] || null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold animate-slide-up flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Feature 3 • Viva Defense & Technical Q&A Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Viva Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Simulate viva defense examinations, test your project knowledge, and receive real-time AI scoring.
          </p>
        </div>

        {questions.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
            <button
              onClick={() => setViewMode('practice')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'practice'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Interactive Practice
            </button>
            <button
              onClick={() => setViewMode('bank')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'bank'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Question Bank ({questions.length})
            </button>
          </div>
        )}
      </div>

      {/* 1. SETUP / GENERATOR ACCORDION */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-border pb-4">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Brain className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Generate Viva Defense Questions</span>
          </h2>

          <div className="flex items-center space-x-1 text-xs font-semibold bg-slate-100 dark:bg-dark-bg p-1 rounded-xl">
            <button
              onClick={() => setSourceType('project')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sourceType === 'project'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender font-bold shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              From Project
            </button>
            <button
              onClick={() => setSourceType('document')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sourceType === 'document'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender font-bold shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              From Document
            </button>
            <button
              onClick={() => setSourceType('custom')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sourceType === 'custom'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender font-bold shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Custom Topic
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceType === 'project' && (
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Project Package
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.domain})
                  </option>
                ))}
              </select>
            </div>
          )}

          {sourceType === 'document' && (
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Document
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {sourceType === 'custom' && (
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Custom Topic / Domain
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Distributed Database Sharding, OAuth 2.0 PKCE, Microservices"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as VivaDifficulty)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
          <label className="block text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
            Target Examination Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {VIVA_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border-purple-300 dark:border-brand-lavender/40'
                      : 'bg-slate-50 dark:bg-dark-bg text-slate-500 border-slate-200 dark:border-dark-border'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateViva}
            disabled={generating}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assembling Viva Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Generate Viva Questions ({questionCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE PRACTICE MODE */}
      {viewMode === 'practice' && currentQ && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-scale-in max-w-4xl mx-auto">
          {/* Header & Question Navigation Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-purple-100 dark:bg-brand-amethyst text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full border border-purple-200 dark:border-brand-lavender/30">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-bold text-slate-500">({currentQ.difficulty})</span>
            </div>

            <span className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-dark-bg text-purple-700 dark:text-brand-lavender px-3 py-1 rounded-full border border-slate-200 dark:border-dark-border">
              {currentQ.category}
            </span>
          </div>

          {/* Question Text */}
          <div className="p-6 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider block">
              Examiner Question:
            </span>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
              "{currentQ.question}"
            </h3>
          </div>

          {/* User Answer Textarea & Voice Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Answer / Technical Defense:
              </label>

              <button
                onClick={toggleSpeechRecognition}
                className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isRecording
                    ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : 'bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening... (Speak Now)' : 'Voice Input (Mic)'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={userAnswerText}
              onChange={(e) => setUserAnswerText(e.target.value)}
              placeholder="Type your explanation, technical reasoning, and trade-offs here..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Evaluation Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setShowExpectedAnswer(!showExpectedAnswer)}
              className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showExpectedAnswer ? 'Hide Standard Answer' : 'Show Standard Answer'}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSubmitAnswer}
                disabled={evaluating || !userAnswerText.trim()}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {evaluating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Evaluate Answer</span>
              </button>
            </div>
          </div>

          {/* Expected Answer Reveal */}
          {showExpectedAnswer && (
            <div className="p-4 bg-purple-50 dark:bg-brand-amethyst/30 border border-purple-200 dark:border-brand-lavender/30 rounded-2xl space-y-1.5 animate-fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-brand-lavender">
                Expected Technical Standard:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {currentQ.answer}
              </p>
            </div>
          )}

          {/* Instant AI Evaluation Result Card */}
          {currentEvaluation && (
            <div className="p-6 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                    AI Evaluation Score
                  </span>
                  <p className="font-display font-black text-2xl text-slate-900 dark:text-white">
                    {currentEvaluation.score} / 100
                  </p>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    currentEvaluation.score >= 80
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                      : currentEvaluation.score >= 60
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                  }`}
                >
                  {currentEvaluation.score >= 80 ? 'Mastery' : currentEvaluation.score >= 60 ? 'Satisfactory' : 'Needs Review'}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                "{currentEvaluation.feedbackComment}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Correct points */}
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Demonstrated Strengths</span>
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {currentEvaluation.correctPoints?.map((pt: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing points / Suggested improvements */}
                <div className="space-y-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Areas to Expand</span>
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {currentEvaluation.missingPoints?.map((pt: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-500">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Step Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <button
              onClick={handleNextQuestion}
              className="inline-flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 dark:bg-brand-purple text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
            >
              <span>{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Final Scorecard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. QUESTION BANK VIEW (All in One Card) */}
      {viewMode === 'bank' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Viva Question Bank ({questions.length} Items)
              </h3>
              <p className="text-xs text-slate-500">Comprehensive study questions and expected technical answers</p>
            </div>
            <button
              onClick={() => setViewMode('practice')}
              className="inline-flex items-center space-x-1.5 bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              <span>Start Interactive Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender">
                    #{idx + 1} • {q.category} ({q.difficulty})
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  {q.question}
                </h4>
                <div className="p-3 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider block mb-1">
                    Expected Answer:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FINAL EXAM SCORECARD VIEW */}
      {viewMode === 'scorecard' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-8 shadow-xl space-y-8 animate-scale-in max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center mx-auto shadow-md border border-purple-200 dark:border-brand-lavender/30">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
              Viva Defense Scorecard
            </h2>
            <p className="text-xs text-slate-500">Evaluation completed across {totalEvaluated} answered questions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-brand-amethyst/40 border border-purple-200 dark:border-brand-lavender/30">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                Overall Viva Score
              </span>
              <p className="font-display font-black text-4xl text-purple-900 dark:text-white mt-1">
                {averageScore} / 100
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Answered Questions
              </span>
              <p className="font-display font-black text-4xl text-emerald-600 dark:text-emerald-400 mt-1">
                {totalEvaluated} / {questions.length}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Difficulty Level
              </span>
              <p className="font-display font-black text-3xl text-slate-800 dark:text-white mt-1">
                {difficulty}
              </p>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              onClick={() => {
                setViewMode('practice');
                setCurrentQuestionIndex(0);
                setSessionAnswers({});
                setCurrentEvaluation(null);
                setUserAnswerText('');
              }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>

            <button
              onClick={() => setViewMode('bank')}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border px-6 py-3.5 rounded-xl hover:bg-slate-100"
            >
              Review Question Bank
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VivaStudioPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-brand-purple" />
          <span>Loading Viva Studio...</span>
        </div>
      }
    >
      <VivaStudioContent />
    </React.Suspense>
  );
}

