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

  // Active Tab: 'documents' | 'mcq-tests' | 'members'
  const [activeTab, setActiveTab] = useState<'documents' | 'mcq-tests' | 'members'>('documents');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Document Upload / Share Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSource, setUploadSource] = useState<'file' | 'library'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Library Documents for Attach
  const [myLibraryDocs, setMyLibraryDocs] = useState<DocumentItem[]>([]);
  const [selectedLibraryDocId, setSelectedLibraryDocId] = useState<string>('');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<GroupDocumentItem | null>(null);

  // Search & Filter
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'teacher' | 'student'>('all');

  // -------------------------------------------------------------
  // MCQ TEST STATE & MODALS
  // -------------------------------------------------------------
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testDuration, setTestDuration] = useState(20);
  const [testPassingMarks, setTestPassingMarks] = useState(4);
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
    },
    {
      question: 'Which HTTP method is idempotent and used for replacing resources?',
      optionA: 'POST',
      optionB: 'PUT',
      optionC: 'PATCH',
      optionD: 'CONNECT',
      correctOption: 'B',
      marks: 1,
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

  const fetchMyLibraryDocs = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setMyLibraryDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (!group) return;
    const url = `${window.location.origin}/groups?join=${group.joinCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setUploadError('Please enter a title for the document');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      if (uploadSource === 'file') {
        if (!selectedFile) {
          setUploadError('Please select a file to upload');
          return;
        }

        const formData = new FormData();
        formData.append('title', docTitle.trim());
        formData.append('file', selectedFile);

        const res = await fetch(`/api/groups/${groupId}/documents`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
      } else {
        // From Library
        if (!selectedLibraryDocId) {
          setUploadError('Please select a document from your library');
          return;
        }

        const libDoc = myLibraryDocs.find((d) => d.id === selectedLibraryDocId);
        if (!libDoc) {
          setUploadError('Selected document not found');
          return;
        }

        const res = await fetch(`/api/groups/${groupId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: docTitle.trim(),
            fileName: `${libDoc.title}.md`,
            content: libDoc.content,
            fileType: 'document',
            documentId: libDoc.id,
            fileSize: new Blob([libDoc.content || '']).size,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sharing failed');
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setDocTitle('');
      setSelectedLibraryDocId('');
      fetchGroupDetails();
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete document');
      }
    } catch (e) {
      alert('Network error deleting document');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this group?`)) return;

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
    if (!confirm('Are you sure you want to leave this group?')) return;

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
    if (!confirm('Are you sure you want to permanently DELETE this group? This cannot be undone.')) return;

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
        setQuestionsList(data.questions);
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

    // Validate questions
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
    if (!confirm(`Are you sure you want to delete the test "${title}"?`)) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/tests/${testId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMcqTests((prev) => prev.filter((t) => t.id !== testId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete test');
      }
    } catch (e) {
      alert('Network error deleting test');
    }
  };

  const openTestAnalytics = async (testItem: McqTestItem) => {
    try {
      setAnalyticsTest(testItem);
      setLoadingAnalytics(true);
      setAnalyticsData(null);

      const res = await fetch(`/api/groups/${groupId}/tests/${testItem.id}/results`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to load class analytics');
      }
    } catch (e) {
      alert('Network error fetching analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const downloadGroupDocument = (doc: GroupDocumentItem) => {
    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.title}.${doc.fileType === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (doc.content) {
      const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName.endsWith('.md') || doc.fileName.endsWith('.txt') ? doc.fileName : `${doc.fileName}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    alert('Document content is being processed.');
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return 'Document';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'docx':
      case 'doc':
        return <FileCheck2 className="w-5 h-5 text-blue-500" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'code':
      case 'json':
        return <FileCode className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-purple-500" />;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      (doc.uploader?.name && doc.uploader.name.toLowerCase().includes(searchDocQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (docFilter === 'teacher') return doc.uploadedBy === group?.createdBy;
    if (docFilter === 'student') return doc.uploadedBy !== group?.createdBy;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-brand-lavender animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Opening classroom...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="glass-card p-10 text-center rounded-3xl border border-slate-200 dark:border-dark-border max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
          Classroom Access Error
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error || 'Classroom not found or you do not have permission to view it.'}
        </p>
        <Link
          href="/groups"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Groups</span>
        </Link>
      </div>
    );
  }

  const isAdmin = myRole === 'ADMIN';

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* 1. TOP NAV & BREADCRUMB */}
      <div className="flex items-center justify-between">
        <Link
          href="/groups"
          className="inline-flex items-center space-x-2 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Classrooms</span>
        </Link>

        {/* Group Controls */}
        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <button
              onClick={handleDeleteGroup}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
            >
              Delete Group
            </button>
          ) : (
            <button
              onClick={handleLeaveGroup}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover text-xs font-bold transition-all"
            >
              Leave Classroom
            </button>
          )}
        </div>
      </div>

      {/* 2. CLASSROOM HERO BANNER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border relative overflow-hidden bg-gradient-to-tr from-purple-900/10 via-indigo-900/5 to-slate-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-dark-surface shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                <span>{isAdmin ? 'Teacher / Administrator' : 'Enrolled Student'}</span>
              </span>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Created by {group.creator?.name || 'Instructor'}
              </span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight">
              {group.name}
            </h1>

            {group.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {group.description}
              </p>
            )}
          </div>

          {/* Join Code Card & Share Button */}
          <div className="p-4 sm:p-5 bg-white/80 dark:bg-dark-surface/90 border border-slate-200 dark:border-dark-border rounded-2xl flex flex-col space-y-3 shadow-md shrink-0 lg:w-72 backdrop-blur-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-brand-lavender block">
                Classroom Join Code
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xl font-black text-purple-900 dark:text-white tracking-widest">
                  {group.joinCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Copy Join Code"
                  className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleCopyShareLink}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-dark-border">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'documents'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Shared Documents & Assignments ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mcq-tests')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'mcq-tests'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>MCQ Examination Tests ({mcqTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'members'
              ? 'border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Classroom Members ({members.length})</span>
        </button>
      </div>

      {/* 4. TAB 1: SHARED DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Student Privacy Notice Banner */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center space-x-3 text-xs text-purple-900 dark:text-purple-200">
              <Shield className="w-5 h-5 text-purple-600 dark:text-brand-lavender shrink-0" />
              <span>
                <strong>Submission Privacy:</strong> Course materials from your teacher are visible to all students. Any documents you submit are <strong>private</strong> and only visible to your instructor.
              </span>
            </div>
          )}

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setDocFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docFilter === 'all'
                    ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Files ({documents.length})
              </button>
              <button
                onClick={() => setDocFilter('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docFilter === 'teacher'
                    ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Teacher Notes ({documents.filter((d) => d.uploadedBy === group.createdBy).length})
              </button>
              <button
                onClick={() => setDocFilter('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docFilter === 'student'
                    ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isAdmin
                  ? `Student Submissions (${documents.filter((d) => d.uploadedBy !== group.createdBy).length})`
                  : `My Submissions (${documents.filter((d) => d.uploadedBy !== group.createdBy).length})`}
              </button>
            </div>

            {/* Right Action: Search & Upload Button */}
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => {
                  setDocTitle('');
                  setSelectedFile(null);
                  setSelectedLibraryDocId('');
                  setUploadError(null);
                  fetchMyLibraryDocs();
                  setShowUploadModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>{isAdmin ? 'Upload Material' : 'Submit Document to Teacher'}</span>
              </button>
            </div>
          </div>

          {/* Documents Grid / Table */}
          {filteredDocs.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-brand-lavender flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  {searchDocQuery ? 'No documents matched your search' : 'No documents shared yet'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAdmin
                    ? 'Upload study materials, lecture slides, or view student assignment submissions.'
                    : 'Submit your homework, assignments, or view teacher lecture materials.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setDocTitle('');
                  setSelectedFile(null);
                  setSelectedLibraryDocId('');
                  setUploadError(null);
                  fetchMyLibraryDocs();
                  setShowUploadModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs inline-flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isAdmin ? 'Upload Study Material' : 'Submit Assignment'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDocs.map((doc) => {
                const isTeacherUpload = doc.uploadedBy === group.createdBy;
                const formattedDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={doc.id}
                    className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                      isTeacherUpload
                        ? 'border-slate-200 dark:border-dark-border hover:border-purple-400'
                        : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 hover:border-indigo-400'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border">
                            {getFileTypeIcon(doc.fileType)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400">
                              {doc.fileType}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                        </div>

                        {/* Role & Visibility Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isTeacherUpload
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {isTeacherUpload ? '📘 Course Material' : isAdmin ? '📥 Student Submission' : '🔒 My Private Submission'}
                        </span>
                      </div>

                      {/* Title & File Name */}
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono line-clamp-1 mt-0.5">
                          {doc.fileName}
                        </p>
                      </div>

                      {/* Submitter Info Card */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border flex items-center space-x-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                            isTeacherUpload
                              ? 'bg-purple-700 dark:bg-brand-purple'
                              : 'bg-indigo-600 dark:bg-indigo-700'
                          }`}
                        >
                          {doc.uploader?.name ? doc.uploader.name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="truncate text-xs">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {doc.uploader?.name || 'Student Submitter'}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {doc.uploader?.email || 'email'} • {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-border/60">
                      <div className="flex items-center space-x-2">
                        {doc.content && (
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors text-xs font-bold flex items-center space-x-1"
                            title="Preview Document Content"
                          >
                            <Eye className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                            <span>Preview</span>
                          </button>
                        )}

                        <button
                          onClick={() => downloadGroupDocument(doc)}
                          className="p-2 rounded-xl text-purple-700 dark:text-brand-lavender hover:bg-purple-50 dark:hover:bg-dark-hover transition-colors text-xs font-bold flex items-center space-x-1"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>

                      {/* Delete Option */}
                      {(isAdmin || doc.uploadedBy === group.createdBy) && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.title)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: MCQ TESTS MODULE */}
      {activeTab === 'mcq-tests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Classroom MCQ Examination Tests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timed online quizzes, practice tests, and scored academic evaluations
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setTestTitle('');
                  setTestDescription('');
                  setTestError(null);
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
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800">
                          <Clock className="w-3 h-3" />
                          <span>{t.duration} Minutes</span>
                        </span>

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

                      {/* Score or Specs Info */}
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

      {/* 6. TAB 3: MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="space-y-6">
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
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
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

              // Calculate student submissions count
              const studentSubmissionsCount = documents.filter((d) => d.uploadedBy === mem.userId).length;
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

                  <div className="flex items-center space-x-4">
                    {!isGroupAdmin && (
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border hidden sm:inline-block">
                        📄 {studentSubmissionsCount} {studentSubmissionsCount === 1 ? 'Submission' : 'Submissions'}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 hidden md:inline-block font-medium">
                      Enrolled {formattedDate}
                    </span>

                    {isAdmin && mem.userId !== group.createdBy && (
                      <button
                        onClick={() => handleRemoveMember(mem.id, mem.user?.name || 'this student')}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

      {/* 7. UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleUploadDocument} className="space-y-5">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Share Document with Classroom
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a file or share an existing document from your StudentDoc library.
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {/* Source Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setUploadSource('file')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    uploadSource === 'file'
                      ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Upload File from Computer
                </button>
                <button
                  type="button"
                  onClick={() => setUploadSource('library')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    uploadSource === 'library'
                      ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Share from StudentDoc Library
                </button>
              </div>

              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Cloud Architecture Lecture Notes"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {uploadSource === 'file' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select File (PDF, DOCX, TXT, MD, etc.) *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-dark-border hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50 dark:bg-dark-bg/50">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setSelectedFile(f);
                          if (!docTitle) setDocTitle(f.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileUp className="w-8 h-8 text-purple-600 dark:text-brand-lavender mx-auto mb-2" />
                    {selectedFile ? (
                      <p className="text-xs font-bold text-purple-700 dark:text-brand-lavender">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Click to browse or drag & drop your document
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Supports PDF, Word, Markdown, Text, and Code files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select from Your Created Documents *
                  </label>
                  {myLibraryDocs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">No saved documents found in your library.</p>
                  ) : (
                    <select
                      value={selectedLibraryDocId}
                      onChange={(e) => {
                        setSelectedLibraryDocId(e.target.value);
                        const sel = myLibraryDocs.find((d) => d.id === e.target.value);
                        if (sel && !docTitle) setDocTitle(sel.title);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Choose a document --</option>
                      {myLibraryDocs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({new Date(d.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Sharing Document...' : 'Share Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CREATE MCQ TEST MODAL (FACULTY) */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Create MCQ Examination
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add unlimited questions with 4 choices, custom marks, and live countdown timer.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateTestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {testError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold mb-4">
                {testError}
              </div>
            )}

            <form onSubmit={handleCreateTest} className="space-y-6 flex-1 overflow-y-auto pr-1">
              {/* Test Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Test Title / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g. Cloud Computing & Distributed Architecture"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                {/* AI Question Generator Section */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-lavender/10 border border-purple-200 dark:border-purple-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-purple-950 dark:text-purple-200">
                        Auto-Generate Questions with AI (Up to 50 Questions)
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      AI Powered
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Type your subject or topic in the title field, choose your desired number of questions (up to 50), and click generate. AI will automatically construct every question, 4 choices, and mark the correct answers.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Number of Questions Selector */}
                    <div className="flex items-center space-x-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Questions:
                      </label>
                      <select
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-purple-900 dark:text-brand-lavender focus:outline-none"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                        <option value={25}>25 Questions</option>
                        <option value={30}>30 Questions</option>
                        <option value={40}>40 Questions</option>
                        <option value={50}>50 Questions (Max)</option>
                      </select>
                    </div>

                    {/* Custom Number Input */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] text-slate-400">or custom:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-14 px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs text-center font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Difficulty Selector */}
                    <div className="flex items-center space-x-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Difficulty:
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    {/* Generate Button */}
                    <button
                      type="button"
                      disabled={generatingAiQuestions || !testTitle.trim()}
                      onClick={handleGenerateAiQuestions}
                      className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {generatingAiQuestions ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating {aiQuestionCount} Questions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Generate {aiQuestionCount} Questions</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiSuccessMessage && (
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold animate-fade-in flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{aiSuccessMessage}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description & Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    placeholder="e.g. Total questions. Each question carries 1 mark. No negative marking."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value) || 20)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Passing Marks Threshold *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={testPassingMarks}
                    onChange={(e) => setTestPassingMarks(parseInt(e.target.value) || 4)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Question Builder */}
              <div className="space-y-4 border-t border-slate-200 dark:border-dark-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Questions ({questionsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender text-xs font-bold hover:bg-purple-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {questionsList.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-bg/60 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender">
                          Question {idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => handleQuestionFieldChange(idx, 'question', e.target.value)}
                        placeholder={`e.g. Enter question text ${idx + 1}`}
                        className="w-full px-3.5 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white"
                      />

                      {/* 4 Choices Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                          const field = `option${optKey}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                          const isCorrect = q.correctOption === optKey;

                          return (
                            <div key={optKey} className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleQuestionFieldChange(idx, 'correctOption', optKey)}
                                className={`w-7 h-7 rounded-xl font-mono font-bold text-xs shrink-0 flex items-center justify-center border transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white dark:bg-dark-surface border-slate-300 text-slate-600 hover:border-emerald-500'
                                }`}
                                title="Click to set as correct answer"
                              >
                                {optKey}
                              </button>
                              <input
                                type="text"
                                required
                                value={q[field]}
                                onChange={(e) => handleQuestionFieldChange(idx, field, e.target.value)}
                                placeholder={`Option ${optKey}`}
                                className={`w-full px-3 py-1.5 bg-white dark:bg-dark-surface border rounded-xl text-xs ${
                                  isCorrect
                                    ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                    : 'border-slate-200 dark:border-dark-border'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTest}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {creatingTest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creatingTest ? 'Publishing Test...' : 'Publish Test to Classroom'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. FACULTY RESULTS & ANALYTICS MODAL */}
      {analyticsTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {analyticsTest.title} — Examination Results
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Duration: {analyticsTest.duration}m • Total Marks: {analyticsTest.totalMarks} • Passing Threshold: {analyticsTest.passingMarks}
                </p>
              </div>

              <button
                onClick={() => setAnalyticsTest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-8 h-8 text-purple-600 dark:text-brand-lavender animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Computing student scores and analytics...</p>
              </div>
            ) : analyticsData ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {/* Analytics Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
                    <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-brand-lavender">Attempted</span>
                    <p className="text-xl font-black text-purple-900 dark:text-white">
                      {analyticsData.analytics.attemptedCount} / {analyticsData.analytics.totalStudents}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Pass Rate</span>
                    <p className="text-xl font-black text-emerald-600">
                      {analyticsData.analytics.passPercentage}%
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">Class Average</span>
                    <p className="text-xl font-black text-indigo-900 dark:text-white">
                      {analyticsData.analytics.averageScore}%
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                    <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Highest Score</span>
                    <p className="text-xl font-black text-amber-600">
                      {analyticsData.analytics.highestScore}%
                    </p>
                  </div>
                </div>

                {/* Submissions Table */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    Student Submissions ({analyticsData.submissions.length})
                  </h4>

                  {analyticsData.submissions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No students have submitted this test yet.
                    </p>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border overflow-hidden">
                      {analyticsData.submissions.map((sub: any) => {
                        const isPassed = sub.passed;
                        const subTime = new Date(sub.submittedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={sub.id}
                            className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-dark-surface/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender font-bold text-xs flex items-center justify-center">
                                {sub.user?.name ? sub.user.name[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                  {sub.user?.name || 'Student'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {sub.user?.email || 'email'} • {subTime}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-black text-xs text-purple-700 dark:text-brand-lavender">
                                {sub.score} / {sub.totalMarks} ({sub.percentage}%)
                              </span>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPassed
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 10. DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{previewDoc.fileName}</p>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-dark-border text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {previewDoc.content || 'Document preview is not directly available as plain text.'}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-dark-border mt-4">
              <span className="text-xs text-slate-500">
                Uploaded by {previewDoc.uploader?.name || 'Member'}
              </span>

              <button
                onClick={() => downloadGroupDocument(previewDoc)}
                className="px-4 py-2 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
