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
  Flame,
  Layers,
  Sparkle,
  FolderGit2,
  Presentation,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { downloadDocumentFile } from '@/lib/download';


export default function UserDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Wallpaper state & modal
  const [wallpaper, setWallpaper] = useState<string>('wp-cyber-purple');
  const [showWallpaperModal, setShowWallpaperModal] = useState<boolean>(false);

  // 10 Unique Dark Purple Wallpapers
  const WALLPAPER_OPTIONS = [
    { id: 'wp-cyber-purple', name: '1. Cyber Royal Purple', preview: 'bg-gradient-to-r from-purple-900 via-purple-600 to-indigo-400' },
    { id: 'wp-obsidian-violet', name: '2. Obsidian Violet Glow', preview: 'bg-gradient-to-r from-slate-950 via-purple-900 to-violet-500' },
    { id: 'wp-lavender-matrix', name: '3. Lavender Cyber Grid', preview: 'bg-slate-950 border border-purple-400/40' },
    { id: 'wp-deep-amethyst', name: '4. Deep Amethyst', preview: 'bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950' },
    { id: 'wp-neon-fuchsia', name: '5. Neon Fuchsia', preview: 'bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-950' },
    { id: 'wp-cyber-cyan', name: '6. Purple & Electric Cyan', preview: 'bg-gradient-to-r from-indigo-950 via-purple-700 to-cyan-400' },
    { id: 'wp-midnight-velvet', name: '7. Midnight Lavender', preview: 'bg-gradient-to-r from-slate-950 via-purple-900 to-indigo-950' },
    { id: 'wp-emerald-purple', name: '8. Emerald Dusk & Purple', preview: 'bg-gradient-to-r from-teal-950 via-purple-950 to-slate-950' },
    { id: 'wp-luxe-violet', name: '9. Luxe Violet Sunset', preview: 'bg-gradient-to-r from-indigo-950 via-purple-600 to-rose-500' },
    { id: 'wp-midnight-pure', name: '10. Midnight Pure', preview: 'bg-slate-950 border border-slate-800' },
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
    <div className={`space-y-8 animate-fade-in p-4 rounded-3xl transition-all duration-500 ${wallpaper}`}>
      {/* Top Header with Wallpaper Launcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white">
            Workspace Overview
          </h1>
          <p className="text-xs font-semibold text-slate-600 dark:text-brand-lavender/90 mt-1">
            Welcome to your EasyDoc Cyber Studio
          </p>
        </div>

        <button
          onClick={() => setShowWallpaperModal(true)}
          className="inline-flex items-center space-x-2 bg-white dark:bg-dark-surface text-purple-700 dark:text-brand-lavender border border-slate-200 dark:border-brand-lavender/30 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all"
        >
          <Palette className="w-4 h-4 text-purple-600 dark:text-brand-lavender animate-pulse" />
          <span>Dashboard Wallpaper</span>
        </button>
      </div>

      {/* 1. CYBER ELECTRIC PURPLE WELCOME BANNER (DUAL MODE HIGH-CONTRAST) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 dark:from-brand-amethyst dark:via-brand-purple dark:to-dark-bg rounded-3xl p-8 text-white shadow-xl border border-purple-500/30 dark:border-brand-lavender/30">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-purple-100 dark:text-brand-lavender border border-white/20 dark:border-brand-lavender/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-200 dark:text-brand-lavender animate-pulse" />
            <span>AI Cyber Engine v2.0 Active</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Transform Ideas into <span className="text-purple-200 dark:text-gradient-lavender">Executive Documents</span>
          </h2>
          <p className="text-purple-100 text-sm leading-relaxed font-medium">
            Create proposals, technical specs, academic papers, and ATS resumes in seconds with Groq & Gemini AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/generate"
              className="inline-flex items-center space-x-2 bg-white text-purple-900 hover:bg-purple-50 font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-xl hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-purple-700" />
              <span>Generate New Document</span>
            </Link>

            <Link
              href="/resume-builder"
              className="inline-flex items-center space-x-2 bg-black/20 hover:bg-black/30 text-white font-bold px-5 py-3 rounded-xl text-xs backdrop-blur-md border border-white/20 transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-purple-200" />
              <span>ATS Resume Builder</span>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-[-20px] bottom-[-30px] opacity-15 pointer-events-none hidden lg:block">
          <FileText className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* 2. STATISTICS METRIC CARDS WITH DUAL-MODE CONTRAST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-purple-600 dark:border-t-brand-purple">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
              Total Documents
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-brand-lavender/30">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-4xl font-black text-slate-900 dark:text-gradient-purple">{totalDocs}</p>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2 block">Saved across all workspaces</span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              AI Generations
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-4xl font-black text-emerald-600 dark:text-emerald-400">{completedDocs}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 inline-flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% High Precision</span>
          </span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-purple-500 dark:border-t-brand-lavender">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
              Active Templates
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-4xl font-black text-slate-900 dark:text-gradient-purple">{templates.length}</p>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2 block">Curated categories</span>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Inference Speed
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-black text-amber-600 dark:text-gradient-gold">Groq 70B</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-2 block">Sub-Second Processing</span>
        </div>
      </div>

      {/* 3. ADVANCED CREATION STUDIOS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Advanced Document Studios
            </h3>
            <p className="text-xs text-slate-500 dark:text-brand-lavender/80">
              Specialized creation engines for engineering projects, slides, defense, quality, and careers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Project Documentation Generator */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-brand-lavender/30">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Project Documentation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Create complete software project documentation packages (SRS, Architecture, DB Design, API Docs, Test Cases) from your project details.
              </p>
            </div>
            <Link
              href="/project-docs"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Create Project Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Document -> PPT */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Presentation className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Document → Presentation
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Convert any document or report into a 16:9 keynote slide deck with custom themes and instant PPTX export.
              </p>
            </div>
            <Link
              href="/presentation-studio"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Launch Presentation Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Viva Studio */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Viva Studio
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Simulate technical defense exams with voice or text answering, real-time AI scoring (0–100), and feedback.
              </p>
            </div>
            <Link
              href="/viva-studio"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Practice Viva Defense</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Document Health Score */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Document Health Score
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Comprehensive 6-pillar diagnostics for structure, readability, grammar, and completeness with 1-click automatic fixes.
              </p>
            </div>
            <Link
              href="/document-health"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Check Document Health</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5: Document Verification */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Document Verification & QR
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Issue tamper-proof cryptographic verification IDs and embed scan-to-verify QR badges on official publications.
              </p>
            </div>
            <Link
              href="/verification"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Verification Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6: Career Studio & ATS Resume */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-500 transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-brand-lavender/30">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                Career Studio & ATS
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Build ATS-parsed resumes, analyze job description keyword match rates, and generate tailored cover letters.
              </p>
            </div>
            <Link
              href="/career-studio"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <span>Launch Career Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. CONTINUE EDITING BANNER */}

      {latestDocument && (
        <div className="glass-card p-6 border-l-4 border-l-purple-600 dark:border-l-brand-lavender flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst/80 px-2.5 py-0.5 rounded border border-purple-200 dark:border-brand-lavender/30">
              Continue Editing
            </span>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              {latestDocument.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xl">
              {latestDocument.content}
            </p>
          </div>

          <Link
            href={`/editor/${latestDocument.id}`}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:shadow-lg transition-all shrink-0"
          >
            <span>Open Word Editor</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-200 dark:text-brand-lavender" />
          </Link>
        </div>
      )}

      {/* 4. RECENT DOCUMENTS & FEATURED TEMPLATES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Recent Documents</h3>
              <p className="text-xs text-slate-500 dark:text-brand-lavender/80">Manage, edit, and export your recent files</p>
            </div>
            <Link
              href="/history"
              className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-brand-purple" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-bg/60 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
              <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">No documents created yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Jumpstart your first report using EasyDoc AI.</p>
              <Link
                href="/generate"
                className="inline-flex items-center space-x-2 bg-purple-700 dark:bg-brand-purple text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200 dark:text-brand-lavender" />
                <span>Generate Document</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-dark-hover/80 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            doc.status === 'COMPLETE'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
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
                          className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-brand-lavender hover:bg-purple-50 dark:hover:bg-brand-amethyst/60 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-brand-lavender/30 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
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
              className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:underline"
            >
              Browse 100+
            </Link>
          </div>

          <div className="space-y-4">
            {templates.slice(0, 4).map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-border hover:border-purple-500 dark:hover:border-brand-lavender bg-white/60 dark:bg-dark-surface/60 transition-all hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst/60 px-2 py-0.5 rounded border border-purple-200 dark:border-brand-lavender/30">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">~30s</span>
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                  {tmpl.description}
                </p>
                <Link
                  href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(tmpl.name)}`}
                  className="text-xs font-bold text-purple-700 dark:text-brand-lavender hover:text-purple-900 dark:hover:text-white inline-flex items-center space-x-1"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WALLPAPER SELECTOR MODAL WITH DUAL MODE */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center space-x-2.5">
                <Palette className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Select Dashboard Wallpaper
                </h3>
              </div>
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
              {WALLPAPER_OPTIONS.map((item) => {
                const isSelected = wallpaper === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => changeWallpaper(item.id)}
                    className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-purple-600 dark:border-brand-lavender ring-2 ring-purple-400/50 dark:ring-brand-lavender/50 shadow-lg bg-purple-50 dark:bg-brand-amethyst/60'
                        : 'border-slate-200 dark:border-dark-border hover:border-purple-400 dark:hover:border-brand-lavender/50 bg-white dark:bg-dark-bg'
                    }`}
                  >
                    <div className={`w-full h-10 rounded-lg mb-2 ${item.preview}`} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-purple-700 dark:text-brand-lavender shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end">
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="bg-purple-700 dark:bg-gradient-to-r dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
              >
                Apply Wallpaper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
