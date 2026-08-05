'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileCode,
  Download,
  Plus,
  Loader2,
  Bookmark,
  Pin,
  Lightbulb,
  Activity,
  Compass,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import { downloadDocumentFile } from '@/lib/download';

export default function UserDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [docRes, tmplRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/templates'),
      ]);

      if (docRes.ok) {
        const docData = await docRes.json();
        setDocuments(docData.documents || []);
      }

      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        setTemplates(tmplData.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = (docId: string, title: string) => {
    downloadDocumentFile({
      documentId: docId,
      title,
      format: 'pdf',
      onStart: () => setDownloadingId(docId),
      onFinish: () => setDownloadingId(null),
    });
  };

  const totalDocs = documents.length;
  const completedDocs = documents.filter((d) => d.status === 'COMPLETE').length;
  const latestDocument = documents[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. FUTURISTIC WELCOME BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900 dark:from-slate-900 dark:via-brand-900 dark:to-slate-950 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <span>AI Document Engine v2.0 Active</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Transform Ideas into Professional Documents
          </h2>
          <p className="text-blue-100 dark:text-slate-300 text-sm leading-relaxed">
            Create executive proposals, academic papers, SRS technical specs, and ATS-optimized resumes in seconds with Groq, Gemini, and Claude AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/generate"
              className="inline-flex items-center space-x-2 bg-white text-brand-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Generate New Document</span>
            </Link>

            <Link
              href="/resume-builder"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-brand-accent" />
              <span>ATS Resume Builder</span>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-[-20px] bottom-[-30px] opacity-10 pointer-events-none hidden lg:block">
          <FileText className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* 2. STATISTICS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Documents
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{totalDocs}</p>
          <span className="text-xs text-slate-400 mt-2 block">Saved across all workspaces</span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AI Generations
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{completedDocs}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 inline-flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% High Precision</span>
          </span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Templates
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{templates.length}</p>
          <span className="text-xs text-slate-400 mt-2 block">Curated categories</span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inference Speed
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Groq 70B</p>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-2 block">Sub-Second Processing</span>
        </div>
      </div>

      {/* 3. CONTINUE EDITING BANNER */}
      {latestDocument && (
        <div className="glass-card p-6 border-l-4 border-l-brand-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-0.5 rounded">
              Continue Editing
            </span>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              {latestDocument.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
              {latestDocument.content}
            </p>
          </div>

          <Link
            href={`/editor/${latestDocument.id}`}
            className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm shrink-0"
          >
            <span>Open in Word Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. RECENT DOCUMENTS & POPULAR TEMPLATES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Recent Documents</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage, edit, and export your recent files</p>
            </div>
            <Link
              href="/history"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">No documents created yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Jumpstart your first report using EasyDoc AI.</p>
              <Link
                href="/generate"
                className="inline-flex items-center space-x-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Document</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            doc.status === 'COMPLETE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleExportPdf(doc.id, doc.title)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800/40 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Export PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Popular Templates Column (1 Col) */}
        <div className="glass-panel rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Featured Blueprints</h3>
            <Link
              href="/templates"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Browse 100+
            </Link>
          </div>

          <div className="space-y-4">
            {templates.slice(0, 4).map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-white/50 dark:bg-slate-900/50 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~30s</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {tmpl.description}
                </p>
                <Link
                  href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(tmpl.name)}`}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-blue-700 inline-flex items-center space-x-1"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. AI SUGGESTIONS & TIPS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-start space-x-4 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1">
              AI Generation Tip
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Include specific metrics, section headings, and target audience guidelines in your prompt instructions for maximum precision.
            </p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-start space-x-4 border-l-4 border-l-brand-600">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1">
              ATS Resume Scanner Ready
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use our dedicated ATS Resume Builder to generate keyword-optimized resumes guaranteed to pass corporate recruitment software.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
