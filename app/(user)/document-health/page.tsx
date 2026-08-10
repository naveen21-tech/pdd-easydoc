'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Wand2,
  FileText,
  Loader2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Check,
  Edit3,
} from 'lucide-react';
import { HealthReportItem, HealthIssueItem, DocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function DocumentHealthPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<HealthReportItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
          setActiveTitle(docs[0].title);
          setActiveContent(docs[0].content);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setActiveTitle(doc.title);
      setActiveContent(doc.content);
      setReport(null);
    }
  };

  const handleRunHealthCheck = async () => {
    if (!activeContent.trim()) {
      alert('Please select or provide document content to analyze.');
      return;
    }

    setAnalyzing(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/health/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeTitle || 'Document',
          content: activeContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setToastMessage(`Document health scored: ${data.report.overallScore}/100!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyFix = async (issue: HealthIssueItem) => {
    let updatedContent = activeContent;

    if (issue.autoFixAction?.type === 'append' && issue.autoFixAction.replacement) {
      updatedContent = updatedContent + issue.autoFixAction.replacement;
    } else if (issue.autoFixAction?.type === 'prepend' && issue.autoFixAction.replacement) {
      updatedContent = issue.autoFixAction.replacement + updatedContent;
    } else if (issue.autoFixAction?.type === 'format') {
      if (!updatedContent.includes('[PAGE BREAK]')) {
        updatedContent = updatedContent.replace(/(#\s+[^\n]+)/, '$1\n\n[PAGE BREAK]\n');
      }
    }

    setActiveContent(updatedContent);

    // If linked to an existing document, save update to DB
    if (selectedDocId) {
      try {
        await fetch(`/api/documents/${selectedDocId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Remove the fixed issue from report
    if (report) {
      setReport({
        ...report,
        overallScore: Math.min(100, report.overallScore + 4),
        issues: report.issues.filter((i) => i.id !== issue.id),
      });
    }

    setToastMessage(`Applied fix for: "${issue.title}"!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Feature 4 • Document Health Score & Proofreader</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Document Health Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Automated 6-pillar diagnostics across Structure, Readability, Grammar, Professionalism, Completeness, and Formatting.
          </p>
        </div>

        {selectedDocId && (
          <Link
            href={`/editor/${selectedDocId}`}
            className="inline-flex items-center space-x-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
            <span>Open in Word Editor</span>
          </Link>
        )}
      </div>

      {/* Selector & Scan Card */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Document to Inspect
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => handleSelectDoc(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({new Date(doc.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunHealthCheck}
              disabled={analyzing}
              className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Run Document Health Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Report View */}
      {report && (
        <div className="space-y-8 animate-scale-in">
          {/* Top Score Banner */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 dark:from-brand-amethyst dark:via-brand-purple dark:to-dark-bg rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diagnostic Complete</span>
              </span>
              <h2 className="font-display font-extrabold text-3xl text-white">
                Document Health Score
              </h2>
              <p className="text-xs text-purple-100 max-w-md">
                Evaluated against academic and corporate publication guidelines.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 dark:bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/20">
              <div className="text-center">
                <p className="font-display font-black text-5xl text-white">
                  {report.overallScore}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block mt-1">
                  Overall Score (0–100)
                </span>
              </div>
            </div>
          </div>

          {/* 6 Diagnostic Pillar Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Structure', score: report.structureScore },
              { name: 'Readability', score: report.readabilityScore },
              { name: 'Grammar', score: report.grammarScore },
              { name: 'Professionalism', score: report.professionalismScore },
              { name: 'Completeness', score: report.completenessScore },
              { name: 'Formatting', score: report.formattingScore },
            ].map((pillar) => (
              <div
                key={pillar.name}
                className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 text-center shadow-sm space-y-2"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  {pillar.name}
                </span>
                <p
                  className={`font-display font-black text-2xl ${
                    pillar.score >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : pillar.score >= 75
                      ? 'text-purple-700 dark:text-brand-lavender'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {pillar.score}
                </p>
                <div className="w-full bg-slate-100 dark:bg-dark-bg h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 dark:bg-brand-purple h-full rounded-full transition-all duration-500"
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Improvement Suggestions List with 1-Click Fix */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Wand2 className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                  <span>Quality Recommendations & 1-Click Fixes ({report.issues?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click 'Fix' on any issue to automatically patch and improve your document text
                </p>
              </div>
            </div>

            {report.issues?.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="font-bold text-sm">No quality issues detected!</p>
                <p className="text-xs text-slate-500">This document meets high-precision engineering benchmarks.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {report.issues?.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-brand-amethyst text-purple-800 dark:text-brand-lavender px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                        <h4 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {issue.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApplyFix(issue)}
                      className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-purple-200" />
                      <span>Fix Automatically</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
