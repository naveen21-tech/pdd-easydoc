'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Heading4,
  Minus,
  Link as LinkIcon,
  Table,
  Image as ImageIcon,
  Smile,
  Calendar,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  Search,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  Save,
  Download,
  CheckCircle2,
  Loader2,
  Type,
  Palette,
  Highlighter,
  ChevronDown,
  Sparkles,
  FileText,
  FileType,
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
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#0B1B33');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [lineSpacing, setLineSpacing] = useState('1.5');

  // View state
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Download state
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Font Preset Templates
  const FONT_TEMPLATES = [
    { name: 'Modern Tech', font: 'Inter', size: 16, color: '#0B1B33' },
    { name: 'Executive Serif', font: 'Georgia', size: 17, color: '#1E293B' },
    { name: 'Elegant Classic', font: 'Times New Roman', size: 16, color: '#0F172A' },
    { name: 'Clean Code', font: 'Courier New', size: 14, color: '#334155' },
    { name: 'Creative Studio', font: 'Sora', size: 16, color: '#1D4ED8' },
  ];

  // Auto-Save Effect (Every 5 Seconds when unsaved)
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
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Auto save error:', err);
      setSaveStatus('unsaved');
    }
  };

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    setSaveStatus('unsaved');

    // Update history stack for undo/redo
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

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const applyHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    applyLinePrefix(prefix);
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);

    handleContentChange(newContent);
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);

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

  const handleReplace = () => {
    if (!findText) return;
    const newContent = content.replaceAll(findText, replaceText);
    handleContentChange(newContent);
  };

  const applyFontTemplate = (tmpl: typeof FONT_TEMPLATES[0]) => {
    setFontFamily(tmpl.font);
    setFontSize(tmpl.size);
    setTextColor(tmpl.color);
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

  // Cursor metrics
  const updateCursorMetrics = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const val = textarea.value.substring(0, textarea.selectionStart);
    const lines = val.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Text Stats
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  const estimatedPages = Math.max(1, Math.ceil(words / 350));

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 text-slate-100 min-h-screen ${
        isFullScreen ? 'fixed inset-0 z-50' : 'rounded-2xl border border-slate-800 shadow-2xl overflow-hidden'
      }`}
    >
      {/* 1. TOP DOCUMENT HEADER & SAVE BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white shrink-0">
            E
          </div>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus('unsaved');
              }}
              placeholder="Untitled Document"
              className="bg-transparent font-display text-base font-bold text-white focus:outline-none focus:bg-slate-900/80 px-2 py-1 rounded border border-transparent focus:border-slate-700 w-full truncate"
            />
          </div>

          {/* Auto-save Badge */}
          <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span className="text-brand-300 font-medium">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-slate-400">Saved</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">Unsaved changes</span>
              </>
            )}
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => performSave()}
            className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            title="Ctrl+S to Save"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Export Dropdown options */}
          <button
            onClick={() => triggerDownload('pdf')}
            disabled={downloadingFormat !== null}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1 border border-slate-800"
            title="Export PDF"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => triggerDownload('docx')}
            disabled={downloadingFormat !== null}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1 border border-slate-800"
            title="Export DOCX"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">DOCX</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN STICKY TOOLBAR */}
      {!focusMode && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center gap-2 sticky top-[53px] z-30 shadow-md">
          {/* Undo / Redo */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Typography Templates Dropdown */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <select
              onChange={(e) => {
                const tmpl = FONT_TEMPLATES.find((t) => t.name === e.target.value);
                if (tmpl) applyFontTemplate(tmpl);
              }}
              className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="">Font Template Style...</option>
              {FONT_TEMPLATES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.font})
                </option>
              ))}
            </select>
          </div>

          {/* Font Family Selector */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="Inter">Inter (Sans)</option>
              <option value="Sora">Sora (Modern)</option>
              <option value="Georgia">Georgia (Serif)</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New (Mono)</option>
              <option value="Arial">Arial</option>
            </select>

            {/* Font Size controls */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
              <button
                onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                className="text-slate-400 hover:text-white px-1"
              >
                -
              </button>
              <span className="w-6 text-center font-mono">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(72, fontSize + 1))}
                className="text-slate-400 hover:text-white px-1"
              >
                +
              </button>
            </div>
          </div>

          {/* Format Controls: Bold, Italic, Underline, Strikethrough, Code */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button
              onClick={() => applyWrapFormat('**', '**')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyWrapFormat('*', '*')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyWrapFormat('<u>', '</u>')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyWrapFormat('~~', '~~')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyWrapFormat('`', '`')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button
              onClick={() => applyHeading(1)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyHeading(2)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyHeading(3)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button
              onClick={() => setAlignment('left')}
              className={`p-1.5 rounded ${alignment === 'left' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAlignment('center')}
              className={`p-1.5 rounded ${alignment === 'center' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAlignment('right')}
              className={`p-1.5 rounded ${alignment === 'right' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAlignment('justify')}
              className={`p-1.5 rounded ${alignment === 'justify' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Insert */}
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <button
              onClick={() => applyLinePrefix('- ')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLinePrefix('1. ')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyLinePrefix('- [ ] ')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Checklist"
            >
              <ListChecks className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('\n---\n')}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Insert Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor(`[Link Text](https://example.com)`)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Insert Hyperlink"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor(`\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Data 1 | Data 2 |\n`)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Insert Table"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor(`\n${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Insert Date & Time"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Find */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className="p-1.5 text-slate-300 hover:bg-slate-800 rounded"
              title="Find & Replace (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-1.5 rounded ${focusMode ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title="Focus Mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FIND & REPLACE OVERLAY BAR */}
      {showFindReplace && (
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex items-center gap-3 text-xs animate-in slide-in-from-top-2">
          <span className="font-semibold text-brand-400">Find & Replace:</span>
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find text..."
            className="bg-slate-900 border border-slate-800 text-white px-3 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="bg-slate-900 border border-slate-800 text-white px-3 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={handleReplace}
            className="bg-brand-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold text-xs"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            className="text-slate-400 hover:text-white px-2"
          >
            Close
          </button>
        </div>
      )}

      {/* 3. A4 PAPER CANVAS EDITING AREA */}
      <div className="flex-1 bg-slate-950 p-6 md:p-12 overflow-y-auto flex justify-center">
        <div
          className="bg-white text-ink rounded-lg shadow-2xl p-8 md:p-14 w-full max-w-[850px] min-h-[1050px] transition-all"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            fontFamily,
            fontSize: `${fontSize}px`,
            color: textColor,
            textAlign: alignment,
            lineHeight: lineSpacing,
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyUp={updateCursorMetrics}
            onClick={updateCursorMetrics}
            placeholder="Start typing your document content..."
            className="w-full h-full min-h-[950px] bg-transparent resize-none focus:outline-none font-inherit text-inherit leading-relaxed border-none"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              color: textColor,
              textAlign: alignment,
              lineHeight: lineSpacing,
            }}
          />
        </div>
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <footer className="bg-slate-950 border-t border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-40 font-mono">
        <div className="flex items-center space-x-4">
          <span>Page {estimatedPages} of {estimatedPages}</span>
          <span>•</span>
          <span>{words} Words</span>
          <span>•</span>
          <span>{chars} Characters</span>
          <span>•</span>
          <span>~{readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>•</span>
          <span>Zoom: {zoom}%</span>
          <span>•</span>
          <span className="capitalize">{saveStatus}</span>
        </div>
      </footer>
    </div>
  );
}
