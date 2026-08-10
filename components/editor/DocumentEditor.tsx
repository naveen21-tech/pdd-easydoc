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
  FileSpreadsheet,
  Scissors,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileType,
  Edit3,
  Activity,
  QrCode,
  BookOpen,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';
import { paginateDocument, PaginatedPage, insertOrUpdateTableOfContents } from '@/lib/export/pagination';
import { HealthReportItem, HealthIssueItem } from '@/lib/types';

export interface DocumentEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  initialTemplateName?: string;
  onSave?: (title: string, content: string) => Promise<void>;
}


export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  initialTemplateName,
  onSave,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Detect or initialize Template Name
  const detectedTemplate =
    initialTemplateName ||
    (content.includes('[TEMPLATE_BADGE]')
      ? content.match(/\[TEMPLATE_BADGE\]\s*([^\n\r]+)/)?.[1]
      : '') ||
    'Official Report';

  const [templateName, setTemplateName] = useState(detectedTemplate);

  // Layout Panels State
  const [showLeftOutline, setShowLeftOutline] = useState(true);
  const [showRightAiPanel, setShowRightAiPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'word-pages' | 'split-editor' | 'continuous'>('word-pages');

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(15);
  const [textColor, setTextColor] = useState('#0F172A');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Smart Header & Footer State
  const [showHeaderFooterModal, setShowHeaderFooterModal] = useState(false);
  const [headerText, setHeaderText] = useState(initialTitle);
  const [footerText, setFooterText] = useState('EasyDoc Verified Document');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right'>('bottom-center');

  // Document Health Modal State
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthReport, setHealthReport] = useState<HealthReportItem | null>(null);
  const [analyzingHealth, setAnalyzingHealth] = useState(false);

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

  // View & Zoom state
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // AI Assistant Action state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [selectedAiTone, setSelectedAiTone] = useState('Professional');

  // Download state
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);


  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic Pagination Computation (A4 Page Sheets with Decorated Title Page)
  const paginationResult = paginateDocument(content);
  const { pages, totalPages } = paginationResult;

  // Font Preset Templates
  const FONT_TEMPLATES = [
    { name: 'Modern Tech', font: 'Inter', size: 15, color: '#0F172A' },
    { name: 'Executive Serif', font: 'Georgia', size: 16, color: '#1E293B' },
    { name: 'Classic Formal', font: 'Times New Roman', size: 16, color: '#0F172A' },
    { name: 'Technical Code', font: 'Courier New', size: 14, color: '#334155' },
    { name: 'Creative Studio', font: 'Sora', size: 15, color: '#1E1B4B' },
  ];

  // Available EasyDoc Templates for top switcher
  const TEMPLATE_PRESETS = [
    'Official Report',
    'Project Report',
    'ATS Resume',
    'Research Paper',
    'Academic Assignment',
    'Business Proposal',
    'Technical Documentation',
    'Meeting Minutes',
    'Internship Report',
    'Lab Record',
    'Cover Letter',
  ];

  // PDF Border Color Palette
  const BORDER_COLOR_OPTIONS = [
    { name: 'Royal Purple', color: '#7C3AED' },
    { name: 'Soft Lavender', color: '#C084FC' },
    { name: 'Emerald Green', color: '#0D9488' },
    { name: 'Flame Crimson', color: '#D62828' },
    { name: 'Midnight Navy', color: '#141A29' },
    { name: 'Sunset Gold', color: '#D97706' },
    { name: 'Classic Slate', color: '#334155' },
  ];

  // Auto-Save Effect (Every 5 Seconds)
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(async () => {
      await performSave();
    }, 5000);
    return () => clearTimeout(timer);
  }, [content, title, saveStatus]);

  // Keyboard Shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+Enter (Page Break), Ctrl+S (Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          applyWrapFormat('**', '**');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          applyWrapFormat('*', '*');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          applyWrapFormat('<u>', '</u>');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          insertPageBreak();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          performSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

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

  // Change Template Name & update template badge in content
  const handleTemplateChange = (newTpl: string) => {
    setTemplateName(newTpl);
    if (content.includes('[TEMPLATE_BADGE]')) {
      const updated = content.replace(/\[TEMPLATE_BADGE\][^\n\r]+/, `[TEMPLATE_BADGE] ${newTpl}`);
      handleContentChange(updated);
    } else {
      const updated = `[TEMPLATE_BADGE] ${newTpl}\n` + content;
      handleContentChange(updated);
    }
  };

  // Text Formatting Helper (Bold, Italic, Underline, etc.)
  const applyWrapFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end) || 'Bold Text';
      const replacement = `${prefix}${selectedText}${suffix}`;
      const newContent = content.substring(0, start) + replacement + content.substring(end);
      handleContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      }, 50);
    } else {
      // If in full page view, append format token or wrap selection
      const sample = `${prefix}Bold Text${suffix}`;
      handleContentChange(content + '\n' + sample);
    }
  };

  // Heading helper
  const applyHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
      handleContentChange(newContent);
    } else {
      handleContentChange(content + '\n\n' + prefix + 'New Heading\n');
    }
  };

  // Insert Page Break helper
  const insertPageBreak = () => {
    const textarea = textareaRef.current;
    const breakTag = '\n\n[PAGE BREAK]\n\n';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + breakTag + content.substring(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + breakTag.length, start + breakTag.length);
      }, 50);
    } else {
      handleContentChange(content + breakTag);
    }
  };

  // Insert Table helper
  const insertTable = () => {
    const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Data 1 | Data 2 | Data 3 |\n| Row 2 | Row 2 | Row 2 |\n\n`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = content.substring(0, start) + tableTemplate + content.substring(start);
      handleContentChange(newContent);
    } else {
      handleContentChange(content + tableTemplate);
    }
  };

  // Font Size Helpers
  const increaseFontSize = () => setFontSize((prev) => Math.min(32, prev + 1));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(10, prev - 1));

  // Zoom Helpers
  const zoomIn = () => setZoom((prev) => Math.min(150, prev + 10));
  const zoomOut = () => setZoom((prev) => Math.max(50, prev - 10));
  const resetZoom = () => setZoom(100);

  // Insert Cover Page / Decorated Title Page Generator
  const handleInsertCoverPage = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const coverPageMarkdown = `[TEMPLATE_BADGE] ${templateName}
# **${coverTitle || title || 'DOCUMENT TITLE'}**

> **Document Type:** ${templateName}  
> **Submitted By:** ${coverAuthor || '[Author Name]'}  
> **Register No / ID:** ${coverRegNo || '[Reg No]'}  
> **Department / Branch:** ${coverDept || '[Department]'}  
> **Institution / Organization:** ${coverInstitution || '[Institution]'}  
> **Submission Date:** ${coverDate || currentDate}  
> **Security & Compliance:** Verified & Approved  

---

[PAGE BREAK]

`;

    // Remove old template badge if present and prepend new decorated cover page
    const cleanOldContent = content.replace(/^\[TEMPLATE_BADGE\][^\n\r]+\n*/, '');
    handleContentChange(coverPageMarkdown + cleanOldContent);
    setShowCoverPageModal(false);
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
Template: ${templateName}
Tone: ${selectedAiTone}
Additional User Instructions: ${aiInstruction || 'Improve readability, structure clearly with bold highlights and clean tables.'}`;

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Refined ${title}`,
          templateName,
          tone: selectedAiTone,
          instructions: prompt + `\n\nContent to refine:\n${content}`,
          provider: 'gemini',
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
      const text = line.replace(/^#+\s*/, '').replace(/[*_]/g, '');
      return { level, text };
    });

  // Text Metrics
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 min-h-screen ${
        isFullScreen ? 'fixed inset-0 z-50' : 'rounded-2xl border border-slate-800 shadow-2xl overflow-hidden'
      }`}
    >
      {/* 1. TOP HEADER & MAIN TOOLBAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-sm font-display">
            W
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            {/* Top Template Indicator */}
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Template:
              </span>
              <select
                value={templateName}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded-md text-[11px] font-bold px-2 py-0.5 focus:outline-none"
              >
                {TEMPLATE_PRESETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus('unsaved');
              }}
              placeholder="Document Title..."
              className="bg-transparent font-display text-base font-bold text-white focus:outline-none focus:bg-slate-800/80 px-2 py-0.5 rounded border border-transparent focus:border-slate-700 w-full truncate"
            />
          </div>

          {/* Save Status & Auto-page count */}
          <div className="hidden sm:flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
              {totalPages} A4 {totalPages === 1 ? 'Page' : 'Pages'}
            </span>

            <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span className="text-purple-300 font-medium">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Saved</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 font-medium">Unsaved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* View Mode Switcher */}
          <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('word-pages')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                viewMode === 'word-pages'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Word-Style Multi-Page View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pages</span>
            </button>
            <button
              onClick={() => setViewMode('split-editor')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                viewMode === 'split-editor'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split View (Editor + Live Multi-Page Preview)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                viewMode === 'continuous'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous Direct Editor View"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Editor</span>
            </button>
          </div>

          {/* Update Table of Contents Button */}
          <button
            onClick={() => {
              const updated = insertOrUpdateTableOfContents(content);
              handleContentChange(updated);
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="Auto-Generate or Update Table of Contents (H1/H2/H3)"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Update TOC</span>
          </button>

          {/* Header & Footer Customizer Button */}
          <button
            onClick={() => setShowHeaderFooterModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="Configure Header, Footer, and Page Numbering"
          >
            <FileType className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Header/Footer</span>
          </button>

          {/* Document Health Diagnostics Button */}
          <button
            onClick={async () => {
              setShowHealthModal(true);
              setAnalyzingHealth(true);
              try {
                const res = await fetch('/api/health/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title, content }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setHealthReport(data.report);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setAnalyzingHealth(false);
              }
            }}
            className="bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="Inspect 6-Pillar Document Health & Auto-Fix"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden lg:inline">Health Check</span>
          </button>

          {/* Decorated Front Title Page Generator Button */}
          <button
            onClick={() => setShowCoverPageModal(true)}
            className="bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="Decorate Front Title Page (Make Title Bigger, Bold & Add Template Badge)"
          >
            <FileBadge className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden lg:inline">Front Title Page</span>
          </button>

          {/* Insert Page Break Button */}
          <button
            onClick={insertPageBreak}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="Insert Manual Page Break (Ctrl + Enter)"
          >
            <Scissors className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Page Break</span>
          </button>

          {/* PDF Page Border */}
          <button
            onClick={() => setShowPdfBorderModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white p-2 rounded-xl text-xs font-bold transition-all"
            title="Configure PDF Page Borders"
          >
            <Palette className="w-4 h-4 text-purple-400" />
          </button>

          {/* Left Outline Toggle */}
          <button
            onClick={() => setShowLeftOutline(!showLeftOutline)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
              showLeftOutline
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Outline"
          >
            <ListTree className="w-4 h-4" />
          </button>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowRightAiPanel(!showRightAiPanel)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
              showRightAiPanel
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </button>


          {/* Save Button */}
          <button
            onClick={() => performSave()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Quick PDF Export */}
          <button
            onClick={() => triggerDownload('pdf')}
            disabled={downloadingFormat !== null}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Download Multi-Page PDF"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span className="font-bold text-purple-300">PDF</span>
          </button>

          {/* Quick DOCX Export */}
          <button
            onClick={() => triggerDownload('docx')}
            disabled={downloadingFormat !== null}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Download Word Document (DOCX)"
          >
            {downloadingFormat === 'docx' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="font-bold text-blue-300">DOCX</span>
          </button>
        </div>
      </header>

      {/* 2. SECONDARY RICH TEXT FORMATTING TOOLBAR */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2 sticky top-[57px] z-30 shadow-md backdrop-blur-md">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 text-slate-400 hover:text-white rounded disabled:opacity-40" title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 text-slate-400 hover:text-white rounded disabled:opacity-40" title="Redo (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Font Style Preset Dropdown */}
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
            <option value="">Font Family...</option>
            {FONT_TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.font})
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Increment / Decrement */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button onClick={decreaseFontSize} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Decrease Font Size">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold text-purple-300 px-1.5 min-w-[28px] text-center">
            {fontSize}pt
          </span>
          <button onClick={increaseFontSize} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Increase Font Size">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Decoration Controls: Bold, Italic, Underline, Strikethrough, Code */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button
            onClick={() => applyWrapFormat('**', '**')}
            className="p-1.5 text-slate-200 hover:text-white hover:bg-purple-600/30 rounded font-extrabold flex items-center justify-center min-w-[28px] border border-slate-700/50"
            title="Bold Text (Ctrl + B)"
          >
            <Bold className="w-4 h-4 text-purple-300" />
          </button>
          <button
            onClick={() => applyWrapFormat('*', '*')}
            className="p-1.5 text-slate-200 hover:text-white hover:bg-purple-600/30 rounded italic flex items-center justify-center min-w-[28px] border border-slate-700/50"
            title="Italic Text (Ctrl + I)"
          >
            <Italic className="w-4 h-4 text-purple-300" />
          </button>
          <button
            onClick={() => applyWrapFormat('<u>', '</u>')}
            className="p-1.5 text-slate-200 hover:text-white hover:bg-purple-600/30 rounded underline flex items-center justify-center min-w-[28px] border border-slate-700/50"
            title="Underline Text (Ctrl + U)"
          >
            <Underline className="w-4 h-4 text-purple-300" />
          </button>
          <button
            onClick={() => applyWrapFormat('~~', '~~')}
            className="p-1.5 text-slate-300 hover:bg-slate-800 rounded line-through"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyWrapFormat('`', '`')}
            className="p-1.5 text-slate-300 hover:bg-slate-800 rounded font-mono"
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button onClick={() => applyHeading(1)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded text-xs font-bold" title="Heading 1">
            H1
          </button>
          <button onClick={() => applyHeading(2)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded text-xs font-bold" title="Heading 2">
            H2
          </button>
          <button onClick={() => applyHeading(3)} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded text-xs font-bold" title="Heading 3">
            H3
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button onClick={() => setAlignment('left')} className={`p-1.5 rounded ${alignment === 'left' ? 'bg-purple-700 text-white' : 'text-slate-400'}`} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setAlignment('center')} className={`p-1.5 rounded ${alignment === 'center' ? 'bg-purple-700 text-white' : 'text-slate-400'}`} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => setAlignment('right')} className={`p-1.5 rounded ${alignment === 'right' ? 'bg-purple-700 text-white' : 'text-slate-400'}`} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
          <button onClick={() => setAlignment('justify')} className={`p-1.5 rounded ${alignment === 'justify' ? 'bg-purple-700 text-white' : 'text-slate-400'}`} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Elements Insertion: Table, List, Blockquote */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button onClick={insertTable} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Insert Table">
            <Table className="w-4 h-4 text-purple-400" />
          </button>
          <button onClick={() => applyWrapFormat('- ', '')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => applyWrapFormat('1. ', '')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button onClick={() => applyWrapFormat('> ', '')} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded text-xs italic font-serif px-2" title="Blockquote">
            Quote
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button onClick={zoomOut} className="p-1.5 text-slate-400 hover:text-white rounded" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-slate-300 px-1">{zoom}%</span>
          <button onClick={zoomIn} className="p-1.5 text-slate-400 hover:text-white rounded" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetZoom} className="p-1 text-slate-500 hover:text-slate-300 rounded" title="Reset Zoom">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. 3-COLUMN WORKSPACE: LEFT (OUTLINE) | CENTER (MULTI-PAGE A4 SHEETS OR SPLIT) | RIGHT (AI ASSISTANT) */}
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

            {/* Document Metrics Card */}
            <div className="mt-8 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block mb-2">
                Document Stats
              </span>
              <div className="flex justify-between">
                <span>Active Template:</span>
                <span className="font-bold text-purple-300 truncate max-w-[120px]">{templateName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pages:</span>
                <span className="font-bold text-purple-300">{totalPages} A4</span>
              </div>
              <div className="flex justify-between">
                <span>Word Count:</span>
                <span className="font-bold text-slate-200">{words}</span>
              </div>
              <div className="flex justify-between">
                <span>Reading Time:</span>
                <span className="font-bold text-slate-200">{readingTimeMinutes} min</span>
              </div>
            </div>
          </aside>
        )}

        {/* CENTER COLUMN: A4 MULTI-PAGE WORKSPACE */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col items-center custom-scrollbar">
          {viewMode === 'word-pages' ? (
            /* WORD-STYLE MULTI-PAGE VIEW */
            <div
              className="flex flex-col items-center w-full transition-all"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {pages.map((page: PaginatedPage, index: number) => {
                const isFirstPage = index === 0;

                return (
                  <div key={page.pageNumber} className="flex flex-col items-center mb-8 w-full max-w-[800px]">
                    {/* Page Label / Header Indicator */}
                    <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mb-2 px-2">
                      <span className="bg-slate-800 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                        {isFirstPage ? 'PAGE 1 • FRONT TITLE PAGE' : `PAGE ${page.pageNumber} of ${totalPages}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans">A4 • 210mm × 297mm</span>
                    </div>

                    {/* Discrete A4 Sheet (210mm x 297mm proportions) */}
                    <div
                      className="bg-white text-slate-900 rounded-sm shadow-[0_10px_35px_rgba(0,0,0,0.45)] w-full min-h-[1050px] p-10 md:p-14 relative flex flex-col justify-between transition-all border border-slate-200"
                      style={{
                        fontFamily,
                        fontSize: `${fontSize}px`,
                        color: textColor,
                        textAlign: alignment,
                        borderTop: isFirstPage && pdfBorderStyle !== 'none' ? `5px solid ${pdfBorderColor}` : undefined,
                      }}
                    >
                      {/* Running Header on every A4 page */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-6 text-xs text-slate-400 font-sans">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-purple-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                            EasyDoc
                          </span>
                          <span className="font-bold text-slate-700 truncate max-w-[200px]">{title}</span>
                          <span className="text-slate-400 font-medium text-[10px] hidden sm:inline">
                            • {templateName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>

                      {/* Paginated Page Content Body with Real Bold & Formatted Inline Text */}
                      <div
                        className="flex-1 leading-relaxed text-slate-900"
                        dangerouslySetInnerHTML={{ __html: page.htmlContent }}
                      />

                      {/* Running Footer on every A4 page */}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-6 text-xs text-slate-400 font-sans">
                        <span className="text-[10px] text-slate-400">Official EasyDoc Multi-Page Report</span>
                        <span className="bg-slate-100 text-slate-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                          Page {page.pageNumber} of {totalPages}
                        </span>
                      </div>
                    </div>

                    {/* Page Gap Separator */}
                    {index < pages.length - 1 && (
                      <div className="w-full flex items-center justify-center my-4 opacity-50">
                        <div className="h-px bg-slate-800 flex-1 max-w-[200px]" />
                        <span className="text-[10px] font-mono text-purple-400 mx-3 uppercase tracking-widest font-bold">
                          Page Break
                        </span>
                        <div className="h-px bg-slate-800 flex-1 max-w-[200px]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'split-editor' ? (
            /* SPLIT VIEW: LIVE TEXT EDITOR (LEFT) + MULTI-PAGE PREVIEW (RIGHT) */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full max-w-[1700px] h-full min-h-[900px]">
              {/* Textarea Editor */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full min-h-[850px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs font-bold text-purple-300">
                  <span>Markdown & Text Editor (Live Synchronized)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Use **bold**, *italic*, # Headings</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start typing your report..."
                  className="flex-1 w-full bg-slate-950 p-4 border border-slate-800 rounded-lg text-slate-100 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Live Multi-Page A4 Preview */}
              <div className="flex flex-col items-center overflow-y-auto max-h-[850px] custom-scrollbar pr-2">
                {pages.map((page: PaginatedPage, index: number) => (
                  <div key={page.pageNumber} className="bg-white text-slate-900 rounded-sm shadow-xl p-8 mb-6 w-full max-w-[700px] border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4 text-[10px] text-slate-400">
                      <span className="font-bold text-purple-700">{templateName}</span>
                      <span>Page {page.pageNumber} of {totalPages}</span>
                    </div>
                    <div
                      className="leading-relaxed text-xs text-slate-900"
                      dangerouslySetInnerHTML={{ __html: page.htmlContent }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* CONTINUOUS DIRECT EDITING CANVAS */
            <div
              className="bg-white text-slate-900 rounded-sm shadow-2xl p-8 md:p-14 w-full max-w-[800px] min-h-[1050px] transition-all"
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
          )}
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

            {/* Target Tone */}
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
                <option value="Executive">Executive & Strategic</option>
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
                placeholder="e.g. Add executive summary bullet points and format key metrics in bold..."
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

      {/* 4. COVER PAGE / DECORATED FRONT TITLE PAGE MODAL */}
      {showCoverPageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Decorated Front Title Page
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
                <label className="text-xs font-bold text-purple-300 block mb-1">Active Template Category</label>
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {TEMPLATE_PRESETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">Document Title (Bigger & Bold)</label>
                <input
                  type="text"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Medical Diagnosis Engine"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">Subtitle / Subject</label>
                <input
                  type="text"
                  value={coverSubtitle}
                  onChange={(e) => setCoverSubtitle(e.target.value)}
                  placeholder="e.g. Comprehensive Technical Architecture & Report"
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
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">Institution</label>
                  <input
                    type="text"
                    value={coverInstitution}
                    onChange={(e) => setCoverInstitution(e.target.value)}
                    placeholder="e.g. Stanford University / Tech Corp"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCoverPageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertCoverPage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                Apply Decorated Title Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PDF PAGE BORDER CUSTOMIZER MODAL */}
      {showPdfBorderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">PDF Border Style</h3>
              </div>
              <button
                onClick={() => setShowPdfBorderModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Border Style Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Border Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'solid', label: 'Solid Classic' },
                  { id: 'double', label: 'Double Line' },
                  { id: 'formal', label: 'Formal Executive' },
                  { id: 'none', label: 'No Border' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPdfBorderStyle(s.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      pdfBorderStyle === s.id
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Color Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {BORDER_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setPdfBorderColor(c.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      pdfBorderColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {pdfBorderColor === c.color && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPdfBorderModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SMART HEADER, FOOTER & PAGE NUMBER MODAL */}
      {showHeaderFooterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileType className="w-5 h-5 text-purple-400" />
                <h3 className="font-display font-bold text-lg text-white">Smart Header & Footer</h3>
              </div>
              <button
                onClick={() => setShowHeaderFooterModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Header Title Text</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Document Title in Header..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Footer Label Text</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. Confidential • EasyDoc Verified"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Page Number Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'top-right', label: 'Top Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setPageNumberPos(pos.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        pageNumberPos === pos.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHeaderFooterModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DOCUMENT HEALTH DIAGNOSTICS MODAL */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-lg text-white">Document Health Score</h3>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {analyzingHealth ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
                <span>Running 6-pillar diagnostics...</span>
              </div>
            ) : healthReport ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="p-4 bg-purple-950/60 border border-purple-800/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      Overall Health Score
                    </span>
                    <p className="font-display font-black text-3xl text-white">
                      {healthReport.overallScore} / 100
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                    {healthReport.overallScore >= 85 ? 'Verified Quality' : 'Improvements Available'}
                  </span>
                </div>

                {/* Pillar Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Structure</span>
                    <span className="text-purple-400 text-sm">{healthReport.structureScore}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Readability</span>
                    <span className="text-purple-400 text-sm">{healthReport.readabilityScore}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Grammar</span>
                    <span className="text-purple-400 text-sm">{healthReport.grammarScore}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Formal</span>
                    <span className="text-purple-400 text-sm">{healthReport.professionalismScore}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Complete</span>
                    <span className="text-purple-400 text-sm">{healthReport.completenessScore}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Format</span>
                    <span className="text-purple-400 text-sm">{healthReport.formattingScore}</span>
                  </div>
                </div>

                {/* Issues List with 1-Click Fix */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Quality Suggestions ({healthReport.issues?.length || 0})
                  </span>
                  {healthReport.issues?.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-bold uppercase bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded">
                            {issue.category}
                          </span>
                          <span className="font-bold text-white">{issue.title}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{issue.description}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (issue.autoFixAction?.type === 'append' && issue.autoFixAction.replacement) {
                            handleContentChange(content + issue.autoFixAction.replacement);
                          } else if (issue.autoFixAction?.type === 'prepend' && issue.autoFixAction.replacement) {
                            handleContentChange(issue.autoFixAction.replacement + content);
                          }
                          setHealthReport({
                            ...healthReport,
                            overallScore: Math.min(100, healthReport.overallScore + 4),
                            issues: healthReport.issues.filter((i) => i.id !== issue.id),
                          });
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shrink-0"
                      >
                        Fix
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

