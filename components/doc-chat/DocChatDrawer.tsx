'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Volume2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  HelpCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { ChatMessage, DocumentChunk, DocumentSourceReference } from '@/lib/types';

interface DocChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent?: string;
  documentId?: string;
  chunks?: DocumentChunk[];
}

export function DocChatDrawer({
  isOpen,
  onClose,
  documentTitle,
  documentContent,
  documentId,
  chunks: initialChunks,
}: DocChatDrawerProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>(initialChunks || []);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!chunks || chunks.length === 0) {
        extractDocument();
      }
    }
  }, [isOpen, documentId, documentContent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const extractDocument = async () => {
    setExtracting(true);
    try {
      let body: any = {};
      if (documentId) {
        body.documentId = documentId;
      } else if (documentContent) {
        body.text = documentContent;
        body.title = documentTitle;
      } else {
        return;
      }

      const res = await fetch('/api/doc-chat/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
        setSuggestedQuestions(data.suggestedQuestions || []);

        if (messages.length === 0) {
          setMessages([
            {
              id: 'welcome-msg',
              role: 'assistant',
              content: `Hello! I'm ready to answer any questions about **"${documentTitle}"**. What would you like to know?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      }
    } catch (e) {
      console.error('DocChat extract error:', e);
    } finally {
      setExtracting(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isQuerying) return;

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
          documentTitle,
          chunks,
          documentId,
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
        throw new Error('Failed to query document');
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, an error occurred while searching the document. Please try asking again.',
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
        content: `Chat cleared. Ask me any question about **"${documentTitle}"**.`,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-dark-surface shadow-2xl border-l border-slate-200 dark:border-dark-border flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-dark-bg/80">
        <div className="flex items-center space-x-2 truncate pr-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-brand-amethyst text-purple-700 dark:text-brand-lavender flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              Chat with Document
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {documentTitle} • {chunks.length} Chunks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-hover transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-dark-hover transition-colors"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body / Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {extracting ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-brand-lavender mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Indexing & Chunking Document...
            </p>
          </div>
        ) : (
          <>
            {/* Suggested Questions Chips */}
            {suggestedQuestions.length > 0 && messages.length <= 1 && (
              <div className="space-y-2 p-3 bg-purple-50 dark:bg-brand-amethyst/20 border border-purple-200 dark:border-brand-lavender/30 rounded-2xl animate-fade-in">
                <span className="text-[11px] font-bold text-purple-900 dark:text-brand-lavender flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Suggested Questions:</span>
                </span>
                <div className="flex flex-col space-y-1.5">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-xs text-slate-800 dark:text-slate-200 hover:text-purple-700 dark:hover:text-brand-lavender bg-white dark:bg-dark-surface p-2 rounded-xl border border-purple-100 dark:border-dark-border hover:border-purple-300 transition-all font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Feed */}
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-dark-bg text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-dark-border rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Source References Accordion for Assistant */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-dark-border/80 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Sources Referenced ({m.sources.length})</span>
                        </span>

                        <div className="space-y-1">
                          {m.sources.map((src, sIdx) => {
                            const sourceKey = `${m.id}-${sIdx}`;
                            const isExpanded = expandedSourceIndex === sourceKey;

                            return (
                              <div
                                key={sIdx}
                                className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-[11px] overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSourceIndex(isExpanded ? null : sourceKey)
                                  }
                                  className="w-full p-1.5 flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover"
                                >
                                  <span className="truncate pr-1">
                                    Chunk #{src.chunkIndex} • {src.sectionTitle}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 shrink-0" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="p-2 bg-slate-50 dark:bg-dark-bg/60 border-t border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 italic">
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

                  {/* Message Meta / Action Toolbar */}
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
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSpeak(m.content)}
                          className="hover:text-purple-600 transition-colors"
                          title="Read Answer Aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isQuerying && (
              <div className="flex items-center space-x-2 text-xs text-purple-700 dark:text-brand-lavender bg-purple-50 dark:bg-brand-amethyst/30 p-3 rounded-2xl w-fit animate-pulse border border-purple-200 dark:border-brand-lavender/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-semibold">Searching document context & synthesizing answer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Ribbon */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end space-x-2"
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this document... (Press Enter to send)"
            disabled={isQuerying || extracting}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isQuerying || extracting}
            className="p-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white rounded-xl shadow-md hover:scale-105 transition-all disabled:opacity-40 shrink-0"
            title="Send Question"
          >
            {isQuerying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
