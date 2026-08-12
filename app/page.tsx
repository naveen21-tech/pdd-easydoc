import Link from 'next/link';
import { Sparkles, FileText, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold text-xl shadow-md">
              S
            </div>
            <span className="font-display text-2xl font-bold text-ink">
              Student<span className="text-brand-600">Doc</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-ink hover:text-brand-600 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-brand-600 text-white hover:bg-blue-700 transition-all px-5 py-2.5 rounded-lg shadow-sm hover:shadow"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-brand-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Next-Gen Document Intelligence</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-ink leading-tight max-w-4xl mb-6">
          Generate Production-Ready <span className="text-brand-600">Documents & Reports</span> in Seconds
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Powered by OpenAI, Anthropic Claude, and Google Gemini. Seamlessly draft, customize, and export professional PDFs & DOCX files with enterprise Row-Level Security.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
          >
            <span>Start Generating Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-ink font-semibold px-8 py-3.5 rounded-xl text-base border border-border shadow-sm transition-all"
          >
            <span>Demo Dashboard</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left mt-8">
          <div className="paper-stack p-6 bg-white rounded-xl border border-border">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink mb-2">Multi-Model AI</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose dynamically between GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Flash based on your document needs.
            </p>
          </div>

          <div className="paper-stack p-6 bg-white rounded-xl border border-border">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink mb-2">Instant PDF & DOCX Export</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Export pixel-perfect PDF documents and fully editable Microsoft Word DOCX files with custom corporate styling.
            </p>
          </div>

          <div className="paper-stack p-6 bg-white rounded-xl border border-border">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink mb-2">Supabase Auth & RLS</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Strict Postgres Row Level Security isolates every document to its owner while giving admins complete analytics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8 px-6 text-center text-xs text-slate-500">
        StudentDoc &copy; {new Date().getFullYear()} — Production-Ready AI Document Generator. Built with Supabase & Vercel.
      </footer>
    </div>
  );
}
