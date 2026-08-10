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
  Zap,
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

const TOPIC_PRESETS = [
  'Distributed Cloud Microservices & Kubernetes',
  'Machine Learning Model Deployment & Optimization',
  'Zero-Trust Cybersecurity & Cryptographic Verification',
  'Next.js 14 & Supabase Full-Stack Architecture',
  'High-Throughput Database Indexing & ACID Transactions',
];

function VivaStudioContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams?.get('projectId');
  const initialDocId = searchParams?.get('docId');

  // Input states
  const [sourceType, setSourceType] = useState<'project' | 'document' | 'custom'>(
    initialProjectId ? 'project' : initialDocId ? 'document' : 'project'
  );
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [customTopic, setCustomTopic] = useState('Distributed Cloud Systems & Microservices');
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
        const pList = pData.projects || [];
        setProjects(pList);
        if (!selectedProjectId && pList.length > 0) {
          setSelectedProjectId(pList[0].id);
        } else if (pList.length === 0 && !initialDocId) {
          setSourceType('custom');
        }
      }

      if (docRes.ok) {
        const dData = await docRes.json();
        const dList = dData.documents || [];
        setDocuments(dList);
        if (!selectedDocId && dList.length > 0) {
          setSelectedDocId(dList[0].id);
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
        questionCount: Number(questionCount) || 8,
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
        setToastMessage(`✓ Generated ${data.questions?.length || 0} viva defense questions!`);
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

  // Text-to-Speech Speak Question
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      setToastMessage('Speaking question...');
      setTimeout(() => setToastMessage(null), 2500);
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

  const activeQuestion = questions[currentQuestionIndex] || null;

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
          <div className="inline-flex items-center space-x-2 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-amber-200 dark:border-amber-700/40">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Feature 3 • Viva & Technical Defense Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Viva Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Simulate university examination defenses, viva voice exams, and principal technical interviews with real-time AI scoring.
          </p>
        </div>

        {questions.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-dark-surface p-1 rounded-2xl border border-slate-200 dark:border-dark-border text-xs font-bold">
            <button
              onClick={() => setViewMode('practice')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'practice'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Interactive Practice
            </button>
            <button
              onClick={() => setViewMode('bank')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'bank'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Question Bank
            </button>
            <button
              onClick={() => setViewMode('scorecard')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'scorecard'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Scorecard ({totalEvaluated}/{questions.length})
            </button>
          </div>
        )}
      </div>

      {/* Generator Configuration Panel */}
      {viewMode === 'generator' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Configure Defense Exam Session</span>
            </h2>

            {/* Source Mode Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
              <button
                onClick={() => setSourceType('project')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceType === 'project'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                From Project
              </button>
              <button
                onClick={() => setSourceType('document')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceType === 'document'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                From Document
              </button>
              <button
                onClick={() => setSourceType('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceType === 'custom'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Custom Topic
              </button>
            </div>
          </div>

          {/* Source Input Picker */}
          {sourceType === 'project' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Software Project Package
              </label>
              {projects.length > 0 ? (
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
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>No saved projects found.</span>
                  <button onClick={() => setSourceType('custom')} className="font-bold underline text-purple-700">
                    Switch to Custom Topic
                  </button>
                </div>
              )}
            </div>
          )}

          {sourceType === 'document' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Source Document
              </label>
              {documents.length > 0 ? (
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
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  No documents found. Please switch to Custom Topic mode.
                </div>
              )}
            </div>
          )}

          {sourceType === 'custom' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Preset Topics (Click to Select):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_PRESETS.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomTopic(t)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-brand-lavender/30 bg-purple-50 dark:bg-brand-amethyst/30 hover:bg-purple-100 text-purple-900 dark:text-brand-lavender transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Viva Defense Topic / Subject
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Cloud Systems"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Difficulty & Count Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Examination Difficulty
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DIFFICULTY_LEVELS.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      difficulty === diff
                        ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border-purple-400 dark:border-brand-lavender shadow-sm'
                        : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Number of Defense Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value={5}>5 Questions (Rapid Check)</option>
                <option value={8}>8 Questions (Standard Viva)</option>
                <option value={12}>12 Questions (Comprehensive Exam)</option>
                <option value={15}>15 Questions (Mastery Defense)</option>
              </select>
            </div>
          </div>

          {/* Categories Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Include Question Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {VIVA_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border-purple-400 dark:border-brand-lavender'
                        : 'border-slate-200 dark:border-dark-border text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-purple-700 dark:text-brand-lavender" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerateViva}
              disabled={generating}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Viva Questions...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-200" />
                  <span>Generate Defense Exam ({questionCount} Questions)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Practice Mode */}
      {viewMode === 'practice' && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
          {/* Left: Question Navigation List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  Exam Questions ({questions.length})
                </span>
                <button
                  onClick={() => setViewMode('generator')}
                  className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                >
                  New Session
                </button>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const hasAnswered = !!sessionAnswers[idx];
                  const qScore = sessionAnswers[idx]?.evaluation?.score;

                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        const existing = sessionAnswers[idx];
                        setUserAnswerText(existing?.userAnswer || '');
                        setCurrentEvaluation(existing?.evaluation || null);
                        setShowExpectedAnswer(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border text-left select-none flex items-start justify-between ${
                        isCurrent
                          ? 'border-purple-600 dark:border-brand-lavender bg-purple-50 dark:bg-brand-amethyst/60 ring-2 ring-purple-400/40 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-brand-lavender">
                            Q{idx + 1}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">
                            {q.category}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {q.question}
                        </p>
                      </div>

                      {hasAnswered && (
                        <div
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            qScore >= 80
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : qScore >= 60
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {qScore}/100
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Active Question & Interactive Answer Studio (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Question Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst px-2.5 py-0.5 rounded-md">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {activeQuestion.category} • {activeQuestion.difficulty}
                    </span>
                  </div>

                  <button
                    onClick={() => speakQuestion(activeQuestion.question)}
                    className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                    title="Read Question Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
                  {activeQuestion.question}
                </h3>
              </div>

              {/* User Answer Textarea with Mic Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Your Technical Answer
                  </label>

                  <button
                    onClick={toggleSpeechRecognition}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-md'
                        : 'bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Listening (Speak Now)...' : 'Voice Input'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={userAnswerText}
                  onChange={(e) => setUserAnswerText(e.target.value)}
                  placeholder="State your technical answer, architectural mechanisms, trade-offs, and rationale..."
                  className="w-full p-4 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setShowExpectedAnswer(!showExpectedAnswer)}
                    className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                  >
                    {showExpectedAnswer ? 'Hide Expected Answer' : 'Peek Expected Answer'}
                  </button>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={evaluating}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {evaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluating Answer...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit for AI Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Peek Expected Answer Card */}
              {showExpectedAnswer && (
                <div className="p-4 bg-purple-50 dark:bg-brand-amethyst/30 border border-purple-200 dark:border-brand-lavender/30 rounded-2xl text-xs space-y-2 animate-fade-in">
                  <span className="font-bold text-purple-900 dark:text-brand-lavender uppercase tracking-wider block">
                    Expected Examiner Response:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {activeQuestion.answer}
                  </p>
                </div>
              )}

              {/* Real-Time AI Evaluation Scorecard */}
              {currentEvaluation && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 space-y-4 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-3">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        AI Examiner Scorecard
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Score:</span>
                      <span
                        className={`font-display font-black text-xl ${
                          currentEvaluation.score >= 80
                            ? 'text-emerald-600'
                            : currentEvaluation.score >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {currentEvaluation.score} / 100
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
                    "{currentEvaluation.feedbackComment}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                        ✓ Correct Points Identified:
                      </span>
                      <ul className="list-disc ml-4 space-y-1 text-slate-600 dark:text-slate-300">
                        {currentEvaluation.correctPoints?.map((pt: string, pIdx: number) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block">
                        ⚠ Areas for Improvement:
                      </span>
                      <ul className="list-disc ml-4 space-y-1 text-slate-600 dark:text-slate-300">
                        {currentEvaluation.missingPoints?.map((pt: string, pIdx: number) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="inline-flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <span>{currentQuestionIndex === questions.length - 1 ? 'View Final Scorecard' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Bank View */}
      {viewMode === 'bank' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Complete Question Bank ({questions.length} Questions)
            </h3>
            <button
              onClick={() => setViewMode('practice')}
              className="bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Start Interactive Practice
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender">
                    Question #{idx + 1} • {q.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender px-2 py-0.5 rounded-md">
                    {q.difficulty}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  {q.question}
                </h4>
                <div className="p-3 bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-purple-700 dark:text-brand-lavender block mb-1">Expected Answer:</strong>
                  {q.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Scorecard View */}
      {viewMode === 'scorecard' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-8 shadow-sm space-y-6 animate-scale-in text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center mx-auto shadow-md">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              Defense Examination Scorecard
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated {totalEvaluated} of {questions.length} total questions
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-dark-border space-y-2">
            <span className="text-xs uppercase font-bold text-slate-500">Aggregate Performance Score</span>
            <div className="font-display font-black text-5xl text-purple-700 dark:text-brand-lavender">
              {averageScore}%
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              {averageScore >= 80
                ? 'Outstanding Defense Readiness! High conceptual clarity and strong technical articulation.'
                : averageScore >= 60
                ? 'Proficient Defense! Solid baseline, but review identified improvement areas.'
                : 'Needs Technical Preparation. Review expected answers and reinforce core concepts.'}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-4">
            <button
              onClick={() => {
                setViewMode('practice');
                setCurrentQuestionIndex(0);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
            >
              Review Questions
            </button>

            <button
              onClick={() => setViewMode('generator')}
              className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 font-bold text-xs px-6 py-2.5 rounded-xl"
            >
              Start New Session
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
