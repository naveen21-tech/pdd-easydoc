'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Download,
  FileText,
  Copy,
  Check,
  Bot,
  Zap,
  Cpu,
  Loader2,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  FileType,
} from 'lucide-react';
import { AIProvider } from '@/lib/types';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export const dynamic = 'force-dynamic';

function GenerateFormAndPreview() {
  const searchParams = useSearchParams();

  const [title, setTitle] = useState('');
  const [tone, setTone] = useState('Professional');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [instructions, setInstructions] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateId, setTemplateId] = useState('');

  const [generating, setGenerating] = useState(false);
  const [outputContent, setOutputContent] = useState('');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    const tmplNameParam = searchParams.get('templateName');
    const tmplIdParam = searchParams.get('templateId');
    if (tmplNameParam) setTemplateName(tmplNameParam);
    if (tmplIdParam) setTemplateId(tmplIdParam);
  }, [searchParams]);

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
          provider,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">AI Document Studio</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate high-impact proposals, specifications, and briefs with AI
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
        <div className="lg:col-span-5 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card space-y-6">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
            <span>Document Configuration</span>
          </h3>

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

            {/* AI Provider Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                AI Engine Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'groq', name: 'Groq Llama-3', icon: Zap },
                  { id: 'gemini', name: 'Google Gemini', icon: Sparkles },
                  { id: 'openai', name: 'OpenAI GPT-4', icon: Bot },
                  { id: 'anthropic', name: 'Claude 3.5', icon: Cpu },
                ].map((p) => {
                  const Icon = p.icon;
                  const selected = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id as AIProvider)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                        selected
                          ? 'bg-purple-50 dark:bg-brand-amethyst border-purple-600 dark:border-brand-lavender text-purple-700 dark:text-brand-lavender ring-2 ring-purple-600/20'
                          : 'bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-hover'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${selected ? 'text-purple-600 dark:text-brand-lavender' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="text-[11px] truncate">{p.name}</span>
                    </button>
                  );
                })}
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
                rows={6}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detail your goals, sections required, constraints, key metrics, and specific topics to cover..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg transition-all text-slate-900 dark:text-white leading-relaxed placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 dark:bg-brand-purple hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Output & Export Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border mb-4">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Generated Document Preview</h3>
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
          <div className="flex-1 bg-slate-50 dark:bg-dark-bg rounded-xl border border-slate-200 dark:border-dark-border p-6 font-sans text-sm leading-relaxed overflow-y-auto max-h-[500px]">
            {generating ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-brand-amethyst text-purple-600 dark:text-brand-lavender flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 dark:text-white text-base">Processing with {provider.toUpperCase()}...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Formatting sections, tables, and executive summary</p>
                </div>
              </div>
            ) : outputContent ? (
              <div className="space-y-4 text-slate-900 dark:text-white">
                {responseTimeMs && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
                    <span>Provider: {provider.toUpperCase()}</span>
                    <span>Response Time: {responseTimeMs}ms</span>
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
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No Document Generated Yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                    Fill out the document title and requirements on the left, then click Generate.
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
