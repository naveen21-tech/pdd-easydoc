'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  FolderPlus,
  Play,
  FileCode,
  ArrowRight,
  AlertTriangle,
  Wand2,
  Zap,
  LayoutTemplate,
  Search,
  GraduationCap,
  Laptop,
  BookOpen,
  Microscope,
  Award,
  Briefcase,
  Building,
  FileSpreadsheet,
  Cpu,
  X,
  Compass,
} from 'lucide-react';
import { SlideItem, PresentationStyle, PresentationItem, DocumentItem } from '@/lib/types';
import { exportPresentationToPptx } from '@/lib/export/pptx';
import {
  DEFAULT_PRESENTATION_TEMPLATES,
  PRESENTATION_TEMPLATE_CATEGORIES,
  PresentationTemplateItem,
  createDeckFromTemplate,
} from '@/lib/templates/presentation-templates';

export const dynamic = 'force-dynamic';

const PRESENTATION_STYLES: { id: PresentationStyle; name: string; desc: string; preview: string; canvasBg: string; canvasCard: string; accentHex: string }[] = [
  {
    id: 'Project Viva',
    name: 'Project Viva Studio',
    desc: 'Vibrant purple highlights, problem-solution pairs, viva defense cards',
    preview: 'from-purple-900 via-violet-800 to-purple-950',
    canvasBg: 'from-purple-950 via-slate-950 to-indigo-950',
    canvasCard: 'bg-purple-950/80 border-purple-500/40 text-purple-100',
    accentHex: '#C084FC',
  },
  {
    id: 'Academic',
    name: 'Academic Defense',
    desc: 'Formal typography, thesis structure, institutional review format',
    preview: 'from-purple-950 via-purple-800 to-indigo-900',
    canvasBg: 'from-slate-900 via-slate-950 to-purple-950',
    canvasCard: 'bg-slate-900/90 border-purple-400/30 text-slate-100',
    accentHex: '#A78BFA',
  },
  {
    id: 'Corporate',
    name: 'Executive Corporate',
    desc: 'Clean navy slate, high contrast metrics, modern stakeholder layout',
    preview: 'from-slate-900 via-blue-900 to-slate-950',
    canvasBg: 'from-slate-950 via-slate-900 to-blue-950',
    canvasCard: 'bg-slate-900/90 border-sky-500/30 text-slate-100',
    accentHex: '#38BDF8',
  },
  {
    id: 'Minimal',
    name: 'Minimal Modern',
    desc: 'Monochrome elegance, spacious whitespace, clear bullet hierarchy',
    preview: 'from-slate-800 via-slate-700 to-slate-900',
    canvasBg: 'from-slate-900 via-slate-900 to-slate-950',
    canvasCard: 'bg-slate-800/80 border-slate-700 text-slate-100',
    accentHex: '#94A3B8',
  },
  {
    id: 'Technical',
    name: 'Cyber Technical',
    desc: 'Monospace code style, electric cyan accents, engineering topology',
    preview: 'from-slate-950 via-purple-950 to-cyan-950',
    canvasBg: 'from-slate-950 via-black to-cyan-950',
    canvasCard: 'bg-slate-950/90 border-cyan-500/40 text-cyan-100',
    accentHex: '#22D3EE',
  },
];

const TOPIC_PRESETS = [
  {
    title: 'Machine Learning in Healthcare Diagnostics',
    content: 'Deep learning image classification for MRI/CT scans, multi-modal clinical EHR data pipelines, HIPAA compliance, model interpretability, and real-time hospital inference latency benchmarks.',
  },
  {
    title: 'Distributed Cloud Microservices & Kubernetes',
    content: 'High-availability containerized microservices, Kafka event-driven messaging, Redis stateful caching, automated blue-green deployments, and zero-downtime horizontal scaling.',
  },
  {
    title: 'Zero-Trust Cybersecurity & Cryptographic Verification',
    content: 'Identity-first access controls, OAuth 2.0 / OIDC tokens, SHA-256 tamper-proof ledger auditing, automated vulnerability scanning, and end-to-end payload encryption.',
  },
  {
    title: 'Next.js 14 & Supabase Full-Stack Architecture',
    content: 'App Router server components, Supabase PostgreSQL with row-level security, Prisma connection pooling, real-time WebSockets, and Vercel edge deployment.',
  },
  {
    title: 'IoT Smart City Infrastructure & Sensor Networks',
    content: 'Edge computing gateways, MQTT telemetry pipelines, low-power LoRaWAN sensor nodes, anomaly detection algorithms, and real-time municipal dashboard analytics.',
  },
];

const SAMPLE_DEMO_SLIDES: SlideItem[] = [
  {
    id: 'demo-1',
    slideNumber: 1,
    title: 'StudentDoc: Intelligent Document Synthesis Platform',
    subtitle: 'System Architecture & Engineering Defense Presentation',
    bullets: [
      'Ultra-Fast Cloud AI Inference with Groq LPU (llama-3.3-70b-versatile)',
      'Intelligent A4 Word Pagination Engine with Real-Time DOM Virtualization',
      'Tamper-Proof Cryptographic Verification Registry with SHA-256 Checksums & QR Codes',
    ],
    layout: 'title',
    notes: 'Welcome the examination panel, state the project name and thesis objectives clearly.',
  },
  {
    id: 'demo-2',
    slideNumber: 2,
    title: 'Problem Statement & Identified Inefficiencies',
    subtitle: 'Why existing documentation tooling fails engineering teams',
    bullets: [
      'Manual formatting wastes over 40% of developer and researcher technical reporting cycles',
      'Lack of synchronized multi-format export across PDF, Word DOCX, and Keynote PPTX',
      'No verifiable cryptographic proof for published academic and corporate papers',
    ],
    layout: 'content',
    notes: 'Emphasize the pain points and empirical time lost in technical documentation.',
  },
  {
    id: 'demo-3',
    slideNumber: 3,
    title: 'Core System Topology & Microservice Architecture',
    subtitle: 'High-throughput Next.js 14 & Supabase PostgreSQL design',
    bullets: [
      'Edge Middleware routing with Sub-50ms Supabase Session Validation & RLS policies',
      'Prisma Connection Pooling with transactional consistency across all 7 Cyber Studios',
      'In-browser A4 virtual DOM renderer with real-time multi-page word pagination',
    ],
    layout: 'split',
    notes: 'Walk through the architectural tiers from client to database layer.',
  },
  {
    id: 'demo-4',
    slideNumber: 4,
    title: 'Measured Benchmark & Performance Metrics',
    subtitle: 'Empirical load and inference latency results',
    bullets: [
      'Groq Cloud LPU inference latency: < 450ms per multi-page document',
      '100% test pass rate across all 39 App Router static & dynamic endpoints',
      'Zero-loss PPTX & PDF binary compilation in client-side WebAssembly sandbox',
    ],
    layout: 'stats',
    notes: 'Highlight the quantitative benchmarks and latency reduction.',
  },
  {
    id: 'demo-5',
    slideNumber: 5,
    title: 'Conclusion & Technical Q&A Defense',
    subtitle: 'Key Deliverables and Future Scope',
    bullets: [
      'Delivered 7 specialized cyber studios in a unified production suite',
      'Satisfied all rigorous security, ATS formatting, and verification criteria',
      'Floor is now open for Technical Questions & Discussion',
    ],
    layout: 'conclusion',
    notes: 'Conclude firmly and invite panel questions on implementation details.',
  },
];

function getTemplateIcon(iconName: string) {
  switch (iconName) {
    case 'GraduationCap':
      return GraduationCap;
    case 'Laptop':
      return Laptop;
    case 'BookOpen':
      return BookOpen;
    case 'Microscope':
      return Microscope;
    case 'Award':
      return Award;
    case 'Briefcase':
      return Briefcase;
    case 'Building':
      return Building;
    case 'FileSpreadsheet':
      return FileSpreadsheet;
    case 'Cpu':
      return Cpu;
    default:
      return Sparkles;
  }
}

function PresentationStudioContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams?.get('docId');

  // Active Top-Level Creation Mode ('templates' | 'generator')
  const [creationMode, setCreationMode] = useState<'templates' | 'generator'>('templates');

  // Template Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingTemplate, setPreviewingTemplate] = useState<PresentationTemplateItem | null>(null);

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
  const [currentDeckTitle, setCurrentDeckTitle] = useState<string>('StudentDoc Keynote Deck');
  const [savedPresentationId, setSavedPresentationId] = useState<string | null>(null);

  const router = useRouter();
  const [openingInEditor, setOpeningInEditor] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [enhancingSlide, setEnhancingSlide] = useState<boolean>(false);
  const [enrichingDeck, setEnrichingDeck] = useState<boolean>(false);
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
        const docs = dData.documents || [];
        setDocuments(docs);
        if (!selectedDocId && docs.length > 0) {
          setSelectedDocId(docs[0].id);
        } else if (docs.length === 0) {
          setSourceMode('custom');
          setCustomTitle(TOPIC_PRESETS[0].title);
          setCustomContent(TOPIC_PRESETS[0].content);
        }
      }

      if (presRes.ok) {
        const pData = await presRes.json();
        setPastPresentations(pData.presentations || []);
      }
    } catch (e) {
      console.error('Fetch presentation studio user data error:', e);
    }
  };

  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // -------------------------------------------------------------
  // TEMPLATE SELECTION HANDLER
  // -------------------------------------------------------------
  const handleUseTemplate = async (template: PresentationTemplateItem) => {
    const { title, style, slides } = createDeckFromTemplate(template.id);
    setCurrentDeck(slides);
    setCurrentDeckTitle(title);
    setSelectedStyle(style);
    setActiveSlideIndex(0);
    setPreviewingTemplate(null);

    // Auto-save new presentation to database
    try {
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          style,
          slides,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.presentation?.id) {
          setSavedPresentationId(data.presentation.id);
          fetchUserData();
        }
      }
    } catch (e) {
      console.warn('Template auto-save note:', e);
    }

    showToast(`✓ Loaded "${template.name}" template (${template.slideCount} slides)!`);

    // Smooth scroll down to the slide workspace
    const canvasElement = document.getElementById('slide-deck-canvas');
    if (canvasElement) {
      canvasElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyPreset = (preset: { title: string; content: string }) => {
    setSourceMode('custom');
    setCustomTitle(preset.title);
    setCustomContent(preset.content);
    showToast(`Selected topic: "${preset.title}"`, 2500);
  };

  const handleGenerateDeck = async () => {
    let titleToUse = customTitle.trim();
    let contentToUse = customContent.trim();

    if (sourceMode === 'document') {
      if (!selectedDocId) {
        alert('Please select a source document or switch to Custom Text mode.');
        return;
      }
    } else {
      if (!titleToUse && !contentToUse) {
        alert('Please enter a presentation topic or title.');
        return;
      }
    }

    setGenerating(true);
    setToastMessage(null);

    try {
      const payload: any = {
        slideCount: Number(slideCount) || 8,
        style: selectedStyle,
      };

      if (sourceMode === 'document') {
        payload.documentId = selectedDocId;
      } else {
        payload.customTitle = titleToUse || 'Executive Presentation';
        payload.customContent = contentToUse || titleToUse;
      }

      const res = await fetch('/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.slides) {
        setCurrentDeck(data.slides);
        setCurrentDeckTitle(data.title || 'StudentDoc Keynote Deck');
        setSavedPresentationId(data.presentationId);
        setActiveSlideIndex(0);
        showToast(`✓ Generated ${data.slides.length} detailed keynote slides!`, 3500);
        fetchUserData();

        const canvasElement = document.getElementById('slide-deck-canvas');
        if (canvasElement) {
          canvasElement.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        throw new Error(data.error || 'Failed to generate presentation');
      }
    } catch (e: any) {
      console.error('Slide generation error:', e);
      alert('Slide generation notice: ' + (e?.message || 'Please check your connection and try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleEnhanceActiveSlide = async () => {
    if (!activeSlide) return;
    setEnhancingSlide(true);
    try {
      const res = await fetch('/api/presentations/enhance-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckTitle: currentDeckTitle,
          slideTitle: activeSlide.title,
          currentBullets: activeSlide.bullets,
          style: selectedStyle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhanced) {
          const updated = [...currentDeck];
          updated[activeSlideIndex] = {
            ...activeSlide,
            subtitle: data.enhanced.subtitle || activeSlide.subtitle,
            bullets: data.enhanced.bullets || activeSlide.bullets,
            notes: data.enhanced.notes || activeSlide.notes,
          };
          setCurrentDeck(updated);
          showToast(`✓ Slide ${activeSlideIndex + 1} enriched with detailed AI contents!`, 3000);
        }
      }
    } catch (e) {
      console.error('Enhance active slide error:', e);
    } finally {
      setEnhancingSlide(false);
    }
  };

  const handleEnrichEntireDeck = async () => {
    if (currentDeck.length === 0) return;
    setEnrichingDeck(true);
    try {
      const res = await fetch('/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTitle: currentDeckTitle,
          customContent: currentDeckTitle + ' ' + currentDeck.map((s) => s.title).join('. '),
          slideCount: currentDeck.length,
          style: selectedStyle,
        }),
      });

      const data = await res.json();
      if (res.ok && data.slides) {
        setCurrentDeck(data.slides);
        showToast(`✓ All ${data.slides.length} slides enriched with detailed technical contents!`, 3500);
      }
    } catch (e) {
      console.error('Enrich entire deck error:', e);
    } finally {
      setEnrichingDeck(false);
    }
  };

  const handleLoadDemo = () => {
    setCurrentDeck(SAMPLE_DEMO_SLIDES);
    setCurrentDeckTitle('StudentDoc System Architecture Demo');
    setSavedPresentationId(null);
    setActiveSlideIndex(0);
    showToast('Loaded sample demo presentation deck!');
  };

  const handleLoadPastDeck = (pres: any) => {
    if (pres && Array.isArray(pres.slides)) {
      setCurrentDeck(pres.slides);
      setCurrentDeckTitle(pres.title || 'Saved Presentation');
      setSelectedStyle(pres.style || 'Project Viva');
      setSavedPresentationId(pres.id);
      setActiveSlideIndex(0);
      showToast(`Loaded deck "${pres.title}"!`);

      const canvasElement = document.getElementById('slide-deck-canvas');
      if (canvasElement) {
        canvasElement.scrollIntoView({ behavior: 'smooth' });
      }
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
      } else {
        const res = await fetch('/api/presentations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentDeckTitle,
            style: selectedStyle,
            slides: currentDeck,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.presentation?.id) {
            setSavedPresentationId(data.presentation.id);
          }
        }
      }
      showToast('✓ Presentation saved successfully!');
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
      showToast('✓ PPTX Presentation downloaded successfully!');
    } catch (e: any) {
      console.error('PPTX export error:', e);
      alert('Error exporting PPTX: ' + (e?.message || 'Unknown error'));
    } finally {
      setExportingPptx(false);
    }
  };

  const handleOpenInDocumentEditor = async () => {
    if (currentDeck.length === 0) return;
    setOpeningInEditor(true);
    try {
      let markdownContent = `# ${currentDeckTitle}\n\n[TEMPLATE_BADGE] Keynote Presentation • ${selectedStyle}\n\n`;
      markdownContent += `> **Document Type:** Keynote Slide Deck | **Date:** ${new Date().toISOString().split('T')[0]} | **Status:** Finalized\n\n[PAGE BREAK]\n\n`;

      currentDeck.forEach((slide, idx) => {
        markdownContent += `## Slide ${idx + 1}: ${slide.title}\n`;
        if (slide.subtitle) {
          markdownContent += `*${slide.subtitle}*\n\n`;
        }
        slide.bullets.forEach((bullet) => {
          markdownContent += `- ${bullet}\n`;
        });
        if (slide.notes) {
          markdownContent += `\n> **Speaker Notes:** ${slide.notes}\n`;
        }
        markdownContent += `\n[PAGE BREAK]\n\n`;
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentDeckTitle,
          content: markdownContent,
          template: 'Presentation Deck',
          status: 'draft',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.document?.id) {
          router.push(`/editor/${data.document.id}`);
          return;
        }
      }
      throw new Error('Failed to create editable document');
    } catch (e: any) {
      console.error(e);
      alert('Could not open in document editor: ' + (e?.message || 'Unknown error'));
    } finally {
      setOpeningInEditor(false);
    }
  };

  // Active slide helpers
  const activeSlide: SlideItem | undefined = currentDeck[activeSlideIndex];

  const updateActiveSlide = (field: keyof SlideItem, value: any) => {
    if (!activeSlide) return;
    const updated = [...currentDeck];
    updated[activeSlideIndex] = {
      ...activeSlide,
      [field]: value,
    };
    setCurrentDeck(updated);
  };

  const updateBulletPoint = (bulletIndex: number, text: string) => {
    if (!activeSlide) return;
    const updatedBullets = [...activeSlide.bullets];
    updatedBullets[bulletIndex] = text;
    updateActiveSlide('bullets', updatedBullets);
  };

  const deleteBulletPoint = (bulletIndex: number) => {
    if (!activeSlide) return;
    const updatedBullets = activeSlide.bullets.filter((_, idx) => idx !== bulletIndex);
    updateActiveSlide('bullets', updatedBullets);
  };

  const addBulletPoint = () => {
    if (!activeSlide) return;
    updateActiveSlide('bullets', [
      ...activeSlide.bullets,
      'New technical bullet point with clear specifications and impact.',
    ]);
  };

  const addNewSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      slideNumber: currentDeck.length + 1,
      title: 'New Technical Topic',
      subtitle: 'Architecture & Implementation Scope',
      bullets: [
        'Modular architectural component specification with clear responsibilities',
        'Stateful caching and asynchronous pipeline processing mechanisms',
        'Verified compliance benchmarks and high-throughput execution milestones',
      ],
      layout: 'content',
      notes: 'Presenter notes explaining key engineering rationale.',
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

  // Filter templates
  const filteredTemplates = DEFAULT_PRESENTATION_TEMPLATES.filter((t) => {
    const matchesCat = selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCat;
    const matchesQuery =
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.slides.some((s) => s.title.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold animate-slide-up flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Template Outline Preview Modal */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-transparent dark:from-brand-amethyst/20">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: previewingTemplate.accentColor }}
                >
                  {React.createElement(getTemplateIcon(previewingTemplate.iconName), { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender">
                      {previewingTemplate.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {previewingTemplate.slideCount} Slides • {previewingTemplate.style} Theme
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white mt-0.5">
                    {previewingTemplate.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPreviewingTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Slide Outline List */}
            <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-dark-border">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                {previewingTemplate.description}
              </p>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                  Pre-Structured Slide Sequence ({previewingTemplate.slides.length} Slides):
                </h4>
                {previewingTemplate.slides.map((s, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-start space-x-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {s.title}
                        </p>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-bg">
                          {s.layout}
                        </span>
                      </div>
                      {s.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          {s.subtitle}
                        </p>
                      )}
                      <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 pt-0.5">
                        {s.bullets.slice(0, 2).map((b, bIdx) => (
                          <li key={bIdx} className="line-clamp-1">{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 flex items-center justify-between">
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900"
              >
                Close Preview
              </button>

              <button
                onClick={() => handleUseTemplate(previewingTemplate)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all"
              >
                <span>Use This Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <Presentation className="w-3.5 h-3.5" />
            <span>Feature 2 • Presentation & Keynote Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Presentation Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Choose from 10 academic and professional default templates or generate custom 16:9 keynote slide decks with self-hosted AI.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {currentDeck.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-purple-700 dark:text-brand-lavender" />
              <span>Load Sample Demo Deck</span>
            </button>
          )}

          {currentDeck.length > 0 && (
            <>
              <button
                onClick={handleEnrichEntireDeck}
                disabled={enrichingDeck}
                className="inline-flex items-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all"
                title="Use AI to re-populate all slides with deep technical content"
              >
                {enrichingDeck ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">AI Enrich All</span>
              </button>

              <button
                onClick={handleOpenInDocumentEditor}
                disabled={openingInEditor}
                className="inline-flex items-center space-x-1.5 bg-purple-900/60 hover:bg-purple-800 border border-purple-600 text-purple-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Convert this slide deck into a full Word-Style document and open in editor"
              >
                {openingInEditor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5 text-purple-300" />}
                <span className="hidden sm:inline">Open in Word Editor</span>
              </button>

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
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {exportingPptx ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-purple-200" />
                )}
                <span>Download PPTX</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs (Default Templates vs AI Generator) */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-dark-border pb-2">
        <button
          onClick={() => setCreationMode('templates')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all ${
            creationMode === 'templates'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-surface'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Default Presentation Templates</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
            10 Templates
          </span>
        </button>

        <button
          onClick={() => setCreationMode('generator')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all ${
            creationMode === 'generator'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white shadow-lg'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-surface'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Slide Deck Generator</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            llama3.2
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: DEFAULT PRESENTATION TEMPLATES CATALOG              */}
      {/* ------------------------------------------------------------- */}
      {creationMode === 'templates' && (
        <div className="space-y-6 animate-scale-in">
          {/* Filters & Search Bar */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
              {PRESENTATION_TEMPLATE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, slides..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const IconComp = getTemplateIcon(template.iconName);
              return (
                <div
                  key={template.id}
                  className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-purple-400 dark:hover:border-brand-lavender/50 transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: template.accentColor }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${template.badgeBg}`}>
                          {template.category}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-50 dark:bg-brand-amethyst/40 px-2 py-0.5 rounded-md">
                        {template.slideCount} Slides
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-brand-lavender transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    {/* Slide Structure Pills Preview */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Slide Sequence:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {template.slides.slice(0, 4).map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-medium bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md line-clamp-1 max-w-[130px]"
                          >
                            {sIdx + 1}. {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                          </span>
                        ))}
                        {template.slides.length > 4 && (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-brand-lavender px-1.5 py-0.5">
                            +{template.slides.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-dark-border">
                    <button
                      type="button"
                      onClick={() => setPreviewingTemplate(template)}
                      className="flex-1 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md hover:scale-[1.02] transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl space-y-3">
              <Compass className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-display font-bold text-slate-800 dark:text-white">
                No presentation templates match your search
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different keyword or switch to "All Templates" above.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-purple-700 dark:text-brand-lavender underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: AI SLIDE DECK GENERATOR                            */}
      {/* ------------------------------------------------------------- */}
      {creationMode === 'generator' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4 gap-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
              <span>Generate Slides from Document or Topic (llama3.2)</span>
            </h2>

            {/* Source Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
              <button
                onClick={() => setSourceMode('document')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceMode === 'document'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                From Saved Document
              </button>
              <button
                onClick={() => setSourceMode('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sourceMode === 'custom'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Paste Custom Text / Topic
              </button>
            </div>
          </div>

          {sourceMode === 'document' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Source Document ({documents.length} available)
                </label>
                {documents.length > 0 ? (
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
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>No saved documents found in your workspace.</span>
                    <button
                      onClick={() => setSourceMode('custom')}
                      className="font-bold underline text-purple-700 dark:text-brand-lavender"
                    >
                      Switch to Custom Topic
                    </button>
                  </div>
                )}
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
                  <option value={12}>12 Slides (College Project)</option>
                  <option value={15}>15 Slides (Exhaustive Technical)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Topic Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Quick Preset Topics (Click to Populate):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_PRESETS.map((tp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tp)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-brand-lavender/30 bg-purple-50 dark:bg-brand-amethyst/30 hover:bg-purple-100 text-purple-900 dark:text-brand-lavender transition-all"
                    >
                      {tp.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Presentation Title / Topic
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus in Cloud Systems"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Slide Count
                  </label>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value={5}>5 Slides (Pitch Deck)</option>
                    <option value={8}>8 Slides (Standard Overview)</option>
                    <option value={10}>10 Slides (Technical Defense)</option>
                    <option value={12}>12 Slides (College Project)</option>
                    <option value={15}>15 Slides (Comprehensive)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Document Content / Specifications / Keywords
                </label>
                <textarea
                  rows={3}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Add specific keywords, problem descriptions, or specifications to guide the AI..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white"
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
          <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
            <div className="text-xs text-slate-500">
              Selected Style: <strong className="text-purple-700 dark:text-brand-lavender">{selectedStyle}</strong>
            </div>

            <button
              onClick={handleGenerateDeck}
              disabled={generating}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Keynote Slides with llama3.2...</span>
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
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: INTERACTIVE SLIDE DECK CANVAS & EDITOR              */}
      {/* ------------------------------------------------------------- */}
      <div id="slide-deck-canvas">
        {currentDeck.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
            {/* Left Thumbnail Strip (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                  <span className="font-display font-bold text-xs text-slate-900 dark:text-white">
                    Deck Slides ({currentDeck.length})
                  </span>
                  <button
                    onClick={addNewSlide}
                    className="p-1 text-purple-700 dark:text-brand-lavender hover:bg-purple-100 dark:hover:bg-brand-amethyst/60 rounded-lg flex items-center space-x-1 text-xs font-bold"
                    title="Add Slide"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
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
                      <span className="text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst px-2.5 py-1 rounded-lg">
                        Slide {activeSlideIndex + 1} of {currentDeck.length}
                      </span>

                      {/* Layout Selector */}
                      <select
                        value={activeSlide.layout || 'content'}
                        onChange={(e) => updateActiveSlide('layout', e.target.value)}
                        className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200 text-xs font-bold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="title">Title Layout</option>
                        <option value="content">Content Layout</option>
                        <option value="split">Split Columns</option>
                        <option value="stats">Stats & Metrics</option>
                        <option value="conclusion">Conclusion</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* AI Auto-Fill / Enhance Active Slide */}
                      <button
                        onClick={handleEnhanceActiveSlide}
                        disabled={enhancingSlide}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 dark:text-brand-lavender bg-purple-100 dark:bg-brand-amethyst/60 hover:bg-purple-200 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-brand-lavender/30 transition-all mr-1"
                        title="Auto-generate detailed bullet points and speaker notes for this slide based on its title"
                      >
                        {enhancingSlide ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>AI Expand Slide</span>
                      </button>

                      {/* Reorder / Action Buttons */}
                      <button
                        onClick={() => moveSlide('up')}
                        disabled={activeSlideIndex === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-dark-hover disabled:opacity-30"
                        title="Move Slide Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSlide('down')}
                        disabled={activeSlideIndex === currentDeck.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-dark-hover disabled:opacity-30"
                        title="Move Slide Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={duplicateCurrentSlide}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-dark-hover"
                        title="Duplicate Slide"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={deleteCurrentSlide}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 16:9 Slide Canvas */}
                  <div className="p-6 bg-slate-900 flex items-center justify-center">
                    <div
                      className={`w-full aspect-[16/9] rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden bg-gradient-to-br ${
                        PRESENTATION_STYLES.find((s) => s.id === selectedStyle)?.canvasBg ||
                        'from-purple-950 via-slate-950 to-indigo-950'
                      }`}
                    >
                      {/* Top Bar: Slide Header & Title Editing */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-purple-300/80">
                          <span>{currentDeckTitle}</span>
                          <span>Slide {activeSlideIndex + 1}</span>
                        </div>

                        <input
                          type="text"
                          value={activeSlide.title}
                          onChange={(e) => updateActiveSlide('title', e.target.value)}
                          placeholder="Slide Title..."
                          className="w-full bg-transparent border-b border-white/20 text-white font-display font-extrabold text-xl md:text-2xl focus:outline-none focus:border-purple-400 pb-1"
                        />

                        <input
                          type="text"
                          value={activeSlide.subtitle || ''}
                          onChange={(e) => updateActiveSlide('subtitle', e.target.value)}
                          placeholder="Optional Subtitle / Focus Area..."
                          className="w-full bg-transparent border-b border-white/10 text-purple-200 text-xs md:text-sm font-medium focus:outline-none focus:border-purple-400 pb-1"
                        />
                      </div>

                      {/* Middle: Bullets & Content */}
                      <div className="space-y-3 my-4 overflow-y-auto max-h-[220px] pr-2">
                        {activeSlide.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start space-x-2 group">
                            <span className="text-purple-400 font-bold mt-1 text-sm">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => updateBulletPoint(bIdx, e.target.value)}
                              className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-purple-400 transition-all resize-none"
                            />
                            <button
                              onClick={() => deleteBulletPoint(bIdx)}
                              className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-1 transition-opacity"
                              title="Delete Bullet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <div className="flex items-center space-x-3 pt-1">
                          <button
                            onClick={addBulletPoint}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-purple-300 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet Point</span>
                          </button>

                          <button
                            onClick={handleEnhanceActiveSlide}
                            disabled={enhancingSlide}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI Auto-Expand Points</span>
                          </button>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-purple-300/80 pt-2 border-t border-purple-500/20">
                        <span>StudentDoc AI Keynote Studio</span>
                        <span>Verified High-Precision Keynote • 16:9</span>
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

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: SAVED PRESENTATIONS                                */}
      {/* ------------------------------------------------------------- */}
      {pastPresentations.length > 0 && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Presentation className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
              <span>Your Saved Slide Decks ({pastPresentations.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastPresentations.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/40 flex flex-col justify-between space-y-3 hover:border-purple-400 transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-brand-lavender">
                    {p.style} Theme • {Array.isArray(p.slides) ? p.slides.length : 0} Slides
                  </span>
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {p.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60 dark:border-dark-border">
                  <button
                    onClick={() => handleLoadPastDeck(p)}
                    className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <span>Open in Editor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
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
