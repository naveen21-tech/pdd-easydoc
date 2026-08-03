'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <h2 className="font-display text-2xl font-bold text-ink">Account & Settings</h2>
        <p className="text-sm text-slate-500">
          Manage your personal details, subscription plan, and security settings
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center space-x-3 text-green-700 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* General Profile Card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-6">
            <h3 className="font-display font-bold text-base text-ink pb-3 border-b border-slate-100 flex items-center space-x-2">
              <User className="w-5 h-5 text-brand-600" />
              <span>Personal Information</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white text-ink font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm"
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
          <div className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-6">
            <h3 className="font-display font-bold text-base text-ink pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-brand-600" />
              <span>Security & Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white text-ink"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm"
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
          <div className="paper-stack p-6 bg-white rounded-2xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subscription Plan
              </span>
              <span className="text-xs font-bold text-brand-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="font-display text-3xl font-bold text-ink">
                {profile?.plan || 'Free'}
              </span>
              <span className="text-xs text-slate-400">/ forever</span>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Unlimited OpenAI / Claude / Gemini calls</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>PDF & DOCX document exports</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Supabase Row Level Security</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-2.5 bg-slate-100 text-slate-400 font-semibold text-xs rounded-xl cursor-not-allowed text-center"
            >
              Current Active Tier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
