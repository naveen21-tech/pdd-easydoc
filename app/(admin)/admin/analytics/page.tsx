'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Cpu, Sparkles, Clock, FileCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading analytics...</div>;
  }

  const metrics = data?.metrics || {};
  const providers = data?.requestsByProvider || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">System Analytics</h2>
        <p className="text-sm text-slate-400">
          Real-time metrics on AI generations, provider usage, and document conversion rates
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Platform Users
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-white">{metrics.totalUsers}</p>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Documents Created
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-white">{metrics.totalDocuments}</p>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Generation Calls
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-white">{metrics.totalAIRequests}</p>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Ratio
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-white">
            {metrics.totalDocuments > 0
              ? Math.round((metrics.completeDocuments / metrics.totalDocuments) * 100)
              : 100}
            %
          </p>
        </div>
      </div>

      {/* Provider breakdown */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <h3 className="font-display font-bold text-lg text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <span>AI Request Volume by Provider</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map((p: any) => (
            <div
              key={p.provider}
              className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase font-mono">
                  {p.provider}
                </span>
                <span className="text-xs text-blue-400 font-semibold bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
                  Active
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-xs text-slate-400">Requests Processed:</span>
                <span className="text-lg font-bold text-white font-mono">{p._count.provider}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Avg Latency:</span>
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  {Math.round(p._avg.responseTimeMs || 0)}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
