'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Lock,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PublicVerifyPage() {
  const router = useRouter();
  const [queryId, setQueryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = queryId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(cleanId)}`);
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
          href="/dashboard"
          className="text-xs font-bold text-purple-300 hover:text-white bg-purple-950/60 border border-purple-800/60 px-4 py-2 rounded-xl transition-all"
        >
          Open App
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-2xl w-full mx-auto space-y-8 my-auto py-12">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Document Verification Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Verify the authenticity and tamper-proof issuance of any official EasyDoc document.
          </p>
        </div>

        {/* Verification ID Input Form */}
        <form
          onSubmit={handleVerify}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3 rounded-2xl shadow-2xl flex items-center gap-2"
        >
          <div className="flex-1 flex items-center space-x-3 px-3">
            <Search className="w-5 h-5 text-purple-400 shrink-0" />
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="e.g. EDOC-2026-8F92A71C"
              className="w-full bg-transparent text-sm sm:text-base font-mono font-bold text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !queryId.trim()}
            className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Credential</span>}
          </button>
        </form>

        {/* Verification Result Display */}
        {searched && (
          <div className="animate-scale-in">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2 bg-slate-900/60 rounded-2xl border border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Checking global cryptographic registry...</span>
              </div>
            ) : result?.found ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                {result.isRevoked ? (
                  <div className="flex items-center space-x-3 p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-300">
                    <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400" />
                    <div>
                      <h3 className="font-display font-bold text-sm">Document Credential Revoked</h3>
                      <p className="text-xs text-amber-300/80">
                        This document was formally revoked by the issuing author on{' '}
                        {result.revokedAt ? new Date(result.revokedAt).toLocaleDateString() : 'recent date'}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300">
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                    <div>
                      <h3 className="font-display font-bold text-sm">✓ Document Authenticity Verified</h3>
                      <p className="text-xs text-emerald-300/80">
                        Valid cryptographic record issued through the EasyDoc Security Registry.
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="font-display font-bold text-lg text-white">Document Not Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The verification ID <span className="font-mono font-bold text-purple-400">"{queryId}"</span> was not found in the EasyDoc verification registry.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-900">
        EasyDoc Security & Verification Registry • SHA-256 Tamper Protection
      </footer>
    </div>
  );
}
