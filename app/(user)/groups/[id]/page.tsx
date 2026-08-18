'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Copy,
  Check,
  Plus,
  Upload,
  FileText,
  Download,
  Trash2,
  Share2,
  Shield,
  GraduationCap,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Eye,
  FileUp,
  Loader2,
  X,
  UserX,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  HelpCircle,
  Award,
  BarChart3,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Brain,
  TrendingUp,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  GroupItem,
  GroupMemberItem,
  GroupDocumentItem,
  DocumentItem,
  McqTestItem,
  McqQuestionItem,
  McqAttemptItem,
  McqResultAnalytics,
} from '@/lib/types';

import KnowledgeHubTab from '@/components/classroom/KnowledgeHubTab';
import AssignmentsTab from '@/components/classroom/AssignmentsTab';
import FacultyIntelligenceTab from '@/components/classroom/FacultyIntelligenceTab';
import MyPerformanceTab from '@/components/classroom/MyPerformanceTab';

type ClassroomTab =
  | 'overview'
  | 'knowledge-hub'
  | 'assignments'
  | 'mcq-tests'
  | 'my-performance'
  | 'intelligence'
  | 'members';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;

  const [group, setGroup] = useState<GroupItem | null>(null);
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [documents, setDocuments] = useState<GroupDocumentItem[]>([]);
  const [mcqTests, setMcqTests] = useState<McqTestItem[]>([]);
  const [myRole, setMyRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ClassroomTab>('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<GroupDocumentItem | null>(null);

  // -------------------------------------------------------------
  // MCQ TEST STATE & MODALS
  // -------------------------------------------------------------
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDuration, setTestDuration] = useState(20);
  const [testPassingMarks, setTestPassingMarks] = useState(4);
  const [isAdaptiveTest, setIsAdaptiveTest] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const [questionsList, setQuestionsList] = useState<
    Array<{
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: 'A' | 'B' | 'C' | 'D';
      marks: number;
      topic: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    }>
  >([
    {
      question: 'What is the primary characteristic of cloud computing elasticity?',
      optionA: 'Fixed compute capacity',
      optionB: 'Dynamically allocating and releasing compute resources on demand',
      optionC: 'Permanent storage encryption',
      optionD: 'Physical datacenter isolation',
      correctOption: 'B',
      marks: 1,
      topic: 'Cloud Computing',
      difficulty: 'MEDIUM',
    },
    {
      question: 'Which HTTP method is idempotent and used for replacing resources?',
      optionA: 'POST',
      optionB: 'PUT',
      optionC: 'PATCH',
      optionD: 'CONNECT',
      correctOption: 'B',
      marks: 1,
      topic: 'Web Architecture',
      difficulty: 'EASY',
    },
  ]);

  // Faculty Results Modal
  const [analyticsTest, setAnalyticsTest] = useState<McqTestItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // AI MCQ Auto-Generation State (Supports 1 to 50 questions)
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiDifficulty, setAiDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'mixed'>('intermediate');
  const [generatingAiQuestions, setGeneratingAiQuestions] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchMcqTests();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load classroom');
        return;
      }

      setGroup(data.group);
      setMembers(data.members || []);
      setDocuments(data.documents || []);
      setMyRole(data.myRole || 'MEMBER');
    } catch (e: any) {
      setError(e?.message || 'Network error loading classroom');
    } finally {
      setLoading(false);
    }
  };

  const fetchMcqTests = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/tests`);
      if (res.ok) {
        const data = await res.json();
        setMcqTests(data.tests || []);
      }
    } catch (e) {
      console.error('Fetch tests error:', e);
    }
  };

  const handleCopyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyInviteLink = () => {
    if (!group) return;
    const url = `${window.location.origin}/groups/join?code=${group.joinCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this student from the classroom?')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (e) {
      alert('Network error removing member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this classroom?')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/groups');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave group');
      }
    } catch (e) {
      alert('Network error leaving group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to permanently DELETE this classroom? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/groups');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete group');
      }
    } catch (e) {
      alert('Network error deleting group');
    }
  };

  // -------------------------------------------------------------
  // MCQ HANDLERS
  // -------------------------------------------------------------
  const handleAddQuestion = () => {
    setQuestionsList((prev) => [
      ...prev,
      {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        marks: 1,
        topic: 'General',
        difficulty: 'MEDIUM',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questionsList.length <= 1) {
      alert('Tests must have at least 1 question.');
      return;
    }
    setQuestionsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionFieldChange = (idx: number, field: string, value: any) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleGenerateAiQuestions = async () => {
    if (!testTitle.trim()) {
      setTestError('Please enter a Test Title or Topic first to generate questions.');
      return;
    }

    try {
      setGeneratingAiQuestions(true);
      setTestError(null);
      setAiSuccessMessage(null);

      const res = await fetch(`/api/groups/${groupId}/tests/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: testTitle.trim(),
          count: Number(aiQuestionCount) || 10,
          difficulty: aiDifficulty,
          instructions: testDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestError(data.error || 'Failed to generate questions with AI');
        return;
      }

      if (data.questions && data.questions.length > 0) {
        const enriched = data.questions.map((q: any) => ({
          ...q,
          topic: testTitle.trim(),
          difficulty: aiDifficulty === 'mixed' ? 'MEDIUM' : aiDifficulty === 'beginner' ? 'EASY' : aiDifficulty === 'advanced' ? 'HARD' : 'MEDIUM',
        }));
        setQuestionsList(enriched);
        const newDuration = Math.max(10, Math.ceil(data.questions.length * 1.5));
        setTestDuration(newDuration);
        setTestPassingMarks(Math.ceil(data.questions.length * 0.4));
        setAiSuccessMessage(`✨ Successfully generated ${data.questions.length} questions for "${testTitle}"!`);
        setTimeout(() => setAiSuccessMessage(null), 5000);
      }
    } catch (e: any) {
      setTestError(e?.message || 'Network error generating questions with AI');
    } finally {
      setGeneratingAiQuestions(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) {
      setTestError('Please enter a test title');
      return;
    }

    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        setTestError(`Please fill in all options for Question ${i + 1}`);
        return;
      }
    }

    try {
      setCreatingTest(true);
      setTestError(null);

      const res = await fetch(`/api/groups/${groupId}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testTitle.trim(),
          description: testDescription.trim() || undefined,
          duration: Number(testDuration) || 20,
          passingMarks: Number(testPassingMarks) || 4,
          isAdaptive: isAdaptiveTest,
          questions: questionsList,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestError(data.error || 'Failed to create test');
        return;
      }

      setShowCreateTestModal(false);
      setTestTitle('');
      setTestDescription('');
      fetchMcqTests();
    } catch (e: any) {
      setTestError(e?.message || 'Network error creating test');
    } finally {
      setCreatingTest(false);
    }
  };

  const handleDeleteTest = async (testId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the MCQ test "${title}"?`)) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/tests/${testId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMcqTests((prev) => prev.filter((t) => t.id !== testId));
      } else {
        alert('Failed to delete test');
      }
    } catch (e) {
      alert('Network error deleting test');
    }
  };

  const openTestAnalytics = async (testItem: McqTestItem) => {
    setAnalyticsTest(testItem);
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/tests/${testItem.id}/results`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-brand-lavender" />
          <p className="text-sm font-semibold text-slate-500">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
          Classroom Not Accessible
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {error || 'The requested classroom could not be found or you do not have permission.'}
        </p>
        <Link
          href="/groups"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Classrooms</span>
        </Link>
      </div>
    );
  }

  const isAdmin = myRole === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. TOP BREADCRUMB & CLASSROOM BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/groups"
            className="p-2.5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white hover:border-purple-300 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800">
                {isAdmin ? 'Teacher / Instructor View' : 'Student Classroom View'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Instructor: {group.creator?.name || 'Classroom Faculty'}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
              {group.name}
            </h1>
          </div>
        </div>

        {/* Join Code & Quick Actions */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-mono font-bold text-purple-800 dark:text-brand-lavender">
            <span>Code: {group.joinCode}</span>
            <button onClick={handleCopyCode} title="Copy Join Code" className="hover:text-purple-600">
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={handleCopyInviteLink}
            className="p-2 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:border-purple-300 transition-all text-xs font-bold flex items-center space-x-1 shadow-xs"
            title="Copy Invite Link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Invite'}</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleDeleteGroup}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-all"
              title="Delete Classroom"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleLeaveGroup}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-hover transition-all text-xs font-bold flex items-center space-x-1"
              title="Leave Classroom"
            >
              <UserX className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-dark-border overflow-x-auto no-scrollbar pt-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge-hub')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'knowledge-hub'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Knowledge Hub (RAG & Study Tools)</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'assignments'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assignments & Auto-Review</span>
        </button>

        <button
          onClick={() => setActiveTab('mcq-tests')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'mcq-tests'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>MCQ Examination Tests ({mcqTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-performance')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'my-performance'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>My Performance & Recommendations</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'intelligence'
                ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Faculty Intelligence Dashboard</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'members'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Classroom Members ({members.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-slate-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-dark-surface shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-purple-700 dark:text-brand-lavender">
                  Smart Classroom Overview
                </span>
                <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                  Welcome to {group.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {group.description || 'Welcome to your interactive Smart Classroom for curriculum materials, automated assignment reviews, and adaptive MCQ tests.'}
                </p>
              </div>

              {/* Instructor Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border flex items-center space-x-3 shadow-xs shrink-0">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black text-sm flex items-center justify-center">
                  {group.creator?.name ? group.creator.name[0].toUpperCase() : 'T'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Classroom Instructor</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {group.creator?.name || 'Instructor'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">{group.creator?.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Modules Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div
                onClick={() => setActiveTab('knowledge-hub')}
                className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-purple-400 transition-all cursor-pointer space-y-2 shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                    <Brain className="w-5 h-5" />
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Knowledge Hub
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Subject & unit notes, RAG Q&A, and 8 instant study actions.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('assignments')}
                className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-indigo-400 transition-all cursor-pointer space-y-2 shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    <FileText className="w-5 h-5" />
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Assignments
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submit reports and get live automated structural checks.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('mcq-tests')}
                className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-purple-400 transition-all cursor-pointer space-y-2 shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                    <HelpCircle className="w-5 h-5" />
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  MCQ Tests
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Take normal and adaptive timed quizzes with instant grading.
                </p>
              </div>

              <div
                onClick={() => setActiveTab(isAdmin ? 'intelligence' : 'my-performance')}
                className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-emerald-400 transition-all cursor-pointer space-y-2 shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  {isAdmin ? 'Faculty Intelligence' : 'My Performance'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAdmin
                    ? 'Class performance metrics, topic trends, and insights.'
                    : 'Personalized diagnostics and study recommendations.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: KNOWLEDGE HUB */}
      {activeTab === 'knowledge-hub' && (
        <KnowledgeHubTab groupId={groupId} classroomName={group.name} isAdmin={isAdmin} />
      )}

      {/* TAB: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <AssignmentsTab groupId={groupId} classroomName={group.name} isAdmin={isAdmin} />
      )}

      {/* TAB: MCQ TESTS */}
      {activeTab === 'mcq-tests' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Classroom MCQ Examination Tests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timed quizzes, normal tests, and adaptive assessments with automatic grading
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setTestTitle('');
                  setTestDescription('');
                  setTestError(null);
                  setIsAdaptiveTest(false);
                  setShowCreateTestModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create MCQ Test</span>
              </button>
            )}
          </div>

          {mcqTests.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-brand-lavender flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  No MCQ Tests Scheduled Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAdmin
                    ? 'Create your first MCQ quiz with custom questions, marks, and timer.'
                    : 'Your instructor has not published any tests yet.'}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateTestModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Test</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mcqTests.map((t) => {
                const isCompleted = !!t.myAttempt;
                const myScore = t.myAttempt?.score;
                const myPercentage = t.myAttempt?.percentage;
                const passed = t.myAttempt?.passed;

                return (
                  <div
                    key={t.id}
                    className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-400 dark:hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800">
                            <Clock className="w-3 h-3" />
                            <span>{t.duration} Mins</span>
                          </span>
                          {t.isAdaptive && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Adaptive
                            </span>
                          )}
                        </div>

                        {isCompleted ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              passed
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {passed ? 'PASSED' : 'COMPLETED'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                            AVAILABLE
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {/* Score Info */}
                      {isCompleted ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-center space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Your Exam Score</span>
                          <p className="text-base font-black text-purple-700 dark:text-brand-lavender">
                            {myScore} / {t.totalMarks} Marks ({myPercentage}%)
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                          <div className="flex items-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                            <span>{t.questionCount || 0} Questions</span>
                          </div>
                          <div>
                            <span>Total: {t.totalMarks} Marks</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between gap-2">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => openTestAnalytics(t)}
                            className="flex-1 py-2 px-3 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender text-xs font-bold flex items-center justify-center space-x-1.5 hover:bg-purple-200 transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Results ({t.attemptCount || 0})</span>
                          </button>

                          <button
                            onClick={() => handleDeleteTest(t.id, t.title)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                            title="Delete MCQ Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/groups/${groupId}/tests/${t.id}`}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all ${
                            isCompleted
                              ? 'bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-purple-700 dark:text-brand-lavender hover:bg-purple-50'
                              : 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white hover:shadow-md'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>View My Result & Solutions</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Start MCQ Test</span>
                            </>
                          )}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MY PERFORMANCE */}
      {activeTab === 'my-performance' && (
        <MyPerformanceTab
          groupId={groupId}
          classroomName={group.name}
          onNavigateToKnowledgeHub={(action, query) => setActiveTab('knowledge-hub')}
        />
      )}

      {/* TAB: FACULTY INTELLIGENCE (FACULTY ONLY) */}
      {activeTab === 'intelligence' && isAdmin && (
        <FacultyIntelligenceTab groupId={groupId} classroomName={group.name} />
      )}

      {/* TAB: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Classroom Enrolled Roster ({members.length} Members)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'All students currently logged in and enrolled in this classroom.'
                  : 'Classroom instructor and enrolled classmates.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">Join Code:</span>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender flex items-center space-x-1"
                title="Click to copy join code"
              >
                <span>{group.joinCode}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border overflow-hidden">
            {members.map((mem) => {
              const isGroupAdmin = mem.role === 'ADMIN' || mem.userId === group.createdBy;
              const formattedDate = new Date(mem.joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const memberName =
                mem.user?.name ||
                (isGroupAdmin
                  ? group.creator?.name || 'Instructor'
                  : mem.user?.email
                  ? mem.user.email.split('@')[0]
                  : 'Enrolled Student');
              const memberEmail =
                mem.user?.email || (isGroupAdmin ? group.creator?.email || '' : '');
              const memberInitial = memberName ? memberName[0].toUpperCase() : (isGroupAdmin ? 'T' : 'S');

              return (
                <div
                  key={mem.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-dark-surface/40 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border shadow-sm ${
                        isGroupAdmin
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border-purple-200 dark:border-purple-800'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {memberInitial}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {memberName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isGroupAdmin
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isGroupAdmin ? 'Teacher / Admin' : '🟢 Enrolled Student'}
                        </span>
                      </div>
                      {memberEmail && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                          {memberEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Joined {formattedDate}
                    </span>

                    {isAdmin && !isGroupAdmin && (
                      <button
                        onClick={() => handleRemoveMember(mem.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Remove student from classroom"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CREATE MCQ TEST MODAL */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowCreateTestModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                Create Classroom MCQ Examination Test
              </h3>
              <p className="text-xs text-slate-500">
                Configure quiz timing, adaptive mode, questions with topic tags, and scoring criteria.
              </p>
            </div>

            {testError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-semibold">
                {testError}
              </div>
            )}

            {/* AI Generation Box */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender animate-pulse" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    AI Question Generator
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Question Count
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface font-semibold"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={30}>30 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface font-semibold"
                  >
                    <option value="beginner">Beginner / Easy</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced / Hard</option>
                    <option value="mixed">Mixed Difficulty</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateAiQuestions}
                    disabled={generatingAiQuestions}
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 disabled:opacity-50 flex items-center justify-center space-x-1 shadow-sm"
                  >
                    {generatingAiQuestions ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {aiSuccessMessage && (
                <p className="text-xs text-emerald-600 font-bold">{aiSuccessMessage}</p>
              )}
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Unit 1 Quiz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Topic Notes
                </label>
                <textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  rows={2}
                  placeholder="Instructions for students..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value, 10) || 20)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={testPassingMarks}
                    onChange={(e) => setTestPassingMarks(parseInt(e.target.value, 10) || 4)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="adaptiveCheck"
                    checked={isAdaptiveTest}
                    onChange={(e) => setIsAdaptiveTest(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="adaptiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    ⚡ Adaptive Test Mode
                  </label>
                </div>
              </div>

              {/* Questions List Editor */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Questions ({questionsList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questionsList.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender">
                          Question {idx + 1}
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={q.topic}
                            onChange={(e) => handleQuestionFieldChange(idx, 'topic', e.target.value)}
                            placeholder="Topic"
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-dark-border text-[11px] font-semibold w-28 bg-white dark:bg-dark-surface"
                          />
                          <select
                            value={q.difficulty}
                            onChange={(e) => handleQuestionFieldChange(idx, 'difficulty', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-dark-border text-[11px] font-semibold bg-white dark:bg-dark-surface"
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionFieldChange(idx, 'question', e.target.value)}
                        placeholder="Question prompt..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs font-semibold"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={q.optionA}
                          onChange={(e) => handleQuestionFieldChange(idx, 'optionA', e.target.value)}
                          placeholder="Option A"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs"
                        />
                        <input
                          type="text"
                          value={q.optionB}
                          onChange={(e) => handleQuestionFieldChange(idx, 'optionB', e.target.value)}
                          placeholder="Option B"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs"
                        />
                        <input
                          type="text"
                          value={q.optionC}
                          onChange={(e) => handleQuestionFieldChange(idx, 'optionC', e.target.value)}
                          placeholder="Option C"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs"
                        />
                        <input
                          type="text"
                          value={q.optionD}
                          onChange={(e) => handleQuestionFieldChange(idx, 'optionD', e.target.value)}
                          placeholder="Option D"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-1 text-xs">
                        <span className="font-bold text-slate-500">Correct:</span>
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleQuestionFieldChange(idx, 'correctOption', opt)}
                            className={`w-7 h-7 rounded-lg font-bold transition-all ${
                              q.correctOption === opt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTest}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-md hover:bg-purple-800 disabled:opacity-50 flex items-center space-x-2"
                >
                  {creatingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publish Examination Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. FACULTY RESULTS MODAL */}
      {analyticsTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAnalyticsTest(null)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                Exam Evaluation Analytics
              </span>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                {analyticsTest.title}
              </h3>
            </div>

            {loadingAnalytics ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-xs">Computing student scores and class averages...</p>
              </div>
            ) : analyticsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                    <span className="text-slate-400 block font-bold">Total Attempts</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {analyticsData.attempts?.length || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                    <span className="text-slate-400 block font-bold">Class Average</span>
                    <span className="text-lg font-black text-purple-600">
                      {analyticsData.classAverage || 0}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border">
                    <span className="text-slate-400 block font-bold">Pass Rate</span>
                    <span className="text-lg font-black text-emerald-600">
                      {analyticsData.passRate || 0}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Student Submissions
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-dark-border/60 border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden text-xs">
                    {analyticsData.attempts?.map((att: any) => (
                      <div key={att.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {att.user?.name || (att.user?.email ? att.user.email.split('@')[0] : 'Student')}
                          </div>
                          <div className="text-[11px] text-slate-400">{att.user?.email}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-purple-700 dark:text-brand-lavender">
                            {att.score} / {att.totalMarks} ({att.percentage}%)
                          </span>
                          <span
                            className={`block text-[10px] font-extrabold uppercase ${
                              att.passed ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {att.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
