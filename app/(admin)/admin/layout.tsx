import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  BarChart3,
  FileCode,
  Activity,
  ShieldCheck,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  // Enforce server-side role check
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/dashboard?error=access_denied');
  }

  const adminNav = [
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Analytics & Usage', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Template Manager', href: '/admin/templates', icon: FileCode },
    { name: 'System Logs', href: '/admin/logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-display font-bold text-xl text-white shadow-lg shadow-blue-600/30">
              A
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white block">
                Admin Console
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                EasyDoc Control
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {adminNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-all"
              >
                <item.icon className="w-4 h-4 text-blue-400" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Back to User Dashboard */}
        <div className="pt-6 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User App</span>
          </Link>
        </div>
      </aside>

      {/* Admin Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-950 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h1 className="font-display font-bold text-base text-white">
              Administrator System Control
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-3 py-1 rounded-full font-mono">
              Signed in as: {profile.name} (ADMIN)
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
