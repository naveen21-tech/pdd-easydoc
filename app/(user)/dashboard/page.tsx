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
  Palette,
  X,
  Check,
} from 'lucide-react';
import { downloadDocumentFile } from '@/lib/download';

export default function UserDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Wallpaper state & modal
  const [wallpaper, setWallpaper] = useState<string>('wallpaper-sunset');
  const [showWallpaperModal, setShowWallpaperModal] = useState<boolean>(false);

  const WALLPAPER_OPTIONS = [
    { id: 'wallpaper-sunset', name: 'Sunset Crimson Gradient', preview: 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-300' },
    { id: 'wallpaper-aurora', name: 'Velvet Peach Aurora', preview: 'bg-gradient-to-r from-rose-900 via-red-600 to-orange-300' },
    { id: 'wallpaper-mesh', name: 'Soft Coral Mesh', preview: 'bg-gradient-to-r from-rose-500 via-amber-300 to-slate-900' },
    { id: 'wallpaper-grid', name: 'Cyber Crimson Grid', preview: 'bg-slate-900 border border-red-500/40' },
    { id: 'wallpaper-obsidian', name: 'Midnight Velvet Obsidian', preview: 'bg-gradient-to-r from-slate-950 via-red-950 to-slate-900' },
    { id: 'none', name: 'Minimalist Clean', preview: 'bg-slate-100 dark:bg-slate-900' },
  ];

  useEffect(() => {
    fetchDashboardData();
    try {
      const savedWp = localStorage.getItem('easydoc_dashboard_wallpaper');
      if (savedWp) setWallpaper(savedWp);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const changeWallpaper = (id: string) => {
    setWallpaper(id);
    try {
      localStorage.setItem('easydoc_dashboard_wallpaper', id);
    } catch (e) {
      console.error(e);
    }
  };

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
    <div className={`space-y-8 animate-fade-in p-3 rounded-3xl transition-all duration-500 ${wallpaper !== 'none' ? wallpaper : ''}`}>
      {/* Top Bar with Customize Wallpaper Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Workspace Overview</h1>
          <p className="text-xs text-slate-500 dark:text-brand-peach/80">Welcome to your EasyDoc Sunset Studio</p>
        </div>

        <button
          onClick={() => setShowWallpaperModal(true)}
          className="inline-flex items-center space-x-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md hover:bg-brand-50 dark:hover:bg-dark-hover text-brand-600 dark:text-brand-peach border border-brand-200 dark:border-dark-border px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Palette className="w-4 h-4 text-brand-600 dark:text-brand-peach" />
          <span>Dashboard Wallpaper</span>
        </button>
      </div>

      {/* 1. SUNSET CRIMSON WELCOME BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-maroon via-brand-crimson to-brand-peach dark:from-brand-maroon dark:via-brand-crimson dark:to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-brand-peach border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-peach animate-pulse" />
            <span>AI Sunset Engine Active</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Transform Ideas into Executive Documents
          </h2>
          <p className="text-rose-100 text-sm leading-relaxed">
            Create proposals, technical specs, academic papers, and ATS resumes in seconds with Groq & Gemini AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/generate"
              className="inline-flex items-center space-x-2 bg-white text-brand-crimson hover:bg-rose-50 font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-brand-crimson" />
              <span>Generate New Document</span>
            </Link>

            <Link
              href="/resume-builder"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-brand-peach" />
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
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-brand-maroon/60 text-brand-crimson dark:text-brand-peach flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-brand-peach flex items-center justify-center">
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
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-brand-maroon/60 text-brand-crimson dark:text-brand-peach flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Groq 70B</p>
          <span className="text-xs text-brand-crimson dark:text-brand-peach font-semibold mt-2 block">Sub-Second Processing</span>
        </div>
      </div>

      {/* 3. CONTINUE EDITING BANNER */}
      {latestDocument && (
        <div className="glass-card p-6 border-l-4 border-l-brand-crimson flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-crimson dark:text-brand-peach bg-rose-50 dark:bg-brand-maroon/50 px-2.5 py-0.5 rounded">
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
            className="inline-flex items-center space-x-2 bg-brand-crimson hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm shrink-0"
          >
            <span>Open Word Editor</span>
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
              className="text-xs font-semibold text-brand-crimson dark:text-brand-peach hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-crimson" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-surface rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">No documents created yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Jumpstart your first report using EasyDoc AI.</p>
              <Link
                href="/generate"
                className="inline-flex items-center space-x-2 bg-brand-crimson text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Document</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors">
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
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-crimson dark:text-brand-peach hover:bg-rose-50 dark:hover:bg-brand-maroon/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-dark-border transition-colors disabled:opacity-50"
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
              className="text-xs font-semibold text-brand-crimson dark:text-brand-peach hover:underline"
            >
              Browse 100+
            </Link>
          </div>

          <div className="space-y-4">
            {templates.slice(0, 4).map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-border hover:border-brand-crimson bg-white/50 dark:bg-dark-surface/50 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-crimson dark:text-brand-peach bg-rose-50 dark:bg-brand-maroon/40 px-2 py-0.5 rounded">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~30s</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-brand-crimson dark:group-hover:text-brand-peach transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {tmpl.description}
                </p>
                <Link
                  href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(tmpl.name)}`}
                  className="text-xs font-bold text-brand-crimson dark:text-brand-peach hover:text-rose-700 inline-flex items-center space-x-1"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WALLPAPER SELECTOR MODAL */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center space-x-2.5">
                <Palette className="w-5 h-5 text-brand-crimson dark:text-brand-peach" />
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Customize Dashboard Wallpaper
                </h3>
              </div>
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {WALLPAPER_OPTIONS.map((item) => {
                const isSelected = wallpaper === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => changeWallpaper(item.id)}
                    className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-brand-crimson ring-2 ring-brand-peach/50 shadow-md'
                        : 'border-slate-200 dark:border-dark-border hover:border-brand-crimson'
                    }`}
                  >
                    <div className={`w-full h-10 rounded-lg mb-2 ${item.preview}`} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-brand-crimson dark:text-brand-peach shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end">
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="bg-brand-crimson hover:bg-rose-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
