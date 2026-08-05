'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Link as LinkIcon,
  Table,
  Calendar,
  Undo,
  Redo,
  Search,
  Maximize2,
  Minimize2,
  Eye,
  Save,
  Download,
  CheckCircle2,
  Loader2,
  Sparkles,
  Wand2,
  RefreshCw,
  Maximize,
  Languages,
  CheckCheck,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftOpen,
  PanelLeftClose,
  ListTree,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export interface DocumentEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  onSave?: (title: string, content: string) => Promise<void>;
}

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  onSave,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Layout Panels State
  const [showLeftOutline, setShowLeftOutline] = useState(true);
  const [showRightAiPanel, setShowRightAiPanel] = useState(true);

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#0F172A');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // View state
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // AI Assistant Action state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [selectedAiTone, setSelectedAiTone] = useState('Professional');

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Download state
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Font Preset Templates
  const FONT_TEMPLATES = [
    { name: 'Modern Tech', font: 'Inter', size: 16, color: '#0F172A' },
    { name: 'Executive Serif', font: 'Georgia', size: 17, color: '#1E293B' },
    { name: 'Elegant Classic', font: 'Times New Roman', size: 16, color: '#0F172A' },
    { name: 'Clean Code', font: 'Courier New', size: 14, color: '#334155' },
    { name: 'Creative Studio', font: 'Sora', size: 16, color: '#2563EB' },
  ];

  // Auto-Save Effect (Every 5 Seconds)
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(async () => {
      await performSave();
    }, 5000);
    return () => clearTimeout(timer);
  }, [content, title, saveStatus]);

  const performSave = async () => {
    setSaveStatus('saving');
    try {
      if (onSave) {
        await onSave(title, content);
      } else {
        await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Auto save error:', err);
      setSaveStatus('unsaved');
    }
  };

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    setSaveStatus('unsaved');

    if (newVal !== history[historyIndex]) {
      const newHist = history.slice(0, historyIndex + 1);
      newHist.push(newVal);
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            applyWrapFormat('**', '**');
            break;
          case 'i':
            e.preventDefault();
            applyWrapFormat('*', '*');
            break;
          case 'u':
            e.preventDefault();
            applyWrapFormat('<u>', '</u>');
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'f':
            e.preventDefault();
            setShowFindReplace(true);
            break;
          case 's':
            e.preventDefault();
            performSave();
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, historyIndex, history]);

  // Format Helpers
  const applyWrapFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || 'Sample Text';

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);
  };

  const applyHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    handleContentChange(newContent);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
      setSaveStatus('unsaved');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
      setSaveStatus('unsaved');
    }
  };

  const triggerDownload = (fmt: ExportFormat) => {
    downloadDocumentFile({
      documentId,
      title,
      format: fmt,
      onStart: () => setDownloadingFormat(fmt),
      onFinish: () => setDownloadingFormat(null),
    });
  };

  // AI Assistant Panel Action
  const handleAiAction = async (actionType: string) => {
    setAiProcessing(true);
    try {
      const prompt = `Perform the following action on this document content: ${actionType}.
Tone: ${selectedAiTone}
Additional User Instructions: ${aiInstruction || 'Improve readability and overall structure.'}`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Refined ${title}`,
          tone: selectedAiTone,
          instructions: prompt + `\n\nContent to refine:\n${content}`,
          provider: 'groq',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.document?.content) {
          handleContentChange(data.document.content);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiProcessing(false);
    }
  };

  // Outline Headings Extractor
  const headings = content
    .split('\n')
    .filter((line) => line.startsWith('#'))
    .map((line) => {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const text = line.replace(/^#+\s*/, '');
      return { level, text };
    });

  // Text Metrics
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  const estimatedPages = Math.max(1, Math.ceil(words / 350));

  return (
    <div
      className={`flex flex-col bg-slate-900 text-slate-100 min-h-screen ${
        isFullScreen ? 'fixed inset-0 z-50' : 'rounded-2xl border border-slate-800 shadow-2xl overflow-hidden'
      }`}
    >
      {/* 1. TOP TOOLBAR & HEADER */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            E
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('unsaved');
            }}
            className="bg-transparent font-display text-base font-bold text-white focus:outline-none focus:bg-slate-900 px-2 py-1 rounded border border-transparent focus:border-slate-700 w-full truncate"
          />

          {/* Auto-save Badge */}
          <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 shrink-0">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span className="text-brand-300 font-medium">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Saved</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">Unsaved</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowLeftOutline(!showLeftOutline)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border ${
              showLeftOutline ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Outline"
          >
            <ListTree className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowRightAiPanel(!showRightAiPanel)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border ${
              showRightAiPanel ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-brand-accent" />
          </button>

          <button
            onClick={() => performSave()}
            className="bg-brand-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={() => triggerDownload('pdf')}
            disabled={downloadingFormat !== null}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs border border-slate-800"
            title="Export PDF"
          >
            <Download className="w-4 h-4 text-brand-400" />
          </button>
        </div>
      </header>

      {/* 2. STICKY FORMATTING TOOLBAR */}
      {!focusMode && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2 sticky top-[49px] z-30 shadow-md">
          {/* Undo / Redo */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 text-slate-400 hover:text-white rounded disabled:opacity-40">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 text-slate-400 hover:text-white rounded disabled:opacity-40">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Typography Preset Dropdown */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <select
              onChange={(e) => {
                const tmpl = FONT_TEMPLATES.find((t) => t.name === e.target.value);
                if (tmpl) {
                  setFontFamily(tmpl.font);
                  setFontSize(tmpl.size);
                  setTextColor(tmpl.color);
                }
              }}
              className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none font-medium"
            >
              <option value="">Font Style Preset...</option>
              {FONT_TEMPLATES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.font})
                </option>
              ))}
            </select>
          </div>

          {/* Formatting buttons */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button onClick={() => applyWrapFormat('**', '**')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => applyWrapFormat('*', '*')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => applyWrapFormat('<u>', '</u>')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Underline className="w-4 h-4" />
            </button>
            <button onClick={() => applyWrapFormat('`', '`')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button onClick={() => applyHeading(1)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={() => applyHeading(2)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Heading2 className="w-4 h-4" />
            </button>
            <button onClick={() => applyHeading(3)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded">
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <button onClick={() => setAlignment('left')} className={`p-1.5 rounded ${alignment === 'left' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
              <AlignLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setAlignment('center')} className={`p-1.5 rounded ${alignment === 'center' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
              <AlignCenter className="w-4 h-4" />
            </button>
            <button onClick={() => setAlignment('right')} className={`p-1.5 rounded ${alignment === 'right' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. 3-COLUMN WORKSPACE: LEFT (OUTLINE) | CENTER (CANVAS) | RIGHT (AI ASSISTANT) */}
      <div className="flex-1 flex overflow-hidden bg-slate-950">
        {/* LEFT COLUMN: DOCUMENT OUTLINE */}
        {showLeftOutline && (
          <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 overflow-y-auto hidden lg:block">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ListTree className="w-4 h-4 text-brand-400" />
              <span>Document Outline</span>
            </div>

            {headings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Add headings (# ## ###) to see outline tree.</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {headings.map((h, i) => (
                  <div
                    key={i}
                    style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                    className="text-slate-300 hover:text-brand-400 py-1 truncate font-medium cursor-pointer"
                  >
                    • {h.text}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* CENTER COLUMN: A4 PAPER EDITOR */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto flex justify-center">
          <div
            className="bg-white text-slate-900 rounded-lg shadow-2xl p-8 md:p-12 w-full max-w-[850px] min-h-[1050px] transition-all"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              fontFamily,
              fontSize: `${fontSize}px`,
              color: textColor,
              textAlign: alignment,
            }}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start typing your document..."
              className="w-full h-full min-h-[950px] bg-transparent resize-none focus:outline-none font-inherit text-inherit leading-relaxed border-none"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                color: textColor,
                textAlign: alignment,
              }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: AI ASSISTANT PANEL */}
        {showRightAiPanel && (
          <aside className="w-80 bg-slate-900 border-l border-slate-800 p-5 shrink-0 overflow-y-auto space-y-6 hidden md:block">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
              <h3 className="font-display font-bold text-sm text-white">AI Writing Assistant</h3>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick AI Refinements
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAiAction('Improve Writing & Tone')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-brand-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Improve</span>
                </button>

                <button
                  onClick={() => handleAiAction('Rewrite & Rephrase')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-brand-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rewrite</span>
                </button>

                <button
                  onClick={() => handleAiAction('Expand & Detail')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-brand-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Maximize className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expand</span>
                </button>

                <button
                  onClick={() => handleAiAction('Fix Grammar & Spelling')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-brand-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fix Grammar</span>
                </button>
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Tone
              </span>
              <select
                value={selectedAiTone}
                onChange={(e) => setSelectedAiTone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="Professional">Professional & Corporate</option>
                <option value="Academic">Academic & Scientific</option>
                <option value="Executive">Executive & Brief</option>
                <option value="Persuasive">Persuasive Proposal</option>
              </select>
            </div>

            {/* Custom AI Instruction Prompt */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Custom Instruction
              </span>
              <textarea
                rows={3}
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="e.g. Add executive summary bullet points at the top..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white leading-relaxed focus:outline-none"
              />
              <button
                onClick={() => handleAiAction('Custom Refinement')}
                disabled={aiProcessing}
                className="w-full py-2.5 bg-brand-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {aiProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply AI Transformation</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-40 font-mono">
        <div className="flex items-center space-x-4">
          <span>Page {estimatedPages} of {estimatedPages}</span>
          <span>•</span>
          <span>{words} Words</span>
          <span>•</span>
          <span>{chars} Chars</span>
          <span>•</span>
          <span>~{readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="capitalize">{saveStatus}</span>
        </div>
      </footer>
    </div>
  );
}
