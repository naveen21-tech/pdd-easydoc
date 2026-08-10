'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Eye,
  Plus,
} from 'lucide-react';
import { DocumentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function VerificationManagerPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<{ id: string; url: string; qrDataUrl: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueVerification = async (docId: string, docTitle: string) => {
    setIssuingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/verification`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQrModal({
          id: data.verification.verificationId,
          url: data.verificationUrl,
          qrDataUrl: data.qrDataUrl,
          title: docTitle,
        });
        setToastMessage(`Issued Verification ID: ${data.verification.verificationId}`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIssuingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Copied to clipboard!');
    setTimeout(() => setToastMessage(null), 2500);
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Feature 5 • Document Verification & QR Registry</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
            Document Verification Registry
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Issue tamper-proof verification badges, generate QR codes, and manage public credentials.
          </p>
        </div>

        <Link
          href="/verify"
          target="_blank"
          className="inline-flex items-center space-x-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-hover transition-all"
        >
          <span>Open Public Verify Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Documents Table for Verification Issuance */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Your Documents & Verification Credentials
          </h3>
          <span className="text-xs font-bold bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-3 py-1 rounded-full">
            {documents.length} Total Documents
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-brand-purple" />
            <span>Loading document registry...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-sm">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border font-bold text-purple-700 dark:text-brand-lavender uppercase tracking-wider">
                  <th className="pb-3">Document Title</th>
                  <th className="pb-3">Date Created</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-dark-hover/80 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {doc.title}
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleIssueVerification(doc.id, doc.title)}
                        disabled={issuingId === doc.id}
                        className="inline-flex items-center space-x-1 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender border border-purple-200 dark:border-brand-lavender/30 px-3 py-1.5 rounded-xl font-bold hover:bg-purple-200 transition-all disabled:opacity-50"
                      >
                        {issuingId === doc.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <QrCode className="w-3.5 h-3.5" />
                        )}
                        <span>Issue QR & Credential</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal Display */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-in text-center">
            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                Official Verification Credential
              </h3>
              <p className="text-xs text-slate-500 truncate">{activeQrModal.title}</p>
            </div>

            <div className="p-6 bg-purple-50 dark:bg-dark-bg/80 rounded-2xl border border-purple-200 dark:border-dark-border flex flex-col items-center justify-center space-y-4">
              {activeQrModal.qrDataUrl ? (
                <img
                  src={activeQrModal.qrDataUrl}
                  alt="Verification QR Code"
                  className="w-48 h-48 rounded-xl shadow-md border border-purple-300 dark:border-brand-lavender/40"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender">
                  Verification Code
                </span>
                <p className="font-mono font-black text-base text-slate-900 dark:text-white">
                  {activeQrModal.id}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(activeQrModal.url)}
                className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-purple-100 dark:bg-brand-amethyst text-purple-900 dark:text-brand-lavender font-bold text-xs py-2.5 rounded-xl border border-purple-200 dark:border-brand-lavender/30"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Verification URL</span>
              </button>

              <button
                onClick={() => setActiveQrModal(null)}
                className="bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
