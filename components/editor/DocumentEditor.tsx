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
  Plus,
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
  FileBadge,
  Palette,
  X,
  Check,
  Type,
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

  // PDF Border Customizer state
  const [pdfBorderColor, setPdfBorderColor] = useState('#7C3AED');
  const [pdfBorderStyle, setPdfBorderStyle] = useState<'solid' | 'double' | 'formal' | 'none'>('solid');
  const [showPdfBorderModal, setShowPdfBorderModal] = useState(false);

  // Cover Page Generator Modal state
  const [showCoverPageModal, setShowCoverPageModal] = useState(false);
  const [coverTitle, setCoverTitle] = useState(initialTitle);
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverAuthor, setCoverAuthor] = useState('');
  const [coverRegNo, setCoverRegNo] = useState('');
  const [coverDept, setCoverDept] = useState('');
  const [coverInstitution, setCoverInstitution] = useState('');
  const [coverDate, setCoverDate] = useState(new Date().toLocaleDateString());

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

  // PDF Border Color Palette
  const BORDER_COLOR_OPTIONS = [
    { name: 'Royal Purple', color: '#7C3AED' },
    { name: 'Soft Lavender', color: '#C084FC' },
    { name: 'Emerald Green', color: '#0D9488' },
    { name: 'Flame Crimson', color: '#D62828' },
    { name: 'Midnight Navy', color: '#141A29' },
    { name: 'Sunset Gold', color: '#D97706' },
    { name: 'Classic Black', color: '#000000' },
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

  // Font Size Helpers
  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(72, prev + 2));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(8, prev - 2));
  };

  // Insert Cover Page / Title Page Generator
  const handleInsertCoverPage = () => {
    const coverPageMarkdown = `# ${coverTitle || 'DOCUMENT TITLE'}
${coverSubtitle ? `## ${coverSubtitle}\n` : ''}

---

**Submitted By:** ${coverAuthor || '[Name]'}  
**Register No / Roll No:** ${coverRegNo || '[Reg No]'}  
**Department / Branch:** ${coverDept || '[Department]'}  
**Institution:** ${coverInstitution || '[Institution / Organization]'}  
**Date:** ${coverDate}  

---

<div style="page-break-after: always; break-after: page;"></div>

`;

    const newContent = coverPageMarkdown + content;
    handleContentChange(newContent);
    setShowCoverPageModal(false);
  };

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
      borderColor: pdfBorderColor,
      borderStyle: pdfBorderStyle,
      onStart: () => setDownloadingFormat(fmt),
      onFinish: () => setDownloadingFormat(null),
    });
  };

  // AI Assistant Action
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
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
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
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span className="text-purple-300 font-medium">Saving...</span>
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
          {/* Cover Page Generator Button */}
          <button
            onClick={() => setShowCoverPageModal(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Insert Cover / Title Page (Name, Reg No, Title)"
          >
            <FileBadge className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Insert Title Page</span>
          </button>

          {/* PDF Border Customizer Button */}
          <button
            onClick={() => setShowPdfBorderModal(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Configure PDF Page Borders"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">PDF Border</span>
          </button>

          <button
            onClick={() => setShowLeftOutline(!showLeftOutline)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border ${
              showLeftOutline ? 'bg-purple-700 border-purple-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Outline"
          >
            <ListTree className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowRightAiPanel(!showRightAiPanel)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border ${
              showRightAiPanel ? 'bg-purple-700 border-purple-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
          </button>

          <button
            onClick={() => performSave()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={() => triggerDownload('pdf')}
            disabled={downloadingFormat !== null}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs border border-slate-800 flex items-center space-x-1"
            title="Export PDF"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            ) : (
              <Download className="w-4 h-4 text-purple-400" />
            )}
            <span className="text-xs font-bold text-purple-300">PDF</span>
          </button>
        </div>
      </header>

      {/* 2. STICKY FORMATTING TOOLBAR WITH FONT SIZE INCREASER/DECREASER */}
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

          {/* FONT SIZE INCREASER / DECREASER CONTROLS */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <Type className="w-3.5 h-3.5 text-purple-400 mr-1" />
            <button
              onClick={decreaseFontSize}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-extrabold text-xs"
              title="Decrease Font Size (-2px)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-purple-300 min-w-[28px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={increaseFontSize}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-extrabold text-xs"
              title="Increase Font Size (+2px)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
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
            <button onClick={() => setAlignment('left')} className={`p-1.5 rounded ${alignment === 'left' ? 'bg-purple-700 text-white' : 'text-slate-400'}`}>
              <AlignLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setAlignment('center')} className={`p-1.5 rounded ${alignment === 'center' ? 'bg-purple-700 text-white' : 'text-slate-400'}`}>
              <AlignCenter className="w-4 h-4" />
            </button>
            <button onClick={() => setAlignment('right')} className={`p-1.5 rounded ${alignment === 'right' ? 'bg-purple-700 text-white' : 'text-slate-400'}`}>
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
              <ListTree className="w-4 h-4 text-purple-400" />
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
                    className="text-slate-300 hover:text-purple-400 py-1 truncate font-medium cursor-pointer"
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
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
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
                  className="p-2.5 bg-slate-800 hover:bg-purple-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Improve</span>
                </button>

                <button
                  onClick={() => handleAiAction('Rewrite & Rephrase')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-purple-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rewrite</span>
                </button>

                <button
                  onClick={() => handleAiAction('Expand & Detail')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-purple-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Maximize className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expand</span>
                </button>

                <button
                  onClick={() => handleAiAction('Fix Grammar & Spelling')}
                  disabled={aiProcessing}
                  className="p-2.5 bg-slate-800 hover:bg-purple-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 disabled:opacity-50"
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
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
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

      {/* 4. COVER PAGE / TITLE PAGE MODAL */}
      {showCoverPageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Insert Title / Cover Page
                </h3>
              </div>
              <button
                onClick={() => setShowCoverPageModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">Project / Document Title</label>
                <input
                  type="text"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Medical Report Analysis"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">Subtitle / Subject</label>
                <input
                  type="text"
                  value={coverSubtitle}
                  onChange={(e) => setCoverSubtitle(e.target.value)}
                  placeholder="e.g. Final Year Project Report"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">Author Name</label>
                  <input
                    type="text"
                    value={coverAuthor}
                    onChange={(e) => setCoverAuthor(e.target.value)}
                    placeholder="e.g. Naveen Kumar"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">Reg No / Roll No</label>
                  <input
                    type="text"
                    value={coverRegNo}
                    onChange={(e) => setCoverRegNo(e.target.value)}
                    placeholder="e.g. 21CS101"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">Department / Branch</label>
                  <input
                    type="text"
                    value={coverDept}
                    onChange={(e) => setCoverDept(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">Institution / Company</label>
                  <input
                    type="text"
                    value={coverInstitution}
                    onChange={(e) => setCoverInstitution(e.target.value)}
                    placeholder="e.g. Anna University"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">Submission Date</label>
                <input
                  type="text"
                  value={coverDate}
                  onChange={(e) => setCoverDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setShowCoverPageModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertCoverPage}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Insert Title Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PDF BORDER CUSTOMIZER MODAL */}
      {showPdfBorderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  PDF Page Border Style
                </h3>
              </div>
              <button
                onClick={() => setShowPdfBorderModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-2">Border Color</label>
                <div className="grid grid-cols-2 gap-2">
                  {BORDER_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.color}
                      onClick={() => setPdfBorderColor(opt.color)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        pdfBorderColor === opt.color
                          ? 'border-purple-400 bg-purple-950/60 text-white ring-1 ring-purple-400'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: opt.color }} />
                        <span>{opt.name}</span>
                      </div>
                      {pdfBorderColor === opt.color && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-2">Border Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['solid', 'double', 'formal', 'none'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setPdfBorderStyle(style)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                        pdfBorderStyle === style
                          ? 'border-purple-400 bg-purple-950/60 text-white ring-1 ring-purple-400'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {style} Frame
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPdfBorderModal(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Apply PDF Border
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM STATUS BAR */}
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
