'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Search,
  BookOpen,
  FolderGit2,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  GraduationCap,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { GroupItem } from '@/lib/types';

function GroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'created' | 'joined'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdGroupResult, setCreatedGroupResult] = useState<GroupItem | null>(null);

  // Join Form State
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();

    // Check if ?join=CODE query param is present
    const joinParam = searchParams?.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
      setShowJoinModal(true);
    }
  }, [searchParams]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error('Fetch groups error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError('Please enter a group name');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || 'Failed to create group');
        return;
      }

      setCreatedGroupResult(data.group);
      fetchGroups();
    } catch (e: any) {
      setCreateError(e?.message || 'Network error creating group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Please enter a join code');
      return;
    }

    try {
      setJoining(true);
      setJoinError(null);

      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || 'Failed to join group');
        return;
      }

      setShowJoinModal(false);
      setJoinCode('');
      fetchGroups();
      router.push(`/groups/${data.group.id}`);
    } catch (e: any) {
      setJoinError(e?.message || 'Network error joining group');
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.joinCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'created') return g.role === 'ADMIN';
    if (filterTab === 'joined') return g.role === 'MEMBER';
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-border pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-purple-800 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight">
                StudentDoc Groups
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Collaborative academic classrooms, shared assignments, course notes, and study groups
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              setJoinError(null);
              setShowJoinModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-purple-200 dark:border-dark-border bg-white dark:bg-dark-surface text-purple-700 dark:text-brand-lavender font-bold text-xs hover:bg-purple-50 dark:hover:bg-dark-hover shadow-sm transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => {
              setCreateName('');
              setCreateDescription('');
              setCreateError(null);
              setCreatedGroupResult(null);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Classroom</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Groups ({groups.length})
          </button>
          <button
            onClick={() => setFilterTab('created')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'created'
                ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Created by Me ({groups.filter((g) => g.role === 'ADMIN').length})
          </button>
          <button
            onClick={() => setFilterTab('joined')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'joined'
                ? 'bg-white dark:bg-brand-purple text-purple-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Joined as Student ({groups.filter((g) => g.role === 'MEMBER').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups or join codes..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 3. GROUPS LIST / GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-brand-lavender animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your classrooms & groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-dark-border space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-brand-lavender flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              {searchQuery ? 'No matching groups found' : 'No Classrooms Joined Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Try searching with a different keyword or join code.'
                : 'Create your first classroom as an educator or join an existing group with a join code.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setJoinError(null);
                setShowJoinModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender font-bold text-xs border border-purple-200 dark:border-purple-800"
            >
              Join with Code
            </button>
            <button
              onClick={() => {
                setCreateName('');
                setCreateDescription('');
                setCreateError(null);
                setCreatedGroupResult(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs"
            >
              Create Classroom
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const isAdmin = group.role === 'ADMIN';

            return (
              <div
                key={group.id}
                className="glass-card rounded-2xl border border-slate-200 dark:border-dark-border hover:border-purple-400 dark:hover:border-purple-500 transition-all flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md"
              >
                {/* Header Banner */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender border border-purple-200 dark:border-purple-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                        <span>{isAdmin ? 'Teacher / Admin' : 'Student Member'}</span>
                      </span>

                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-brand-lavender transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                        Instructor: {group.creator?.name || 'Faculty Guide'}
                      </span>
                    </div>

                    {/* Join Code Copy Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(group.joinCode, group.id);
                      }}
                      title="Click to copy join code"
                      className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs font-mono font-bold text-purple-700 dark:text-brand-lavender hover:bg-purple-50 dark:hover:bg-dark-hover transition-colors shrink-0"
                    >
                      <span>{group.joinCode}</span>
                      {copiedCode === group.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {group.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}
                </div>

                {/* Meta & Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-dark-border/60 flex flex-col space-y-3 bg-slate-50/50 dark:bg-dark-surface/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>{group.memberCount || 1} Members</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{group.documentCount || 0} Documents</span>
                    </div>
                  </div>

                  <Link
                    href={`/groups/${group.id}`}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold text-xs shadow-sm hover:shadow-md transition-all"
                  >
                    <span>Open Classroom</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {createdGroupResult ? (
              // Success View showing Join Code & Shareable link
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                    Classroom Created!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Share the join code or link with your students to let them join.
                  </p>
                </div>

                {/* Join Code Display */}
                <div className="p-4 bg-purple-50 dark:bg-dark-bg border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-brand-lavender block">
                    Classroom Join Code
                  </span>
                  <div className="flex items-center justify-center space-x-3">
                    <span className="font-mono text-2xl font-black text-purple-900 dark:text-white tracking-widest">
                      {createdGroupResult.joinCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdGroupResult.joinCode, 'modal_code')}
                      className="p-1.5 rounded-lg bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-300 transition-colors"
                    >
                      {copiedCode === 'modal_code' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Shareable Link Button */}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/groups?join=${createdGroupResult.joinCode}`;
                    copyToClipboard(url, 'modal_link');
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-dark-hover transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
                  <span>
                    {copiedCode === 'modal_link' ? 'Link Copied to Clipboard!' : 'Copy Shareable Join Link'}
                  </span>
                </button>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Done
                  </button>
                  <Link
                    href={`/groups/${createdGroupResult.id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm"
                  >
                    <span>Enter Group</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              // Create Form
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-brand-lavender flex items-center justify-center border border-purple-200 dark:border-purple-800">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      Create Classroom
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set up a new space for your batch, subject, or project team.
                    </p>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
                    {createError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Group / Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. CSE 4th Year - Cloud Computing"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="e.g. Course notes, weekly lab assignments, and project submissions."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{creating ? 'Creating Group...' : 'Create Classroom'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Join Classroom
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ask your teacher for the 6-character classroom join code.
                  </p>
                </div>
              </div>

              {joinError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
                  {joinError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Classroom Join Code *
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CSE4X2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl text-sm font-mono font-bold tracking-wider text-purple-900 dark:text-brand-lavender uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 dark:bg-brand-purple text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {joining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{joining ? 'Joining...' : 'Join Classroom'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-brand-lavender animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading classrooms...</p>
        </div>
      }
    >
      <GroupsContent />
    </Suspense>
  );
}
