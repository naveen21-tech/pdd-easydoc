'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Download,
  FileText,
  Copy,
  Check,
  Zap,
  Loader2,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  FileType,
  Upload,
  FolderGit2,
  Users,
  FileUp,
  X,
  BookOpen,
  Layers,
  GraduationCap,
  Paperclip,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';
import { GroupItem, GroupDocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

function GenerateFormAndPreview() {
  const searchParams = useSearchParams();

  const [title, setTitle] = useState('');
  const [tone, setTone] = useState('Professional');
  const [instructions, setInstructions] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateId, setTemplateId] = useState('');

  // -------------------------------------------------------------
  // SOURCE / REFERENCE IMPORT STATE (LOCAL FILE OR CLASSROOM)
  // -------------------------------------------------------------
  const [importSource, setImportSource] = useState<'none' | 'file' | 'classroom'>('none');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedContent, setAttachedContent] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);

  // Classroom groups & documents for import
  const [myGroups, setMyGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupDocuments, setGroupDocuments] = useState<GroupDocumentItem[]>([]);
  const [selectedGroupDocId, setSelectedGroupDocId] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupDocs, setLoadingGroupDocs] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [outputContent, setOutputContent] = useState('');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  // AI Engine Provider Selection & Keys
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'gemini'>('groq');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const groqMaskedKey = 'gsk_HmHZ••••••••••••••••••••0oZF2Z';
  const geminiMaskedKey = 'AQ.Ab8RN••••••••••••••••••••4kPQ';

  const activeKey = selectedProvider === 'groq' ? groqMaskedKey : geminiMaskedKey;
  const activeModel = selectedProvider === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-flash-latest';

  useEffect(() => {
    const tmplNameParam = searchParams.get('templateName');
    const tmplIdParam = searchParams.get('templateId');
    if (tmplNameParam) setTemplateName(tmplNameParam);
    if (tmplIdParam) setTemplateId(tmplIdParam);
  }, [searchParams]);

  // Fetch groups when classroom source is chosen
  useEffect(() => {
    if (importSource === 'classroom' && myGroups.length === 0) {
      fetchMyGroups();
    }
  }, [importSource]);

  const fetchMyGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setMyGroups(data.groups || []);
      }
    } catch (e) {
      console.error('Fetch groups error:', e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectGroup = async (gId: string) => {
    setSelectedGroupId(gId);
    setSelectedGroupDocId('');
    setGroupDocuments([]);
    if (!gId) return;

    try {
      setLoadingGroupDocs(true);
      const res = await fetch(`/api/groups/${gId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setGroupDocuments(data.documents || []);
      }
    } catch (e) {
      console.error('Fetch group documents error:', e);
    } finally {
      setLoadingGroupDocs(false);
    }
  };

  const handleSelectGroupDoc = async (docId: string) => {
    setSelectedGroupDocId(docId);
    if (!docId) {
      setAttachedFileName(null);
      setAttachedContent(null);
      return;
    }

    const doc = groupDocuments.find((d) => d.id === docId);
    if (!doc) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/documents/${docId}`);
      if (res.ok) {
        const data = await res.json();
        const fullDoc = data.document;
        setAttachedFileName(fullDoc.fileName || fullDoc.title);
        setAttachedContent(fullDoc.content || `[Document Reference: ${fullDoc.title}]`);
        if (!title) {
          setTitle(`Analysis & Synthesis of ${fullDoc.title}`);
        }
      }
    } catch (e) {
      console.error('Fetch full doc error:', e);
    }
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReadingFile(true);
    setAttachedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setAttachedContent(text || '');
      setReadingFile(false);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      setError('Could not read file text.');
      setReadingFile(false);
    };

    // Read as text
    reader.readAsText(file);
  };

  const handleClearAttachment = () => {
    setAttachedFileName(null);
    setAttachedContent(null);
    setSelectedGroupDocId('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructions) {
      setError('Please enter a document title and key instructions.');
      return;
    }

    setGenerating(true);
    setError(null);
    setDownloadSuccess(null);
    setOutputContent('');
    setCreatedDocId(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          templateId: templateId || undefined,
          templateName: templateName || undefined,
          tone,
          instructions,
          provider: selectedProvider,
          referenceContent: attachedContent || undefined,
          referenceFileName: attachedFileName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate document');
      }

      setOutputContent(data.document.content);
      setCreatedDocId(data.document.id);
      setResponseTimeMs(data.responseTimeMs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDownload = (fmt: ExportFormat) => {
    if (!createdDocId) return;
    setError(null);
    setDownloadSuccess(null);

    downloadDocumentFile({
      documentId: createdDocId,
      title,
      format: fmt,
      onStart: () => setDownloadingFormat(fmt),
      onSuccess: (filename) => {
        setDownloadSuccess(`Downloaded "${filename}" successfully!`);
      },
      onError: (msg) => {
        setError(msg);
      },
      onFinish: () => setDownloadingFormat(null),
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Document Studio
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Generate high-impact proposals, specifications, study guides, and research briefs with AI
          </p>
        </div>

        {templateName && (
          <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-brand-amethyst/60 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <FileText className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Using Template: {templateName}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <span>Document Configuration</span>
            </div>
            <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{selectedProvider === 'groq' ? 'Groq LPU Active' : 'Gemini Active'}</span>
            </span>
          </h3>

          {/* AI ENGINE PROVIDER SELECTOR & LIVE KEY CARD */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-950/30 to-slate-900/50 border border-purple-500/30 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Select AI Engine Provider:
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/20">
                {activeModel}
              </span>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('groq');
                  setShowApiKey(false);
                }}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedProvider === 'groq'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Groq LPU (gpt-oss-120b)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('gemini');
                  setShowApiKey(false);
                }}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  selectedProvider === 'gemini'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Google Gemini (flash)</span>
              </button>
            </div>

            {/* Connected API Key Viewer */}
            <div className="flex items-center justify-between text-xs bg-slate-950/90 rounded-xl px-3 py-2 border border-slate-800/80">
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Active {selectedProvider === 'groq' ? 'Groq' : 'Gemini'} API Key
                </span>
                <span className="font-mono text-[11px] text-emerald-300 truncate">
                  {activeKey}
                </span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title={showApiKey ? 'Hide API Key' : 'Show Full Key'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeKey);
                    setCopiedApiKey(true);
                    setTimeout(() => setCopiedApiKey(false), 2000);
                  }}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Copy API Key"
                >
                  {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 flex items-start space-x-3 text-green-700 dark:text-green-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Cloud Architecture Spec & Roadmap"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg transition-all text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* SOURCE & REFERENCE IMPORT CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-slate-100 dark:to-dark-bg border border-purple-200 dark:border-purple-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                  <span className="font-display font-bold text-xs text-purple-950 dark:text-purple-200">
                    Import Source Material / Reference (Optional)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  Grounding
                </span>
              </div>

              {/* Source Mode Toggle Pills */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/80 dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => {
                    setImportSource('none');
                    handleClearAttachment();
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    importSource === 'none'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  No File
                </button>
                <button
                  type="button"
                  onClick={() => setImportSource('file')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    importSource === 'file'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImportSource('classroom')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    importSource === 'classroom'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Classroom File
                </button>
              </div>

              {/* Mode 1: Local File Upload */}
              {importSource === 'file' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  {attachedFileName ? (
                    <div className="p-3 bg-white dark:bg-dark-surface rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-brand-lavender shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {attachedFileName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({((attachedContent?.length || 0) / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAttachment}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-dark-hover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-4 text-center relative bg-white/50 dark:bg-dark-surface/50 hover:bg-purple-50/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleLocalFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileUp className="w-6 h-6 text-purple-600 dark:text-brand-lavender mx-auto mb-1" />
                      <p className="text-xs font-bold text-purple-900 dark:text-brand-lavender">
                        {readingFile ? 'Reading file text...' : 'Click to select local file'}
                      </p>
                      <p className="text-[10px] text-slate-400">Supports .txt, .md, .docx, .json, .csv, code</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Classroom Groups Import */}
              {importSource === 'classroom' && (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  {loadingGroups ? (
                    <div className="flex items-center justify-center py-3 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Loading your classrooms...</span>
                    </div>
                  ) : myGroups.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No classrooms found. Join or create a classroom first to import shared documents.
                    </p>
                  ) : (
                    <>
                      {/* Select Group */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          1. Select Classroom:
                        </label>
                        <select
                          value={selectedGroupId}
                          onChange={(e) => handleSelectGroup(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="">-- Choose Classroom --</option>
                          {myGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.role === 'ADMIN' ? 'Instructor' : 'Student'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Document from Classroom */}
                      {selectedGroupId && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            2. Choose Shared Document:
                          </label>
                          {loadingGroupDocs ? (
                            <div className="flex items-center py-2 text-xs text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              <span>Loading classroom documents...</span>
                            </div>
                          ) : groupDocuments.length === 0 ? (
                            <p className="text-xs text-slate-500 py-1">No shared files in this classroom.</p>
                          ) : (
                            <select
                              value={selectedGroupDocId}
                              onChange={(e) => handleSelectGroupDoc(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="">-- Select File to Import --</option>
                              {groupDocuments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.title} ({d.fileName})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {attachedFileName && (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-2 truncate">
                            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                              Imported: {attachedFileName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearAttachment}
                            className="p-1 rounded-lg text-emerald-600 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* AI Engine Provider Selector inside Form */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                AI Inference Engine Provider *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('groq')}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    selectedProvider === 'groq'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-600/30'
                      : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 hover:bg-slate-100 dark:hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Zap className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                      <span>Groq LPU</span>
                    </span>
                    {selectedProvider === 'groq' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">openai/gpt-oss-120b</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">⚡ Fast 0.8s</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('gemini')}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    selectedProvider === 'gemini'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-600/30'
                      : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 hover:bg-slate-100 dark:hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Google Gemini</span>
                    </span>
                    {selectedProvider === 'gemini' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">gemini-flash-latest</p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">🌟 1M+ Token Context</span>
                </button>
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Tone & Writing Style
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg transition-all text-slate-900 dark:text-white font-medium"
              >
                <option value="Professional">Professional & Corporate</option>
                <option value="Executive">Executive & Strategic Summary</option>
                <option value="Technical">Technical & Architectural</option>
                <option value="Persuasive">Persuasive Proposal</option>
                <option value="Academic">Academic & Research Rigor</option>
                <option value="Concise">Concise & Direct</option>
              </select>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                Key Instructions & Requirements *
              </label>
              <textarea
                required
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detail your goals, sections required, constraints, key metrics, and specific topics to cover..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg transition-all text-slate-900 dark:text-white leading-relaxed placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className={`w-full flex items-center justify-center space-x-2 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 ${
                selectedProvider === 'gemini'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/20'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst hover:opacity-95 shadow-purple-600/20'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Document with {selectedProvider === 'gemini' ? 'Google Gemini' : 'Groq LPU'}...</span>
                </>
              ) : (
                <>
                  {selectedProvider === 'gemini' ? <Sparkles className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  <span>
                    Generate with {selectedProvider === 'gemini' ? 'Google Gemini' : 'Groq LPU'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Output & Export Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-sm flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border mb-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Generated Document Preview
              </h3>
            </div>

            {outputContent && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-brand-lavender hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg transition-colors text-xs flex items-center space-x-1 border border-slate-200 dark:border-dark-border"
                  title="Copy Raw Text"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Document Content Output Box */}
          <div className="flex-1 bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-dark-border p-6 font-sans text-sm leading-relaxed overflow-y-auto max-h-[520px]">
            {generating ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-brand-amethyst text-purple-600 dark:text-brand-lavender flex items-center justify-center animate-pulse border border-purple-200 dark:border-purple-800 shadow-sm">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 dark:text-white text-base">
                    Processing Document with StudentDoc AI...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {attachedFileName
                      ? `Synthesizing knowledge from "${attachedFileName}" into academic sections`
                      : 'Formatting sections, tables, and executive summary'}
                  </p>
                </div>
              </div>
            ) : outputContent ? (
              <div className="space-y-4 text-slate-900 dark:text-white">
                {responseTimeMs && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      {selectedProvider === 'gemini' ? (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generated with Google Gemini (flash)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Generated with Groq LPU (gpt-oss-120b)</span>
                        </span>
                      )}
                    </span>
                    <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                      {responseTimeMs}ms
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
                  {outputContent}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400 dark:text-slate-500 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                    No Document Generated Yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                    Optionally import reference notes or a classroom file, then click Generate Document.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Export Bar */}
          {createdDocId && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Document saved! Select download format:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => triggerDownload('pdf')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex items-center justify-center space-x-1.5 bg-purple-600 dark:bg-brand-purple hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {downloadingFormat === 'pdf' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>PDF Document</span>
                </button>

                <button
                  onClick={() => triggerDownload('docx')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex items-center justify-center space-x-1.5 bg-slate-800 dark:bg-purple-950 dark:hover:bg-purple-900 text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all border dark:border-purple-800/50 disabled:opacity-50"
                >
                  {downloadingFormat === 'docx' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>DOCX Word</span>
                </button>

                <button
                  onClick={() => triggerDownload('txt')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex items-center justify-center space-x-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {downloadingFormat === 'txt' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileType className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>Plain TXT</span>
                </button>

                <button
                  onClick={() => triggerDownload('md')}
                  disabled={downloadingFormat !== null}
                  className="inline-flex items-center justify-center space-x-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {downloadingFormat === 'md' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>Markdown</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400 text-sm">Loading studio...</div>}>
      <GenerateFormAndPreview />
    </Suspense>
  );
}
