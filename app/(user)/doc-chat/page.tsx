'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  Upload,
  FileText,
  FileSpreadsheet,
  Layers,
  Send,
  Loader2,
  Trash2,
  Volume2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  ArrowRight,
  HelpCircle,
  FileCheck2,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { ChatMessage, DocumentChunk, DocumentItem, DocumentSourceReference } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SAMPLE_PRESETS = [
  {
    title: 'Distributed Cloud Architecture & Microservices Specification',
    content: `# Distributed Cloud Architecture & Microservices Specification
## 1. Executive Summary & Objectives
This engineering document specifies the technical architecture, fault-tolerance mechanisms, and deployment strategies for an enterprise high-availability microservices ecosystem. The primary SLA objective is sub-200ms P95 latency and 99.99% system availability under 100,000 concurrent transactions per second.

## 2. System Architecture & Topology
The platform operates on a decoupled multi-tier topology:
- **API Gateway Tier:** Envoy Proxy with rate-limiting token buckets and JWT authentication filters.
- **Service Mesh Tier:** Istio sidecar proxies routing traffic with mutual TLS (mTLS) cryptographic encryption.
- **Message Broker:** Apache Kafka configured with 3x replication factor and idempotent consumer groups.
- **Storage Layer:** Multi-region PostgreSQL clusters utilizing CockroachDB consensus for cross-region transactional consistency and Redis Sentinel clusters for in-memory session caching.

## 3. Security & Compliance Protocols
All inter-service communications enforce Zero-Trust architecture. Ingress traffic is sanitized by a Web Application Firewall (WAF) blocking OWASP Top 10 exploits, SQL injection vectors, and distributed denial-of-service (DDoS) flood attacks. Data at rest is encrypted using AES-256 GCM with customer-managed keys rotated every 90 days.

## 4. Disaster Recovery & Backup Strategy
The recovery time objective (RTO) is capped at 15 minutes, with a recovery point objective (RPO) of zero data loss via synchronous WAL streaming. Automated failover drills execute bi-weekly across AWS us-east-1 and us-west-2 availability zones.`,
  },
  {
    title: 'Hospital Clinical EHR & Medical Diagnostic Protocol',
    content: `# Hospital Clinical EHR & Medical Diagnostic Protocol
## 1. Scope & HIPAA Compliance
This clinical protocol defines the operational procedures for electronic health record (EHR) data synchronization, deep learning diagnostic image segmentation, and patient telemetry intake in compliance with HIPAA Title II security standards and FHIR Release 4 guidelines.

## 2. Diagnostic Imaging Pipeline
Medical imaging scans (DICOM format) uploaded from MRI and CT scanners are pre-processed through a de-identification pipeline removing all 18 HIPAA Safe Harbor identifiers. Deep convolutional neural network (CNN) inference models evaluate chest radiographs for pulmonary opacities and pneumothorax with a 98.4% diagnostic sensitivity.

## 3. Emergency Triage & Telemetry
Patient telemetry sensors continuously stream vital signs (heart rate, SpO2, systolic/diastolic blood pressure) at 10Hz intervals over secure WebSockets. Threshold violations trigger automated triage escalation directly to the on-duty intensive care physician's pager within 3 seconds.

## 4. Prescription & Pharmacy Audit Trail
All pharmaceutical prescriptions require dual cryptographic digital signatures from the attending physician and a registered clinical pharmacist. Controlled substance dispensations are logged to an immutable ledger for federal regulatory auditing.`,
  },
];

export default function DocumentChatPage() {
  // Mode: 'upload' | 'workspace' | 'preset'
  const [sourceMode, setSourceMode] = useState<'upload' | 'workspace' | 'preset'>('upload');
  const [workspaceDocs, setWorkspaceDocs] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);

  // Active Document State
  const [activeTitle, setActiveTitle] = useState<string>('Sample Cloud Architecture');
  const [activeFileType, setActiveFileType] = useState<string>('text/markdown');
  const [totalWords, setTotalWords] = useState<number>(380);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showChunksDrawer, setShowChunksDrawer] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWorkspaceDocuments();
    // Load default preset on initial mount
    handleLoadPreset(SAMPLE_PRESETS[0]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const fetchWorkspaceDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setWorkspaceDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  // 1. Handle File Upload (PDF, DOCX, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/doc-chat/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setActiveTitle(data.documentTitle);
        setActiveFileType(data.fileType);
        setTotalWords(data.totalWords || 0);
        setChunks(data.chunks || []);
        setSuggestedQuestions(data.suggestedQuestions || []);

        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: `Document **"${data.documentTitle}"** loaded successfully (${data.chunkCount} chunks, ${data.totalWords} words). Ask me any question based on its contents!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to extract text from file.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error processing uploaded file.');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 2. Handle Load from Workspace Documents
  const handleSelectWorkspaceDoc = async (doc: DocumentItem) => {
    setExtracting(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/doc-chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveTitle(data.documentTitle);
        setActiveFileType(data.fileType);
        setTotalWords(data.totalWords || 0);
        setChunks(data.chunks || []);
        setSuggestedQuestions(data.suggestedQuestions || []);

        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: `Workspace document **"${data.documentTitle}"** loaded (${data.chunkCount} chunks). Ask me anything!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to load document');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error loading document.');
    } finally {
      setExtracting(false);
    }
  };

  // 3. Handle Load Preset
  const handleLoadPreset = async (preset: typeof SAMPLE_PRESETS[0]) => {
    setExtracting(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/doc-chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: preset.content, title: preset.title }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveTitle(data.documentTitle);
        setActiveFileType(data.fileType);
        setTotalWords(data.totalWords || 0);
        setChunks(data.chunks || []);
        setSuggestedQuestions(data.suggestedQuestions || []);

        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: `Sample document **"${data.documentTitle}"** loaded. Ask any question about its architecture or protocols!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  // 4. Send Chat Query
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isQuerying || chunks.length === 0) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/doc-chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          documentTitle: activeTitle,
          chunks,
          chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          sources: data.relevantSources || [],
          isAvailable: data.isAvailable,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Failed to query document.');
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, an error occurred while searching the document. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared. Ask me any question based on **"${activeTitle}"**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ''));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full text-xs font-bold mb-2 border border-purple-200 dark:border-brand-lavender/30">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Feature • Document Chat & Grounded QA Studio</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Document Chat Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Upload PDF, DOCX, or TXT documents and ask questions answered strictly with verified source references.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChunksDrawer(!showChunksDrawer)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
            <span>Inspect Chunks ({chunks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Source & Metadata Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Document Loader Box */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                <span>Select Document Source</span>
              </h3>
            </div>

            {/* Source Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-dark-bg p-1 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`py-1.5 rounded-lg transition-all ${
                  sourceMode === 'upload'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('workspace')}
                className={`py-1.5 rounded-lg transition-all ${
                  sourceMode === 'workspace'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('preset')}
                className={`py-1.5 rounded-lg transition-all ${
                  sourceMode === 'preset'
                    ? 'bg-white dark:bg-dark-surface text-purple-800 dark:text-brand-lavender shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Presets
              </button>
            </div>

            {/* Tab 1: File Upload */}
            {sourceMode === 'upload' && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 dark:border-brand-lavender/40 hover:border-purple-500 dark:hover:border-brand-lavender bg-purple-50/50 dark:bg-brand-amethyst/10 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Click to upload or drag & drop
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Supports PDF, DOCX, TXT, and MD files (up to 25MB)
                    </span>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Workspace Documents */}
            {sourceMode === 'workspace' && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {workspaceDocs.length > 0 ? (
                  workspaceDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectWorkspaceDoc(doc)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between ${
                        activeTitle === doc.title
                          ? 'bg-purple-100 dark:bg-brand-amethyst/60 border-purple-400 dark:border-brand-lavender text-purple-900 dark:text-brand-lavender font-bold'
                          : 'border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <span className="text-xs font-bold truncate block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No documents found in workspace. Try uploading a file or picking a preset.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Presets */}
            {sourceMode === 'preset' && (
              <div className="space-y-2">
                {SAMPLE_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLoadPreset(p)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                      activeTitle === p.title
                        ? 'bg-purple-100 dark:bg-brand-amethyst/60 border-purple-400 dark:border-brand-lavender text-purple-900 dark:text-brand-lavender font-bold'
                        : 'border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold line-clamp-1">{p.title}</span>
                    <span className="text-[10px] text-slate-500">Click to index & load preset</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Document Overview Card */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active Indexed Document:</span>
            </span>

            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                {activeTitle}
              </h4>
              <p className="text-xs text-slate-500">
                Format: <span className="font-semibold text-purple-700 dark:text-brand-lavender">{activeFileType}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-dark-border text-center">
              <div className="p-2 bg-slate-50 dark:bg-dark-bg/60 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Words</span>
                <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                  {totalWords}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-dark-bg/60 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Semantic Chunks</span>
                <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                  {chunks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Chat Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden h-[750px]">
          {/* Chat Header Ribbon */}
          <div className="p-4 bg-slate-50 dark:bg-dark-bg/80 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {activeTitle}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  Grounded QA • Answers strictly from document content
                </p>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {extracting ? (
              <div className="py-28 text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-brand-lavender mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Indexing Document & Generating Semantic Chunks...
                </p>
              </div>
            ) : (
              <>
                {/* Suggested Questions Pills */}
                {suggestedQuestions.length > 0 && messages.length <= 1 && (
                  <div className="space-y-2 p-4 bg-purple-50 dark:bg-brand-amethyst/20 border border-purple-200 dark:border-brand-lavender/30 rounded-2xl animate-fade-in">
                    <span className="text-xs font-bold text-purple-900 dark:text-brand-lavender flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Suggested Questions for this Document:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-left text-xs text-slate-800 dark:text-slate-200 hover:text-purple-700 dark:hover:text-brand-lavender bg-white dark:bg-dark-surface p-2.5 rounded-xl border border-purple-100 dark:border-dark-border hover:border-purple-300 transition-all font-medium flex items-center justify-between group"
                        >
                          <span className="line-clamp-2">{q}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages List */}
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-scale-in`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-dark-bg text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-dark-border rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {/* Source References Accordion */}
                        {!isUser && m.sources && m.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-dark-border space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Verified Source References ({m.sources.length}):</span>
                            </span>

                            <div className="space-y-1.5">
                              {m.sources.map((src, sIdx) => {
                                const sourceKey = `${m.id}-${sIdx}`;
                                const isExpanded = expandedSourceIndex === sourceKey;

                                return (
                                  <div
                                    key={sIdx}
                                    className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedSourceIndex(isExpanded ? null : sourceKey)
                                      }
                                      className="w-full p-2 flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover"
                                    >
                                      <span className="truncate pr-1">
                                        Chunk #{src.chunkIndex} • {src.sectionTitle}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                      )}
                                    </button>

                                    {isExpanded && (
                                      <div className="p-2.5 bg-slate-50 dark:bg-dark-bg/60 border-t border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 italic text-[11px]">
                                        "{src.snippet}"
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center space-x-2 px-1 text-[10px] text-slate-400">
                        <span>{m.timestamp}</span>
                        {!isUser && (
                          <>
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="hover:text-purple-600 transition-colors"
                              title="Copy Answer"
                            >
                              {copiedMsgId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleSpeak(m.content)}
                              className="hover:text-purple-600 transition-colors"
                              title="Read Aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isQuerying && (
                  <div className="flex items-center space-x-2 text-xs text-purple-700 dark:text-brand-lavender bg-purple-50 dark:bg-brand-amethyst/30 p-3.5 rounded-2xl w-fit animate-pulse border border-purple-200 dark:border-brand-lavender/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-semibold">Retrieving relevant chunks & synthesizing answer...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Question Input Bar */}
          <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end space-x-2"
            >
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question about this document... (Enter to send, Shift+Enter for newline)"
                disabled={isQuerying || extracting || chunks.length === 0}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isQuerying || extracting || chunks.length === 0}
                className="p-3 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white rounded-xl shadow-md hover:scale-105 transition-all disabled:opacity-40 shrink-0"
                title="Send Question"
              >
                {isQuerying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Chunks Inspection Modal / Drawer */}
      {showChunksDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-dark-bg">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Document Chunks & Partitions ({chunks.length})
                </h3>
              </div>
              <button
                onClick={() => setShowChunksDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chunks.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-700 dark:text-brand-lavender font-mono">
                      Chunk #{c.chunkIndex} • {c.sectionTitle}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.wordCount} words</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
