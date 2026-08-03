'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.recentAIRequests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.prompt.toLowerCase().includes(search.toLowerCase()) ||
      l.provider.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">System & AI Audit Logs</h2>
          <p className="text-sm text-slate-400">
            Real-time execution log of AI calls, user prompts, provider latencies, and status
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading execution logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No system execution logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Provider</th>
                  <th className="py-4 px-6">Prompt Summary</th>
                  <th className="py-4 px-6">Latency</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300">
                      {log.user?.email || log.userId}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded font-mono border border-blue-800">
                        {log.provider}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300 max-w-xs truncate font-mono">
                      {log.prompt}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {log.responseTimeMs}ms
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.success
                            ? 'bg-green-950/60 text-green-400 border border-green-800/60'
                            : 'bg-red-950/60 text-red-400 border border-red-800/60'
                        }`}
                      >
                        {log.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{log.success ? 'Success' : 'Error'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
