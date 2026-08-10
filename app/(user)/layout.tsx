'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  FileCheck2,
  Clock,
  User,
  LogOut,
  Bell,
  Check,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Search,
  Plus,
  Sun,
  Moon,
  Building2,
  Bookmark,
  Trash2,
  Settings,
  Command,
  FolderGit2,
  Presentation,
  HelpCircle,
  Activity,
  ShieldCheck,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { CommandPalette } from '@/components/ui/CommandPalette';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();

    try {
      const savedTheme = localStorage.getItem('easydoc_theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('easydoc_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('easydoc_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Generate AI', href: '/generate', icon: Sparkles },
    { name: 'Project Studio', href: '/project-docs', icon: FolderGit2 },
    { name: 'Presentation Studio', href: '/presentation-studio', icon: Presentation },
    { name: 'Viva Studio', href: '/viva-studio', icon: HelpCircle },
    { name: 'Document Health', href: '/document-health', icon: Activity },
    { name: 'Career Studio', href: '/career-studio', icon: FileCheck2 },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Profile', href: '/profile', icon: User },
  ];


  const formattedBreadcrumb = pathname.replace('/', '').replace('-', ' ') || 'Dashboard';

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* 1. SIDEBAR FOR DESKTOP */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border shrink-0 transition-all duration-300 z-30 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 dark:from-brand-purple dark:via-brand-lavender dark:to-brand-amethyst flex items-center justify-center font-display font-extrabold text-xl text-white shadow-md shrink-0">
              E
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block">
                  Easy<span className="text-purple-600 dark:text-brand-lavender">Doc</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-brand-lavender/80 block">
                  Cyber AI Studio
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
            title="Collapse Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Create New CTA Button */}
        <div className="p-3">
          <Link
            href="/generate"
            className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-700 to-indigo-800 dark:from-brand-purple dark:to-brand-amethyst text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md hover:shadow-lg transition-all ${
              isCollapsed ? 'p-2.5 justify-center' : ''
            }`}
          >
            <Plus className="w-4 h-4 text-purple-200 dark:text-brand-lavender" />
            {!isCollapsed && <span>Create Document</span>}
          </Link>
        </div>

        {/* Search Command Shortcut Button */}
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <button
              onClick={() => setCmdPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-dark-bg/80 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 dark:hover:bg-dark-hover transition-colors border border-slate-200 dark:border-dark-border"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
                <span>Search app...</span>
              </div>
              <kbd className="text-[10px] bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-1.5 py-0.5 rounded font-mono text-purple-700 dark:text-brand-lavender font-bold">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  active
                    ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-brand-amethyst/80 dark:text-brand-lavender dark:border-brand-lavender/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={item.name}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 dark:bg-brand-lavender rounded-r-full shadow-sm" />
                )}
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-purple-700 dark:text-brand-lavender' : 'text-slate-400'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {profile?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-dark-border">
              {!isCollapsed && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-brand-lavender/80 block mb-2">
                  Admin Console
                </span>
              )}
              <Link
                href="/admin"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 dark:bg-brand-amethyst/60 dark:text-brand-lavender dark:border-brand-lavender/30 hover:bg-purple-100 dark:hover:bg-brand-amethyst transition-all ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5 text-purple-600 dark:text-brand-lavender" />
                {!isCollapsed && <span>Admin Dashboard</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User Card & Sign out */}
        <div className="p-3 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-brand-lavender/80 truncate">{profile?.email}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border px-6 py-3 flex items-center justify-between">
          {/* Left: Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>App</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-bold text-slate-900 dark:text-white capitalize">
                {formattedBreadcrumb}
              </span>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center space-x-3">
            {/* Global Search Button */}
            <button
              onClick={() => setCmdPaletteOpen(true)}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-slate-200 dark:hover:bg-dark-hover transition-colors border border-slate-200 dark:border-dark-border"
            >
              <Search className="w-3.5 h-3.5 text-purple-600 dark:text-brand-lavender" />
              <span>Search</span>
              <kbd className="text-[10px] bg-white dark:bg-dark-surface px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-border font-mono text-purple-700 dark:text-brand-lavender font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-purple-700" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 dark:bg-brand-purple rounded-full ring-2 ring-white dark:ring-dark-surface" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl p-4 z-50 animate-scale-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-3">
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-xs bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender px-2 py-0.5 rounded-full font-bold">
                      {notifications.length} total
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No recent notifications
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            n.isRead
                              ? 'bg-slate-50 dark:bg-dark-bg/50 border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-300'
                              : 'bg-purple-50 dark:bg-brand-amethyst/40 border-purple-200 dark:border-dark-border text-slate-900 dark:text-white font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold capitalize text-purple-700 dark:text-brand-lavender">
                              {n.type}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Plan Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-purple-100 dark:bg-brand-amethyst/60 text-purple-800 dark:text-brand-lavender border border-purple-200 dark:border-dark-border px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-brand-purple animate-pulse" />
              <span>{profile?.plan || 'Free Plan'}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border p-4 space-y-2 animate-slide-down">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-900 dark:text-white"
              >
                <item.icon className="w-5 h-5 text-purple-700 dark:text-brand-lavender" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">{children}</main>
      </div>

      {/* Global Command Palette Modal (Cmd+K) */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
    </div>
  );
}
