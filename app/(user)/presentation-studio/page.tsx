'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Presentation,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Palette,
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Eye,
  Save,
  RotateCcw,
  Edit3,
  MonitorPlay,
  Share2,
} from 'lucide-react';
import { SlideItem, PresentationStyle, PresentationItem, DocumentItem } from '@/lib/types';
import { exportPresentationToPptx } from '@/lib/export/pptx';

export const dynamic = 'force-dynamic';

const PRESENTATION_STYLES: { id: PresentationStyle; name: string; desc: string; preview: string }[] = [
  { id: 'Academic', name: 'Academic Defense', desc: 'Serif typography, formal structure, institutional review format', preview: 'from-purple-950 via-purple-800 to-indigo-900' },
  { id: 'Corporate', name: 'Executive Corporate', desc: 'Clean slate navy, high contrast metrics, modern stakeholder layout', preview: 'from-slate-900 via-blue-900 to-slate-950' },
  { id: 'Minimal', name: 'Minimal Modern', desc: 'Monochrome elegance, spacious whitespace, clear bullet hierarchy', preview: 'from-slate-800 via-slate-700 to-slate-900' },
  { id: 'Technical', name: 'Cyber Technical', desc: 'Monospace code style, electric cyan accents, engineering topology', preview: 'from-slate-950 via-purple-950 to-cyan-950' },
  { id: 'Project Viva', name: 'Project Viva Studio', desc: 'Vibrant purple highlights, problem-solution pairs, viva defense cards', preview: 'from-purple-900 via-violet-800 to-purple-950' },
];

function PresentationStudioContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('docId');


  // Input source mode ('document' | 'custom')
  const [sourceMode, setSourceMode] = useState<'document' | 'custom'>('document');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId || '');
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [slideCount, setSlideCount] = useState<number>(8);
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyle>('Project Viva');

  // Slide Deck State
  const [currentDeck, setCurrentDeck] = useState<SlideItem[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [currentDeckTitle, setCurrentDeckTitle] = useState<string>('EasyDoc Keynote Deck');
  const [savedPresentationId, setSavedPresentationId] = useState<string | null>(null);

  // Status & UI States
  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [exportingPptx, setExportingPptx] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pastPresentations, setPastPresentations] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [docRes, presRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/presentations'),
      ]);

      if (docRes.ok) {
        const dData = await docRes.json();
        setDocuments(dData.documents || []);
        if (!selectedDocId && dData.documents?.length > 0) {
          setSelectedDocId(dData.documents[0].id);
        }
      }

      if (presRes.ok) {
        const pData = await presRes.json();
        setPastPresentations(pData.presentations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateDeck = async () => {
    setGenerating(true);
    setToastMessage(null);

    try {
      const payload: any = {
        slideCount,
        style: selectedStyle,
      };

      if (sourceMode === 'document') {
        payload.documentId = selectedDocId;
      } else {
        payload.customTitle = customTitle || 'Custom Presentation';
        payload.customContent = customContent;
      }

      const res = await fetch('/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentDeck(data.slides || []);
        setCurrentDeckTitle(data.title || 'EasyDoc Keynote Deck');
        setSavedPresentationId(data.presentationId);
        setActiveSlideIndex(0);
        setToastMessage(`Generated ${data.slides?.length || 0} slides successfully!`);
        setTimeout(() => setToastMessage(null), 3500);
        fetchUserData();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate presentation');
      }
    } catch (e: any) {
      alert(e?.message || 'Error generating slides.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDeck = async () => {
    if (currentDeck.length === 0) return;
    setSaving(true);

    try {
      if (savedPresentationId) {
        await fetch(`/api/presentations/${savedPresentationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentDeckTitle,
            style: selectedStyle,
            slides: currentDeck,
          }),
        });
      }
      setToastMessage('Presentation saved successfully!');
      setTimeout(() => setToastMessage(null), 3000);
      fetchUserData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPptx = async () => {
    if (currentDeck.length === 0) return;
    setExportingPptx(true);
    try {
      const presentationObj: PresentationItem = {
        id: savedPresentationId || 'temp',
        userId: 'temp',
        title: currentDeckTitle,
        style: selectedStyle,
        slides: currentDeck,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await exportPresentationToPptx(presentationObj);
      setToastMessage('PPTX Presentation downloaded!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      alert('Error exporting PPTX: ' + e?.message);
    } finally {
      setExportingPptx(false);
    }
  };

  // Slide Deck Manipulation Helpers
  const activeSlide = currentDeck[activeSlideIndex] || null;

  const updateActiveSlide = (field: keyof SlideItem, value: any) => {
    if (!activeSlide) return;
    const updated = [...currentDeck];
    updated[activeSlideIndex] = { ...activeSlide, [field]: value };
    setCurrentDeck(updated);
  };

  const updateBulletPoint = (bulletIndex: number, newText: string) => {
    if (!activeSlide) return;
    const newBullets = [...activeSlide.bullets];
    newBullets[bulletIndex] = newText;
    updateActiveSlide('bullets', newBullets);
  };

  const addBulletPoint = () => {
    if (!activeSlide) return;
    updateActiveSlide('bullets', [...activeSlide.bullets, 'New highlight key takeaway point']);
  };

  const removeBulletPoint = (bulletIndex: number) => {
    if (!activeSlide) return;
    updateActiveSlide('bullets', activeSlide.bullets.filter((_, idx) => idx !== bulletIndex));
  };

  const addNewSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      slideNumber: currentDeck.length + 1,
      title: 'New Slide Title',
      subtitle: 'Slide Subtitle & Scope',
      bullets: ['Key point A', 'Key point B', 'Key point C'],
      layout: 'content',
      notes: 'Presenter notes for this slide.',
    };
    setCurrentDeck([...currentDeck, newSlide]);
    setActiveSlideIndex(currentDeck.length);
  };

  const deleteCurrentSlide = () => {
    if (currentDeck.length <= 1) {
      alert('A presentation must have at least one slide.');
      return;
    }
    const updated = currentDeck.filter((_, idx) => idx !== activeSlideIndex);
    setCurrentDeck(updated);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const duplicateCurrentSlide = () => {
    if (!activeSlide) return;
    const duplicated: SlideItem = {
      ...activeSlide,
      id: `slide-${Date.now()}`,
      title: `${activeSlide.title} (Copy)`,
      slideNumber: activeSlideIndex + 2,
    };
    const nextDeck = [...currentDeck];
    nextDeck.splice(activeSlideIndex + 1, 0, duplicated);
    setCurrentDeck(nextDeck);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const moveSlide = (direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    if (targetIdx < 0 || targetIdx >= currentDeck.length) return;
    const nextDeck = [...currentDeck];
    const temp = nextDeck[activeSlideIndex];
    nextDeck[activeSlideIndex] = nextDeck[targetIdx];
    nextDeck[targetIdx] = temp;
    setCurrentDeck(nextDeck);
    setActiveSlideIndex(targetIdx);
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
            <Presentation className="w-3.5 h-3.5" />
            <span>Feature 2 • Document to PPT Keynote Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Presentation Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Convert any EasyDoc document, research paper, or technical spec into a slide presentation.
          </p>
        </div>

        {currentDeck.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveDeck}
              disabled={saving}
              className="inline-flex items-center space-x-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Deck</span>
            </button>

            <button
              onClick={handleExportPptx}
              disabled={exportingPptx}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {exportingPptx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-purple-200" />
              )}
              <span>Download PPTX</span>
            </button>
          </div>
        )}
      </div>

      {/* Generator Control Card */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
            <span>Generate Slides from Document</span>
          </h2>

          {/* Source Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
            <button
              onClick={() => setSourceMode('document')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sourceMode === 'document'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              From Existing Document
            </button>
            <button
              onClick={() => setSourceMode('custom')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sourceMode === 'custom'
                  ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Paste / Custom Text
            </button>
          </div>
        </div>

        {sourceMode === 'document' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Source Document
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({new Date(doc.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Target Slide Count
              </label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value={5}>5 Slides (Quick Pitch)</option>
                <option value={8}>8 Slides (Standard Overview)</option>
                <option value={10}>10 Slides (Academic Defense)</option>
                <option value={15}>15 Slides (Exhaustive Technical)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Presentation Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Cloud Systems"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Slide Count
                </label>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold"
                >
                  <option value={5}>5 Slides</option>
                  <option value={8}>8 Slides</option>
                  <option value={10}>10 Slides</option>
                  <option value={15}>15 Slides</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Document Content / Transcript / Specs
              </label>
              <textarea
                rows={4}
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Paste document text, research abstract, or bullet points here..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        )}

        {/* Presentation Style Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-dark-border">
          <label className="block text-xs font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
            Choose Presentation Theme & Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRESENTATION_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-purple-600 dark:border-brand-lavender ring-2 ring-purple-400/40 bg-purple-50 dark:bg-brand-amethyst/50 shadow-sm'
                      : 'border-slate-200 dark:border-dark-border hover:border-purple-300 bg-white dark:bg-dark-bg/40'
                  }`}
                >
                  <div>
                    <div className={`w-full h-8 rounded-lg mb-2 bg-gradient-to-r ${style.preview}`} />
                    <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                      {style.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                      {style.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateDeck}
            disabled={generating}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Keynote Slides...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Generate Presentation ({slideCount} Slides)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Slide Deck Workspace */}
      {currentDeck.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
          {/* Left Thumbnail Strip (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                <span className="font-display font-bold text-xs text-slate-900 dark:text-white">
                  Slides ({currentDeck.length})
                </span>
                <button
                  onClick={addNewSlide}
                  className="p-1 text-purple-700 dark:text-brand-lavender hover:bg-purple-100 dark:hover:bg-brand-amethyst/60 rounded-lg"
                  title="Add Slide"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {currentDeck.map((slide, idx) => {
                  const isSelected = activeSlideIndex === idx;
                  return (
                    <div
                      key={slide.id || idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border text-left select-none relative group ${
                        isSelected
                          ? 'border-purple-600 dark:border-brand-lavender bg-purple-50 dark:bg-brand-amethyst/60 ring-2 ring-purple-400/40 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-brand-lavender">
                          #{idx + 1}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          {slide.layout}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {slide.title || 'Untitled Slide'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Slide Canvas & In-Place Editor (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {activeSlide && (
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
                {/* Slide Toolbar */}
                <div className="p-3 bg-slate-50 dark:bg-dark-bg/60 border-b border-slate-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst px-2.5 py-0.5 rounded-md">
                      Slide {activeSlideIndex + 1} of {currentDeck.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveSlide('up')}
                      disabled={activeSlideIndex === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 rounded-lg"
                      title="Move Slide Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSlide('down')}
                      disabled={activeSlideIndex === currentDeck.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 rounded-lg"
                      title="Move Slide Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={duplicateCurrentSlide}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
                      title="Duplicate Slide"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={deleteCurrentSlide}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Keynote Slide Canvas (16:9 Presentation Simulation) */}
                <div className="p-8 bg-slate-900 flex items-center justify-center">
                  <div className="w-full max-w-3xl aspect-[16/9] bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 rounded-2xl p-8 text-white shadow-2xl border border-purple-500/30 flex flex-col justify-between relative overflow-hidden">
                    {/* Top Watermark */}
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-400 tracking-wider">
                      <span>EASYDOC KEYNOTE STUDIO • {selectedStyle.toUpperCase()}</span>
                      <span>SLIDE {activeSlideIndex + 1}</span>
                    </div>

                    {/* Main Slide Content */}
                    <div className="space-y-4 my-auto">
                      <input
                        type="text"
                        value={activeSlide.title}
                        onChange={(e) => updateActiveSlide('title', e.target.value)}
                        placeholder="Slide Title..."
                        className="w-full bg-transparent font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight border-b border-purple-500/40 focus:border-purple-300 focus:outline-none pb-1"
                      />

                      {activeSlide.subtitle && (
                        <input
                          type="text"
                          value={activeSlide.subtitle}
                          onChange={(e) => updateActiveSlide('subtitle', e.target.value)}
                          placeholder="Slide Subtitle..."
                          className="w-full bg-transparent text-xs sm:text-sm font-medium text-purple-200 focus:outline-none"
                        />
                      )}

                      {/* Bullets List */}
                      <div className="space-y-2 pt-2">
                        {activeSlide.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start space-x-2 group">
                            <span className="text-purple-400 font-bold mt-0.5">•</span>
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => updateBulletPoint(bIdx, e.target.value)}
                              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 focus:outline-none border-b border-transparent focus:border-purple-400/50"
                            />
                            <button
                              onClick={() => removeBulletPoint(bIdx)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-400 hover:text-rose-300 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={addBulletPoint}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-purple-300 hover:text-white pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet Point</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-purple-300/80 pt-2 border-t border-purple-500/20">
                      <span>EasyDoc AI Document Platform</span>
                      <span>Verified High-Precision Keynote</span>
                    </div>
                  </div>
                </div>

                {/* Speaker Notes */}
                <div className="p-4 bg-slate-50 dark:bg-dark-bg/60 border-t border-slate-200 dark:border-dark-border space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Speaker / Presenter Notes
                  </label>
                  <textarea
                    rows={2}
                    value={activeSlide.notes || ''}
                    onChange={(e) => updateActiveSlide('notes', e.target.value)}
                    placeholder="Private notes to reference during presentation or viva defense..."
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PresentationStudioPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-brand-purple" />
          <span>Loading Presentation Studio...</span>
        </div>
      }
    >
      <PresentationStudioContent />
    </React.Suspense>
  );
}

