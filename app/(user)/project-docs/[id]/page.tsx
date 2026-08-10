'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  FolderGit2,
  FileText,
  Edit3,
  Download,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Sparkles,
  Presentation,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ExternalLink,
  Code2,
  Layers,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';
import { DocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        if (data.project?.documents?.length > 0) {
          setSelectedDoc(data.project.documents[0]);
        }
      } else {
        router.push('/project-docs');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (doc: DocumentItem, format: ExportFormat) => {
    downloadDocumentFile({
      documentId: doc.id,
      title: doc.title,
      format,
      onStart: () => {
        setDownloadingDocId(doc.id);
        setDownloadingFormat(format);
      },
      onFinish: () => {
        setDownloadingDocId(null);
        setDownloadingFormat(null);
      },
    });
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this entire project workspace and all its documents?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/project-docs');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateDoc = async (doc: DocumentItem) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${doc.title} (Copy)`,
          content: doc.content,
          projectId: project.id,
          status: 'COMPLETE',
        }),
      });

      if (res.ok) {
        setToastMessage(`Duplicated "${doc.title}" successfully!`);
        setTimeout(() => setToastMessage(null), 3000);
        fetchProjectDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSingleDoc = async (docId: string) => {
    if (!confirm('Delete this document from the project?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjectDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-brand-purple" />
        <span className="font-semibold">Loading Project Workspace...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-slate-500">Project workspace not found.</p>
        <Link
          href="/project-docs"
          className="inline-flex items-center space-x-2 bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Studio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold animate-slide-up flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-border pb-6">
        <div className="space-y-1">
          <Link
            href="/project-docs"
            className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Project Packages</span>
          </Link>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Domain: <span className="font-bold text-purple-700 dark:text-brand-lavender">{project.domain}</span> •{' '}
            {project.documents?.length || 0} Total Generated Artifacts
          </p>
        </div>

        {/* Quick Cross-Studio Launchers */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/presentation-studio?docId=${selectedDoc?.id || ''}`}
            className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all"
            title="Generate Presentation Slides from this Project"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Generate PPT</span>
          </Link>

          <Link
            href={`/viva-studio?projectId=${project.id}`}
            className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all"
            title="Generate Viva & Technical Defense Questions"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Viva Studio</span>
          </Link>

          <button
            onClick={handleDeleteProject}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-slate-200 dark:border-dark-border"
            title="Delete Project Package"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Left Sidebar Document Tree + Right Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Document Tree Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <FolderGit2 className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                <span>Project Artifacts</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-brand-amethyst text-purple-800 dark:text-brand-lavender px-2 py-0.5 rounded-full">
                {project.documents?.length || 0} Files
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {project.documents?.map((doc: DocumentItem) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-left select-none flex items-center justify-between group ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-brand-amethyst/70 dark:text-brand-lavender dark:border-brand-lavender/40 shadow-sm font-bold'
                        : 'border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-purple-700 dark:text-brand-lavender' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs truncate">{doc.title}</span>
                    </div>

                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isSelected ? 'opacity-100 text-purple-700 dark:text-brand-lavender' : 'text-slate-400'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Summary Specs Card */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-display font-bold text-xs text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
              Project Specifications
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>

            {project.modules && Array.isArray(project.modules) && project.modules.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Identified Modules ({project.modules.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.modules.map((m: any, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-slate-200 dark:border-dark-border"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Document Canvas / Viewer & Action Bar (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDoc ? (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
              {/* Document Action Ribbon */}
              <div className="p-4 bg-slate-50 dark:bg-dark-bg/60 border-b border-slate-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-brand-lavender shrink-0" />
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {selectedDoc.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/editor/${selectedDoc.id}`}
                    className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-200" />
                    <span>Open in Word Editor</span>
                  </Link>

                  <button
                    onClick={() => handleExport(selectedDoc, 'pdf')}
                    disabled={downloadingDocId === selectedDoc.id && downloadingFormat === 'pdf'}
                    className="inline-flex items-center space-x-1 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
                  >
                    {downloadingDocId === selectedDoc.id && downloadingFormat === 'pdf' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
                    )}
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => handleExport(selectedDoc, 'docx')}
                    disabled={downloadingDocId === selectedDoc.id && downloadingFormat === 'docx'}
                    className="inline-flex items-center space-x-1 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
                  >
                    {downloadingDocId === selectedDoc.id && downloadingFormat === 'docx' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>DOCX</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateDoc(selectedDoc)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-dark-border"
                    title="Duplicate Document"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteSingleDoc(selectedDoc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 dark:border-dark-border"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Live Reading Canvas */}
              <div className="p-8 max-h-[700px] overflow-y-auto bg-white dark:bg-dark-surface">
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-body leading-relaxed space-y-4">
                  {selectedDoc.content.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('# ')) {
                      return (
                        <h1 key={i} className="font-display font-extrabold text-xl sm:text-2xl text-purple-950 dark:text-brand-lavender pb-2 border-b border-slate-200 dark:border-dark-border mt-4">
                          {line.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white pt-3">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={i} className="font-display font-semibold text-sm sm:text-base text-purple-800 dark:text-brand-lavender pt-2">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('> ')) {
                      return (
                        <blockquote key={i} className="p-3 bg-purple-50 dark:bg-brand-amethyst/30 border-l-4 border-purple-600 dark:border-brand-lavender rounded-r-xl text-slate-800 dark:text-slate-200 italic my-2">
                          {line.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    if (line.includes('[PAGE BREAK]')) {
                      return (
                        <div key={i} className="py-4 my-6 flex items-center justify-center border-t-2 border-dashed border-purple-300 dark:border-brand-lavender/30 text-[10px] font-mono uppercase tracking-widest text-purple-700 dark:text-brand-lavender">
                          <span>— A4 Page Boundary —</span>
                        </div>
                      );
                    }
                    if (line.trim() === '---') {
                      return <hr key={i} className="border-slate-200 dark:border-dark-border my-4" />;
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    if (line.trim().length === 0) {
                      return <div key={i} className="h-1.5" />;
                    }
                    return (
                      <p key={i} className="text-slate-800 dark:text-slate-200">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-sm">Select a document from the left to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
