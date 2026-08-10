'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DirectVerifyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      verifyCredential(id);
    }
  }, [id]);

  const verifyCredential = async (rawId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/verify/${encodeURIComponent(rawId.trim().toUpperCase())}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({ found: false });
      }
    } catch (e) {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Brand Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center font-display font-extrabold text-xl text-white shadow-lg">
            E
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight text-white block">
              Easy<span className="text-purple-400">Doc</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300/80 block">
              Registry & Verification
            </span>
          </div>
        </Link>

        <Link
          href="/verify"
          className="text-xs font-bold text-purple-300 hover:text-white bg-purple-950/60 border border-purple-800/60 px-4 py-2 rounded-xl transition-all"
        >
          Search Another ID
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto space-y-8 my-auto py-12">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="font-bold">Verifying cryptographic credential for {id}...</span>
          </div>
        ) : result?.found ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-in">
            {result.isRevoked ? (
              <div className="flex items-center space-x-3 p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-300">
                <AlertTriangle className="w-7 h-7 shrink-0 text-amber-400" />
                <div>
                  <h2 className="font-display font-bold text-base">⚠ Document Credential Revoked</h2>
                  <p className="text-xs text-amber-300/80">
                    This document was marked as revoked by the issuing authority.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300">
                <CheckCircle2 className="w-7 h-7 shrink-0 text-emerald-400" />
                <div>
                  <h2 className="font-display font-bold text-base">✓ Document Authenticity Verified</h2>
                  <p className="text-xs text-emerald-300/80">
                    Officially issued and registered in the EasyDoc Security Registry.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Document Title
                </span>
                <p className="font-bold text-white text-sm">{result.documentTitle}</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Verification ID
                </span>
                <p className="font-mono font-bold text-purple-400 text-sm">{result.verificationId}</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Issued Date
                </span>
                <p className="font-bold text-slate-200">
                  {new Date(result.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Integrity Checksum
                </span>
                <p className="font-mono text-[11px] text-slate-400 truncate">{result.checksum}</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500 inline-flex items-center space-x-1">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>Private document contents are strictly protected and never exposed publicly.</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl animate-scale-in">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="font-display font-bold text-xl text-white">Document Not Found</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The verification ID <span className="font-mono font-bold text-purple-400">"{id}"</span> does not match any valid record.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center space-x-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Verification Search</span>
            </Link>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-900">
        EasyDoc Security & Verification Registry • Cryptographic Integrity Verified
      </footer>
    </div>
  );
}
