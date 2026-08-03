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
} from 'lucide-react';

export default function UserDashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalDocs = documents.length;
  const completedDocs = documents.filter((d) => d.status === 'COMPLETE').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-blue-700 to-ink rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI Document Engine Active</span>
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight mb-3">
            Create AI Reports & Docs Effortlessly
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Leverage OpenAI, Claude, and Gemini to generate polished, executive-ready proposals, specifications, and reports in seconds.
          </p>

          <Link
            href="/generate"
            className="inline-flex items-center space-x-2 bg-white text-brand-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-brand-600" />
            <span>Generate New Document</span>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-[-40px] bottom-[-40px] opacity-15 pointer-events-none hidden lg:block">
          <FileText className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="paper-stack p-6 bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Documents
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-ink">{totalDocs}</p>
          <span className="text-xs text-slate-500 mt-2 block">All created docs</span>
        </div>

        <div className="paper-stack p-6 bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AI Generations
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-ink">{completedDocs}</p>
          <span className="text-xs text-green-600 font-semibold mt-2 inline-flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Success Rate</span>
          </span>
        </div>

        <div className="paper-stack p-6 bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Templates Available
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-ink">{templates.length}</p>
          <span className="text-xs text-slate-500 mt-2 block">Curated structures</span>
        </div>

        <div className="paper-stack p-6 bg-white rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Plan
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-ink">Free Tier</p>
          <span className="text-xs text-brand-600 font-semibold mt-2 block">Unlimited Exports</span>
        </div>
      </div>

      {/* Quick Generator & Templates split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-ink">Recent Documents</h3>
              <p className="text-xs text-slate-500">Manage and export your generated documents</p>
            </div>
            <Link
              href="/history"
              className="text-xs font-semibold text-brand-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No documents generated yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Start by generating your first document with AI.</p>
              <Link
                href="/generate"
                className="inline-flex items-center space-x-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Document</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-medium text-ink max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            doc.status === 'COMPLETE'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={`/api/documents/${doc.id}/export?format=pdf`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Featured Templates (1 Col) */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ink">Popular Templates</h3>
            <Link
              href="/templates"
              className="text-xs font-semibold text-brand-600 hover:text-blue-700"
            >
              Browse All
            </Link>
          </div>

          <div className="space-y-4">
            {templates.slice(0, 3).map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 bg-slate-50/50 transition-all hover:shadow-sm group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-blue-50 px-2 py-0.5 rounded">
                    {tmpl.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{tmpl.usageCount} uses</span>
                </div>
                <h4 className="font-display font-bold text-sm text-ink mb-1 group-hover:text-brand-600 transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tmpl.description}</p>
                <Link
                  href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(
                    tmpl.name
                  )}`}
                  className="text-xs font-semibold text-brand-600 hover:text-blue-700 inline-flex items-center space-x-1"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
