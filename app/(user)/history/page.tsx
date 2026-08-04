'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Save,
  Loader2,
  FileCode,
  AlertCircle,
  FileType,
} from 'lucide-react';
import { downloadDocumentFile, ExportFormat } from '@/lib/download';

export default function HistoryPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
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

  const handleOpenDoc = (doc: any) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setErrorMessage(null);
    setToastMessage(null);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === selectedDoc.id ? data.document : d))
        );
        setSelectedDoc(data.document);
        setToastMessage('Document updated successfully.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDoc?.id === id) setSelectedDoc(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerDownload = (docId: string, title: string, format: ExportFormat) => {
    setErrorMessage(null);
    setToastMessage(null);

    downloadDocumentFile({
      documentId: docId,
      title,
      format,
      onStart: () => {
        setDownloadingDocId(docId);
        setDownloadingFormat(format);
      },
      onSuccess: (filename) => {
        setToastMessage(`Downloaded "${filename}" successfully!`);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onFinish: () => {
        setDownloadingDocId(null);
        setDownloadingFormat(null);
      },
    });
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Document History</h2>
          <p className="text-sm text-slate-500">
            View, edit, and export all your generated AI documents
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 text-ink shadow-sm"
          />
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center space-x-3 text-green-700 text-xs">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading document history...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-sm">No documents found</p>
          <p className="text-xs text-slate-400 mt-1">Generated documents will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const isDownloading = downloadingDocId === doc.id;
            return (
              <div
                key={doc.id}
                className="paper-stack p-6 bg-white rounded-2xl border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.status === 'COMPLETE'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{doc.status}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-ink mb-2 line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {doc.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/editor/${doc.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all hover:shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit in Word Editor</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Format Download Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => triggerDownload(doc.id, doc.title, 'pdf')}
                      disabled={isDownloading}
                      className="px-2 py-1.5 bg-brand-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 disabled:opacity-50"
                      title="Download PDF"
                    >
                      {isDownloading && downloadingFormat === 'pdf' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>PDF</span>
                      )}
                    </button>

                    <button
                      onClick={() => triggerDownload(doc.id, doc.title, 'docx')}
                      disabled={isDownloading}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 disabled:opacity-50"
                      title="Download DOCX"
                    >
                      {isDownloading && downloadingFormat === 'docx' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>DOCX</span>
                      )}
                    </button>

                    <button
                      onClick={() => triggerDownload(doc.id, doc.title, 'txt')}
                      disabled={isDownloading}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 disabled:opacity-50 border border-slate-200"
                      title="Download TXT"
                    >
                      {isDownloading && downloadingFormat === 'txt' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>TXT</span>
                      )}
                    </button>

                    <button
                      onClick={() => triggerDownload(doc.id, doc.title, 'md')}
                      disabled={isDownloading}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 disabled:opacity-50 border border-slate-200"
                      title="Download Markdown"
                    >
                      {isDownloading && downloadingFormat === 'md' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>MD</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-float max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-display text-lg font-bold text-ink bg-transparent focus:outline-none focus:bg-slate-50 px-2 py-1 rounded border border-transparent focus:border-slate-200 w-full mr-4"
              />
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 text-slate-400 hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Document Content (Markdown / HTML)
              </label>
              <textarea
                rows={14}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => triggerDownload(selectedDoc.id, editTitle, 'pdf')}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => triggerDownload(selectedDoc.id, editTitle, 'docx')}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOCX</span>
                </button>

                <button
                  onClick={() => triggerDownload(selectedDoc.id, editTitle, 'txt')}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  <FileType className="w-3.5 h-3.5 text-slate-500" />
                  <span>TXT</span>
                </button>

                <button
                  onClick={() => triggerDownload(selectedDoc.id, editTitle, 'md')}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>MD</span>
                </button>
              </div>

              <button
                onClick={handleSaveDoc}
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
