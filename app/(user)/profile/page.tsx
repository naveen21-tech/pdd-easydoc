'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Engine API Key State (Masked Display)
  const groqApiKey = 'gsk_HmHZ••••••••••••••••••••0oZF2Z';
  const geminiApiKey = 'AQ.Ab8RN••••••••••••••••••••4kPQ';
  const openaiApiKey = 'sk-proj-••••••••••••••••••••66kA';

  const [showGroqKey, setShowGroqKey] = useState(false);
  const [copiedGroq, setCopiedGroq] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [copiedGemini, setCopiedGemini] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [copiedOpenAI, setCopiedOpenAI] = useState(false);

  const [testingPing, setTestingPing] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'ok' | 'error' | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setName(data.profile?.name || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const testGroqPing = async () => {
    setTestingPing(true);
    setPingLatency(null);
    setPingStatus(null);
    try {
      const startTime = Date.now();
      const res = await fetch('/api/ai/health');
      const data = await res.json();
      const latency = data.groq?.latencyMs || Date.now() - startTime;
      setPingLatency(latency);
      setPingStatus(res.ok && data.status !== 'unhealthy' ? 'ok' : 'error');
    } catch (e) {
      setPingStatus('error');
    } finally {
      setTestingPing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      const data = await res.json();
      setProfile(data.profile);
      setMessage('Profile name updated successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setUpdatingPassword(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage('Password changed successfully.');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Account & Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, AI inference keys, subscription plan, and security settings
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 flex items-center space-x-3 text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center space-x-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* AI Inference & API Key Management Card */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-purple-200 dark:border-purple-900/50 p-6 shadow-card space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>AI Inference Engine & API Keys</span>
              </h3>
              <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Groq LPU Active</span>
              </span>
            </div>

            {/* Groq Primary Engine */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 dark:from-purple-950/30 to-indigo-50 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-purple-600 dark:text-brand-lavender" />
                  <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                    Primary Engine: Groq LPU
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  openai/gpt-oss-120b
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                  Groq API Key
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      readOnly
                      value={groqApiKey}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-mono text-slate-900 dark:text-emerald-300 select-all focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="p-2.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                    title={showGroqKey ? 'Hide API Key' : 'Show Full Key'}
                  >
                    {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(groqApiKey);
                      setCopiedGroq(true);
                      setTimeout(() => setCopiedGroq(false), 2000);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    title="Copy API Key"
                  >
                    {copiedGroq ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGroq ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Failovers: groq/compound-mini, openai/gpt-oss-20b, qwen/qwen3.6-27b
                </span>
                <button
                  type="button"
                  onClick={testGroqPing}
                  disabled={testingPing}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-purple-700 dark:text-brand-lavender hover:underline"
                >
                  {testingPing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {pingLatency !== null
                      ? `Ping: ${pingLatency}ms (${pingStatus === 'ok' ? 'Healthy' : 'Degraded'})`
                      : 'Test Connection Ping'}
                  </span>
                </button>
              </div>
            </div>

            {/* Google Gemini Engine */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-indigo-50 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-xs text-blue-950 dark:text-blue-200">
                    Engine Provider: Google Gemini
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  gemini-flash-latest
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wider">
                  Gemini API Key
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      readOnly
                      value={geminiApiKey}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs font-mono text-slate-900 dark:text-blue-300 select-all focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="p-2.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                    title={showGeminiKey ? 'Hide API Key' : 'Show Full Key'}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(geminiApiKey);
                      setCopiedGemini(true);
                      setTimeout(() => setCopiedGemini(false), 2000);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    title="Copy API Key"
                  >
                    {copiedGemini ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGemini ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Features: Multi-Modal Context, 1M+ Token Support, Deep Academic Synthesis
                </span>
              </div>
            </div>

            {/* OpenAI Secondary Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg/60 border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Secondary Backup: OpenAI API
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  gpt-4o-mini
                </span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wider">
                  OpenAI API Key (Backup)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showOpenAIKey ? 'text' : 'password'}
                      readOnly
                      value={openaiApiKey}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 select-all focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="p-2.5 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-hover border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(openaiApiKey);
                      setCopiedOpenAI(true);
                      setTimeout(() => setCopiedOpenAI(false), 2000);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    {copiedOpenAI ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedOpenAI ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* General Profile Card */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card space-y-6">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <span>Personal Information</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-hover/60 border border-slate-200 dark:border-dark-border rounded-xl text-sm text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center space-x-2 bg-purple-600 dark:bg-brand-purple hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-card space-y-6">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-border flex items-center space-x-2">
              <Lock className="w-5 h-5 text-purple-600 dark:text-brand-lavender" />
              <span>Security & Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg/80 border border-slate-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-brand-lavender focus:bg-white dark:focus:bg-dark-bg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="inline-flex items-center space-x-2 bg-slate-800 dark:bg-purple-950 dark:hover:bg-purple-900 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm border dark:border-purple-800/50 transition-colors"
                >
                  {updatingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Plan & Subscription Card (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subscription Plan
              </span>
              <span className="text-xs font-bold text-purple-700 dark:text-brand-lavender bg-purple-50 dark:bg-brand-amethyst/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-brand-lavender/30">
                Active
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">
                {profile?.plan || 'Free'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">/ forever</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-dark-border">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Ultra-Fast Groq LPU Inference (gpt-oss-120b)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>MCQ Studio & AI Classroom Tests</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>PDF & DOCX document exports</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Supabase Row Level Security</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-2.5 bg-slate-100 dark:bg-dark-bg text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-dark-border font-semibold text-xs rounded-xl cursor-not-allowed text-center"
            >
              Current Active Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
