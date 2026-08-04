'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/editor/DocumentEditor';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error('Failed to load document');

      const data = await res.json();
      setDocument(data.document);
    } catch (err: any) {
      setError(err.message || 'Error loading document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (title: string, content: string) => {
    const res = await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) {
      throw new Error('Failed to save document');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium">Opening Word-Style Editor...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-red-500 font-semibold text-sm">{error || 'Document not found'}</p>
        <Link
          href="/history"
          className="inline-flex items-center space-x-2 bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to History</span>
        </Link>
      </div>

      <DocumentEditor
        documentId={documentId}
        initialTitle={document.title}
        initialContent={document.content}
        onSave={handleSave}
      />
    </div>
  );
}
