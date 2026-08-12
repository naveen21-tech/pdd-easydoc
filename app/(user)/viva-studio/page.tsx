'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  Download,
  Edit3,
  Search,
  CheckSquare,
  XCircle,
  FileText,
  Filter,
  BarChart3,
} from 'lucide-react';
import { VivaQuestionItem, VivaDifficulty, VivaCategory, DocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MCQ_CATEGORIES: VivaCategory[] = [
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

const QUESTION_COUNT_PRESETS = [10, 20, 25, 30, 40, 50];

const TOPIC_PRESETS = [
  'Distributed Cloud Microservices & Kubernetes',
  'Machine Learning Model Deployment & Optimization',
  'Zero-Trust Cybersecurity & Cryptographic Verification',
  'Next.js 14 & Supabase Full-Stack Architecture',
  'High-Throughput Database Indexing & ACID Transactions',
  'Data Structures, Algorithms & Time Complexity',
  'DevOps CI/CD Pipelines & Blue-Green Deployments',
  'REST vs GraphQL vs gRPC API System Design',
];

function VivaStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams?.get('docId');

  // Input states
  const [sourceType, setSourceType] = useState<'document' | 'custom'>(
    initialDocId ? 'document' : 'custom'
  );
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [customTopic, setCustomTopic] = useState('Distributed Cloud Systems & Microservices');
  const [difficulty, setDifficulty] = useState<VivaDifficulty>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [selectedCategories, setSelectedCategories] = useState<VivaCategory[]>(MCQ_CATEGORIES);

  // Active Session & View Mode ('generator' | 'practice' | 'bank' | 'scorecard')
  const [viewMode, setViewMode] = useState<'generator' | 'practice' | 'bank' | 'scorecard'>('generator');
  const [questions, setQuestions] = useState<VivaQuestionItem[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [openingInEditor, setOpeningInEditor] = useState(false);

  // Interactive MCQ Practice Mode State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, { selectedOption: number; isCorrect: boolean }>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Question Bank Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [bankCategoryFilter, setBankCategoryFilter] = useState<string>('All');
  const [showAllBankAnswers, setShowAllBankAnswers] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const docRes = await fetch('/api/documents');
      if (docRes.ok) {
        const dData = await docRes.json();
        const dList = dData.documents || [];
        setDocuments(dList);
        if (!selectedDocId && dList.length > 0) {
          setSelectedDocId(dList[0].id);
          setSourceType('document');
        } else if (dList.length === 0) {
          setSourceType('custom');
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

  const handleGenerateMCQs = async () => {
    setGenerating(true);
    setToastMessage(null);

    try {
      const payload: any = {
        difficulty,
        questionCount: Number(questionCount) || 25,
        categories: selectedCategories,
      };

      if (sourceType === 'document') {
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
        const generatedQs: VivaQuestionItem[] = data.questions || [];
        setQuestions(generatedQs);
        setSessionTitle(data.title || 'MCQ Exam Session');
        setViewMode('practice');
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setUserAnswers({});
        setToastMessage(`✓ Generated ${generatedQs.length} MCQs with full answer keys!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate MCQs.');
      }
    } catch (e: any) {
      alert(e?.message || 'Error generating MCQs.');
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
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  // Handle Option Select in Practice Mode
  const handleSelectOption = (optionIdx: number) => {
    const activeQ = questions[currentQuestionIndex];
    if (!activeQ) return;

    setSelectedOption(optionIdx);
    setShowExplanation(true);

    const isCorrect = optionIdx === (activeQ.correctOptionIndex ?? 0);
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        selectedOption: optionIdx,
        isCorrect,
      },
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const existing = userAnswers[nextIdx];
      setSelectedOption(existing !== undefined ? existing.selectedOption : null);
      setShowExplanation(existing !== undefined);
    } else {
      setViewMode('scorecard');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      const existing = userAnswers[prevIdx];
      setSelectedOption(existing !== undefined ? existing.selectedOption : null);
      setShowExplanation(existing !== undefined);
    }
  };

  // Open in Document Editor
  const handleOpenInDocumentEditor = async () => {
    if (questions.length === 0) return;
    setOpeningInEditor(true);

    try {
      let markdownContent = `# ${sessionTitle} — MCQ Exam & Answer Key\n\n[TEMPLATE_BADGE] Multiple Choice Examination • ${difficulty}\n\n`;
      markdownContent += `**Total Questions:** ${questions.length} | **Difficulty:** ${difficulty} | **Generated by:** EasyDoc MCQ Studio\n\n---\n\n`;

      questions.forEach((q, idx) => {
        markdownContent += `### Q${idx + 1}. ${q.question}\n`;
        const options = q.options || [];
        options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          const isCorrect = oIdx === (q.correctOptionIndex ?? 0);
          markdownContent += `- **(${letter})** ${opt}${isCorrect ? '  *(✓ Correct Answer)*' : ''}\n`;
        });
        markdownContent += `\n> **Explanation:** ${q.explanation || q.answer}\n\n---\n\n`;
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${sessionTitle} (MCQ Paper)`,
          content: markdownContent.trim(),
        }),
      });

      if (res.ok) {
        const doc = await res.json();
        router.push(`/editor/${doc.id}`);
      } else {
        alert('Failed to save MCQ exam to document editor.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error opening in editor: ' + (e?.message || 'Unknown error'));
    } finally {
      setOpeningInEditor(false);
    }
  };

  // Export Question Paper Only (Without Answers)
  const handleExportStudentPaper = () => {
    let rawPaper = `# ${sessionTitle} — Examination Paper\nDifficulty: ${difficulty} | Total Questions: ${questions.length}\n\n`;
    questions.forEach((q, idx) => {
      rawPaper += `### Question ${idx + 1}\n${q.question}\n\n`;
      (q.options || []).forEach((opt, oIdx) => {
        rawPaper += `[ ] (${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
      });
      rawPaper += '\n---\n\n';
    });

    const blob = new Blob([rawPaper], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle.replace(/\s+/g, '_')}_Student_Exam_Paper.md`;
    a.click();
  };

  // Export Master Key (With Answers & Explanations)
  const handleExportMasterKey = () => {
    let rawKey = `# ${sessionTitle} — Master Solutions & Explanations\nDifficulty: ${difficulty} | Total Questions: ${questions.length}\n\n`;
    questions.forEach((q, idx) => {
      rawKey += `### Question ${idx + 1} [${q.category}]\n${q.question}\n\n`;
      (q.options || []).forEach((opt, oIdx) => {
        const isCorrect = oIdx === (q.correctOptionIndex ?? 0);
        rawKey += `${isCorrect ? '▶ [CORRECT] ' : '  '} (${String.fromCharCode(65 + oIdx)}) ${opt}\n`;
      });
      rawKey += `\n**Explanation:** ${q.explanation || q.answer}\n\n---\n\n`;
    });

    const blob = new Blob([rawKey], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle.replace(/\s+/g, '_')}_Master_Answer_Key.md`;
    a.click();
  };

  // Scorecard Metrics
  const answeredKeys = Object.keys(userAnswers);
  const totalAnswered = answeredKeys.length;
  const correctCount = Object.values(userAnswers).filter((a) => a.isCorrect).length;
  const incorrectCount = totalAnswered - correctCount;
  const scorePercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const activeQuestion = questions[currentQuestionIndex] || null;

  // Filtered Questions for Bank View
  const filteredBankQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.options || []).some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = bankCategoryFilter === 'All' || q.category === bankCategoryFilter;
    return matchesSearch && matchesCat;
  });

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
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Feature 3 • MCQ & Technical Examination Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            MCQ Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Generate 20–50+ multiple choice questions with options A–D, detailed conceptual explanations, interactive practice test simulations, and exportable exam papers.
          </p>
        </div>

        {questions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-dark-surface p-1 rounded-2xl border border-slate-200 dark:border-dark-border text-xs font-bold shadow-sm">
              <button
                onClick={() => setViewMode('practice')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'practice'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Practice Quiz
              </button>
              <button
                onClick={() => setViewMode('bank')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'bank'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Question Bank ({questions.length})
              </button>
              <button
                onClick={() => setViewMode('scorecard')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'scorecard'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Scorecard ({correctCount}/{totalAnswered})
              </button>
            </div>

            <button
              onClick={handleOpenInDocumentEditor}
              disabled={openingInEditor}
              className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
              title="Open entire MCQ exam paper in full Word Document Editor"
            >
              {openingInEditor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>Open in Word Editor</span>
            </button>
          </div>
        )}
      </div>

      {/* Generator Configuration Panel */}
      {viewMode === 'generator' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4 gap-2">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Configure MCQ Examination</span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose a document or topic to generate up to 50 comprehensive multiple choice questions.
              </p>
            </div>

            {/* Source Mode Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
              <button
                onClick={() => setSourceType('document')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceType === 'document'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                From Saved Document
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
          {sourceType === 'document' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Source Document ({documents.length} Available)
              </label>
              {documents.length > 0 ? (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>No saved documents found in workspace.</span>
                  <button onClick={() => setSourceType('custom')} className="font-bold underline text-purple-700">
                    Switch to Custom Topic
                  </button>
                </div>
              )}
            </div>
          )}

          {sourceType === 'custom' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Preset Topics (Click to Auto-Fill):</span>
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
                  Technical Topic / Subject Title
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Distributed Consensus, Microservices, or Next.js Architecture"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Difficulty & Number of Questions Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Examination Difficulty
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DIFFICULTY_LEVELS.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      difficulty === diff
                        ? 'bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border-purple-400 dark:border-brand-lavender shadow-sm ring-2 ring-purple-400/20'
                        : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector (With Presets for >20 Questions) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Number of MCQs ({questionCount} Selected)
                </label>
                <span className="text-[11px] font-bold text-purple-700 dark:text-brand-lavender">
                  Supports up to 50+ MCQs
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {QUESTION_COUNT_PRESETS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                      questionCount === cnt
                        ? 'bg-purple-700 text-white border-purple-800 shadow-md ring-2 ring-purple-400/30'
                        : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Included Topics & Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {MCQ_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
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
          <div className="flex justify-end pt-3">
            <button
              onClick={handleGenerateMCQs}
              disabled={generating}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing {questionCount} MCQs & Answer Keys...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-purple-200" />
                  <span>Generate MCQ Exam ({questionCount} Questions)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 1. VIEW: INTERACTIVE MCQ PRACTICE & QUIZ SIMULATOR */}
      {viewMode === 'practice' && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
          {/* Left: Question Navigation Drawer (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Questions ({questions.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Answered: {totalAnswered} / {questions.length}
                  </p>
                </div>

                <button
                  onClick={() => setViewMode('generator')}
                  className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                >
                  New Test
                </button>
              </div>

              {/* Score Progress Pill */}
              <div className="p-3 bg-purple-50 dark:bg-brand-amethyst/30 border border-purple-200 dark:border-brand-lavender/30 rounded-2xl flex items-center justify-between text-xs font-bold">
                <span className="text-purple-900 dark:text-brand-lavender">Current Accuracy:</span>
                <span className="text-purple-700 dark:text-brand-lavender font-mono text-sm">
                  {correctCount} / {totalAnswered} ({scorePercent}%)
                </span>
              </div>

              {/* Question Selection Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const answered = userAnswers[idx];

                  let buttonStyle = 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-100';
                  if (answered) {
                    buttonStyle = answered.isCorrect
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-400';
                  }
                  if (isCurrent) {
                    buttonStyle += ' ring-2 ring-purple-600 dark:ring-brand-lavender font-black';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        const existing = userAnswers[idx];
                        setSelectedOption(existing !== undefined ? existing.selectedOption : null);
                        setShowExplanation(existing !== undefined);
                      }}
                      className={`h-10 rounded-xl border text-xs font-mono font-bold flex items-center justify-center transition-all ${buttonStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                <button
                  onClick={() => setViewMode('bank')}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-purple-700"
                >
                  View Full Paper
                </button>
                <button
                  onClick={() => setViewMode('scorecard')}
                  className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
                >
                  End & Finish Exam
                </button>
              </div>
            </div>
          </div>

          {/* Right: Active MCQ Card & Interactive Choices (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Question Header Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst px-3 py-1 rounded-lg">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {activeQuestion.category} • {activeQuestion.difficulty}
                    </span>
                  </div>

                  <button
                    onClick={() => speakQuestion(activeQuestion.question)}
                    className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-dark-hover rounded-xl transition-all"
                    title="Read Question Aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
                  {activeQuestion.question}
                </h3>
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-3">
                {(activeQuestion.options || []).map((optText, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = selectedOption === optIdx;
                  const isCorrect = optIdx === (activeQuestion.correctOptionIndex ?? 0);

                  let cardStyle = 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 text-slate-800 dark:text-slate-200 hover:border-purple-400 hover:bg-purple-50/40 dark:hover:bg-dark-hover';

                  if (showExplanation) {
                    if (isCorrect) {
                      cardStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                    } else if (isSelected && !isCorrect) {
                      cardStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20';
                    }
                  } else if (isSelected) {
                    cardStyle = 'bg-purple-100 dark:bg-brand-amethyst border-purple-600 text-purple-900 dark:text-brand-lavender ring-2 ring-purple-600/30 font-bold';
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${cardStyle}`}
                    >
                      <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-xs border border-current">
                        {letter}
                      </span>
                      <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                        {optText}
                      </div>
                      {showExplanation && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {showExplanation && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Conceptual Explanation Box */}
              {showExplanation && (
                <div className="p-5 rounded-2xl border border-purple-200 dark:border-brand-lavender/30 bg-purple-50/60 dark:bg-brand-amethyst/30 space-y-2 animate-scale-in">
                  <div className="flex items-center space-x-2 text-purple-900 dark:text-brand-lavender font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                    <span>
                      Concept & Answer Explanation (Option{' '}
                      {String.fromCharCode(65 + (activeQuestion.correctOptionIndex ?? 0))})
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {activeQuestion.explanation || activeQuestion.answer}
                  </p>
                </div>
              )}

              {/* Bottom Nav Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleNextQuestion}
                    className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <span>
                      {currentQuestionIndex === questions.length - 1
                        ? 'Finish & View Scorecard'
                        : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW: COMPLETE QUESTION BANK & PRINTABLE EXAM PAPER */}
      {viewMode === 'bank' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-scale-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-dark-border pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Complete Question Bank ({questions.length} Questions)
              </h3>
              <p className="text-xs text-slate-500">
                Full list of multiple choice questions with searchable topics, explanations, and export options.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportStudentPaper}
                className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-dark-border transition-all"
                title="Download Exam Paper without answers"
              >
                <Download className="w-3.5 h-3.5 text-purple-500" />
                <span>Student Paper (.MD)</span>
              </button>

              <button
                onClick={handleExportMasterKey}
                className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-dark-border transition-all"
                title="Download Master Solutions with explanations"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Master Solutions (.MD)</span>
              </button>

              <button
                onClick={() => setShowAllBankAnswers(!showAllBankAnswers)}
                className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender px-3 py-2 rounded-xl text-xs font-bold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showAllBankAnswers ? 'Hide Answers' : 'Show All Answers'}</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 shrink-0">Category:</span>
              {['All', ...MCQ_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBankCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                    bankCategoryFilter === cat
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Stream */}
          <div className="space-y-4">
            {filteredBankQuestions.map((q, idx) => {
              const correctIdx = q.correctOptionIndex ?? 0;

              return (
                <div
                  key={q.id || idx}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst px-2.5 py-0.5 rounded-md">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {q.category}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase bg-slate-200 dark:bg-dark-border text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {q.difficulty}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed">
                    {q.question}
                  </h4>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(q.options || []).map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isCorrect = oIdx === correctIdx;

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                            showAllBankAnswers && isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-mono font-bold text-purple-700 dark:text-brand-lavender">
                            ({letter})
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                          {showAllBankAnswers && isCorrect && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible / Always-shown Explanation */}
                  {showAllBankAnswers && (
                    <div className="p-3.5 bg-purple-50/70 dark:bg-brand-amethyst/30 border border-purple-200 dark:border-brand-lavender/30 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-purple-900 dark:text-brand-lavender block">
                        Explanation (Correct: Option {String.fromCharCode(65 + correctIdx)}):
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {q.explanation || q.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VIEW: FINAL EXAM SCORECARD & ANALYTICS */}
      {viewMode === 'scorecard' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-8 shadow-sm space-y-8 animate-scale-in max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-black text-3xl text-slate-900 dark:text-white">
              Examination Performance Scorecard
            </h2>
            <p className="text-xs text-slate-500">
              Completed {totalAnswered} of {questions.length} questions in {sessionTitle}
            </p>
          </div>

          {/* Aggregate Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-dark-bg/60 rounded-2xl border border-slate-200 dark:border-dark-border space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accuracy Score</span>
              <div className="font-display font-black text-4xl text-purple-700 dark:text-brand-lavender">
                {scorePercent}%
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {scorePercent >= 80 ? 'Mastery Level' : scorePercent >= 60 ? 'Passing Grade' : 'Needs Review'}
              </span>
            </div>

            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Correct Answers</span>
              <div className="font-display font-black text-4xl text-emerald-700 dark:text-emerald-400">
                {correctCount}
              </div>
              <span className="text-[11px] text-emerald-600">Points earned</span>
            </div>

            <div className="p-5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/40 space-y-1">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Incorrect Answers</span>
              <div className="font-display font-black text-4xl text-rose-700 dark:text-rose-400">
                {incorrectCount}
              </div>
              <span className="text-[11px] text-rose-600">Review recommended</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setViewMode('practice');
                setCurrentQuestionIndex(0);
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
            >
              Review Practice Questions
            </button>

            <button
              onClick={handleOpenInDocumentEditor}
              disabled={openingInEditor}
              className="bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-border font-bold text-xs px-6 py-3 rounded-xl transition-all"
            >
              Open in Word Editor
            </button>

            <button
              onClick={() => {
                setViewMode('generator');
                setUserAnswers({});
              }}
              className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 font-bold text-xs px-6 py-3 rounded-xl transition-all"
            >
              Start Fresh Session
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
          <span>Loading MCQ Studio...</span>
        </div>
      }
    >
      <VivaStudioContent />
    </React.Suspense>
  );
}
