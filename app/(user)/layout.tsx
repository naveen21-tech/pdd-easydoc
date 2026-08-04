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
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

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
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'ATS Resume', href: '/resume-builder', icon: FileCheck2 },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-ink text-white border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-display font-bold text-lg text-white shadow-md">
            E
          </div>
          <div>
            <span className="font-display font-bold text-xl tracking-tight text-white block">
              Easy<span className="text-brand-500">Doc</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Document Platform
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {profile?.role === 'ADMIN' && (
            <div className="pt-6 mt-6 border-t border-slate-800">
              <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Administration
              </span>
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-blue-950/60 border border-blue-800/40 text-blue-300 hover:bg-blue-900/60 transition-all"
              >
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <span>Admin Console</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Card & Sign out */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center shrink-0">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {profile?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-border px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-display text-lg font-bold text-ink capitalize">
              {pathname.replace('/', '') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    markNotificationsRead();
                  }
                }}
                className="relative p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-border rounded-2xl shadow-float p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="font-display font-bold text-sm text-ink">Notifications</h3>
                    <span className="text-xs bg-blue-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">
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
                              ? 'bg-slate-50 border-slate-100 text-slate-600'
                              : 'bg-blue-50/50 border-blue-100 text-ink font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold capitalize text-brand-600">
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
            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 text-brand-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
              <span>{profile?.plan || 'Free Plan'}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-ink text-white p-4 space-y-2 border-b border-slate-800">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800"
              >
                <item.icon className="w-5 h-5 text-brand-400" />
                <span>{item.name}</span>
              </Link>
            ))}
            {profile?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-900/50 text-blue-300"
              >
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
