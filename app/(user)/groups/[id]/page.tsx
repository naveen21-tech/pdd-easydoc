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
} from 'lucide-react';
import { GroupItem, GroupMemberItem, GroupDocumentItem, DocumentItem } from '@/lib/types';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const groupId = params.id;

  const [group, setGroup] = useState<GroupItem | null>(null);
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [documents, setDocuments] = useState<GroupDocumentItem[]>([]);
  const [myRole, setMyRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'documents' | 'members'
  const [activeTab, setActiveTab] = useState<'documents' | 'members'>('documents');
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

  useEffect(() => {
    fetchGroupDetails();
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
                Teacher Notes
              </button>
              <button
                onClick={() => setDocFilter('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  docFilter === 'student'
                    ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Student Submissions
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
                <span>Upload Document</span>
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
                  Upload study materials, lecture slides, assignments, or student reports.
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
                <span>Upload First Document</span>
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
                });

                return (
                  <div
                    key={doc.id}
                    className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-400 dark:hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 shadow-sm"
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

                        {/* Uploader Role Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isTeacherUpload
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender'
                              : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isTeacherUpload ? 'Instructor Material' : 'Student Assignment'}
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

                      {/* Uploader Meta */}
                      <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-5 h-5 rounded-full bg-purple-700 dark:bg-brand-purple text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {doc.uploader?.name ? doc.uploader.name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="truncate">{doc.uploader?.name || 'Group Member'}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
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

      {/* 5. TAB 2: MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Enrolled Members ({members.length})
            </h3>
            <span className="text-xs text-slate-500">
              Students can join using the Join Code: <strong className="font-mono text-purple-700 dark:text-brand-lavender">{group.joinCode}</strong>
            </span>
          </div>

          <div className="glass-card rounded-2xl border border-slate-200 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border overflow-hidden">
            {members.map((mem) => {
              const isGroupAdmin = mem.role === 'ADMIN' || mem.userId === group.createdBy;
              const formattedDate = new Date(mem.joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={mem.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-dark-surface/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center font-bold text-sm border border-purple-200 dark:border-purple-800">
                      {mem.user?.name ? mem.user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {mem.user?.name || 'Student Member'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isGroupAdmin
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender'
                              : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isGroupAdmin ? 'Teacher / Admin' : 'Student'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        {mem.user?.email || 'Student Email'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-slate-400 hidden sm:inline-block">
                      Joined {formattedDate}
                    </span>

                    {/* Admin can remove member (except creator) */}
                    {isAdmin && mem.userId !== group.createdBy && (
                      <button
                        onClick={() => handleRemoveMember(mem.id, mem.user?.name || 'this student')}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove member from classroom"
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

      {/* 6. UPLOAD DOCUMENT MODAL */}
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

              {/* File Input OR Library Select */}
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

      {/* 7. DOCUMENT PREVIEW MODAL */}
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

            {/* Document Content View */}
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
