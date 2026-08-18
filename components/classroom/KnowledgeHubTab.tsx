'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Folder,
  FileText,
  Upload,
  Search,
  Sparkles,
  HelpCircle,
  FileCode,
  FileSpreadsheet,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
  Brain,
  MessageSquare,
  FileQuestion,
  ListOrdered,
  Zap,
  Mic,
  Eye,
  X,
} from 'lucide-react';

interface KnowledgeMaterial {
  id: string;
  groupId: string;
  uploadedBy: string;
  title: string;
  subject: string;
  unit: string;
  topic: string;
  chapter: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string | null;
  content?: string | null;
  createdAt: string;
  uploader?: { id: string; name: string; email: string };
}

interface KnowledgeHubTabProps {
  groupId: string;
  classroomName: string;
  isAdmin: boolean;
}

export default function KnowledgeHubTab({ groupId, classroomName, isAdmin }: KnowledgeHubTabProps) {
  const [materials, setMaterials] = useState<KnowledgeMaterial[]>([]);
  const [tree, setTree] = useState<Record<string, Record<string, KnowledgeMaterial[]>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Operating Systems');
  const [uploadUnit, setUploadUnit] = useState('Unit 1');
  const [uploadTopic, setUploadTopic] = useState('Introduction & Overview');
  const [uploadChapter, setUploadChapter] = useState('Chapter 1');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ask');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    answer: string;
    sourceDocuments: any[];
    foundInMaterials: boolean;
    action: string;
    query: string;
  } | null>(null);
  const [selectedMaterialForChat, setSelectedMaterialForChat] = useState<string>('');

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<KnowledgeMaterial | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [groupId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
        setTree(data.tree || {});
      }
    } catch (e) {
      console.error('Fetch knowledge materials error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a title for the material');
      return;
    }
    if (!uploadFile) {
      setUploadError('Please select a document file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('subject', uploadSubject.trim());
      formData.append('unit', uploadUnit.trim());
      formData.append('topic', uploadTopic.trim());
      formData.append('chapter', uploadChapter.trim());
      formData.append('file', uploadFile);

      const res = await fetch(`/api/groups/${groupId}/knowledge`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload material');
        return;
      }

      setShowUploadModal(false);
      setUploadTitle('');
      setUploadFile(null);
      fetchMaterials();
    } catch (err: any) {
      setUploadError(err?.message || 'Error uploading material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/knowledge?materialId=${materialId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMaterials();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeAiAction = async (actionType: string, customQuery?: string) => {
    const q = customQuery || aiQuery;
    if (!q.trim()) {
      alert('Please enter a question or topic to analyze');
      return;
    }

    try {
      setAiLoading(true);
      setSelectedAction(actionType);
      const res = await fetch(`/api/groups/${groupId}/knowledge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          query: q.trim(),
          materialId: selectedMaterialForChat || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiResult(data);
      } else {
        alert(data.error || 'Failed to process request');
      }
    } catch (e: any) {
      alert(e?.message || 'Network error');
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    if (selectedSubject !== 'all' && m.subject !== selectedSubject) return false;
    if (selectedUnit !== 'all' && m.unit !== selectedUnit) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.chapter.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueSubjects = Array.from(new Set(materials.map((m) => m.subject)));
  const uniqueUnits = Array.from(new Set(materials.map((m) => m.unit)));

  const actionChips = [
    { id: 'ask', label: 'Ask Question', icon: MessageSquare, desc: 'Direct answer with citation' },
    { id: 'summarize', label: 'Summarize Material', icon: BookOpen, desc: 'Key takeaways' },
    { id: 'generate-mcq', label: 'Generate MCQs', icon: FileQuestion, desc: 'Practice test' },
    { id: 'generate-short-q', label: 'Short Questions', icon: ListOrdered, desc: 'Concept checks' },
    { id: 'generate-important-q', label: 'Important Questions', icon: Zap, desc: 'High weightage' },
    { id: 'explain-simply', label: 'Explain Simply', icon: Sparkles, desc: 'Intuitive analogies' },
    { id: 'find-topic', label: 'Find Topic', icon: Search, desc: 'Locate unit/page' },
    { id: 'generate-viva', label: 'Viva Questions', icon: Mic, desc: 'Oral exam prep' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HEADER & CONTROLS */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-slate-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-dark-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender">
                <Brain className="w-5 h-5" />
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                Classroom Knowledge Hub
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Classroom-scoped notes, lecture presentations, and curriculum materials organized by Subject, Unit & Topic.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Material</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. AI KNOWLEDGE ASSISTANT (CLASSROOM SCOPED) */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-brand-lavender animate-pulse" />
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Smart Study Assistant (Classroom Scoped)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 rounded-full">
            {materials.length} Materials Indexed
          </span>
        </div>

        {/* Input & Action Selector */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeAiAction(selectedAction)}
              placeholder="e.g. Explain deadlock prevention from Unit 3, or type any topic..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
            <button
              onClick={() => executeAiAction(selectedAction)}
              disabled={aiLoading || !aiQuery.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white text-xs font-extrabold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shrink-0"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Action</span>
                </>
              )}
            </button>
          </div>

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {actionChips.map((chip) => {
              const Icon = chip.icon;
              const isSelected = selectedAction === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setSelectedAction(chip.id);
                    if (aiQuery.trim()) {
                      executeAiAction(chip.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-sm ${
                    isSelected
                      ? 'bg-purple-700 text-white border-purple-700 dark:bg-brand-purple dark:border-brand-purple'
                      : 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Result Card */}
        {aiResult && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-md space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
                  Result for: &quot;{aiResult.query}&quot;
                </span>
              </div>
              <button
                onClick={() => setAiResult(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Non-hallucination Warning if not found */}
            {!aiResult.foundInMaterials && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Classroom Scope:</strong> This topic is not covered in the current uploaded classroom resources. The AI will not fabricate unverified content.
                </span>
              </div>
            )}

            {/* Answer Content */}
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {aiResult.answer}
            </div>

            {/* Source Citations */}
            {aiResult.sourceDocuments && aiResult.sourceDocuments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-dark-border space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Cited Classroom Sources:
                </span>
                <div className="flex flex-wrap gap-2">
                  {aiResult.sourceDocuments.map((doc: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-brand-lavender font-semibold"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        {doc.title} ({doc.unit}, {doc.chapter})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. MATERIALS BROWSER & HIERARCHICAL VIEW */}
      <div className="space-y-4">
        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs font-bold text-slate-800 dark:text-white"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs font-bold text-slate-800 dark:text-white"
            >
              <option value="all">All Units</option>
              {uniqueUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs">Loading classroom knowledge materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Materials Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAdmin
                ? 'Upload subject lecture notes, unit documents, or presentations to populate the classroom Knowledge Hub.'
                : 'No course materials have been published yet in this classroom.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="glass-card rounded-2xl border border-slate-200 dark:border-dark-border p-5 hover:border-purple-400 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                      {mat.subject} • {mat.unit}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {mat.fileType.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {mat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    Topic: {mat.topic} ({mat.chapter})
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{mat.fileName}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setAiQuery(`Explain ${mat.topic} from ${mat.unit}`);
                        setSelectedMaterialForChat(mat.id);
                        executeAiAction('ask', `Explain ${mat.topic} from ${mat.unit}`);
                      }}
                      title="Ask AI about this document"
                      className="p-1.5 rounded-lg text-purple-600 dark:text-brand-lavender hover:bg-purple-50 dark:hover:bg-purple-950/60"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    {mat.fileUrl && (
                      <a
                        href={mat.fileUrl}
                        download={mat.fileName}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                        title="Download Material"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(mat.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. UPLOAD MATERIAL MODAL (FACULTY) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Upload Classroom Material
              </h3>
              <p className="text-xs text-slate-500">
                Organize PDF, DOCX, PPTX, or TXT study materials by subject, unit, and topic.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-semibold">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Deadlock Notes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    placeholder="Operating Systems"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={uploadUnit}
                    onChange={(e) => setUploadUnit(e.target.value)}
                    placeholder="Unit 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={uploadTopic}
                    onChange={(e) => setUploadTopic(e.target.value)}
                    placeholder="Deadlock Prevention"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Chapter / Section
                  </label>
                  <input
                    type="text"
                    value={uploadChapter}
                    onChange={(e) => setUploadChapter(e.target.value)}
                    placeholder="Chapter 3.2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Attach File (PDF, DOCX, PPTX, TXT) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-950 dark:file:text-brand-lavender cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold shadow-md hover:bg-purple-800 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Upload & Index</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
