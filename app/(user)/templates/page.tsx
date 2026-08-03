'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, ArrowRight, Sparkles, Filter } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Business', 'Engineering', 'Marketing', 'Management'];

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Template Gallery</h2>
          <p className="text-sm text-slate-500">
            Choose a proven template structure to jumpstart your document generation
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-card">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white text-ink"
          />
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-sm">No matching templates found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filter or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="paper-stack p-6 bg-white rounded-2xl border border-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    {tmpl.category}
                  </span>
                  <span className="text-xs text-slate-400">{tmpl.usageCount} uses</span>
                </div>

                <h3 className="font-display font-bold text-lg text-ink mb-2">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {tmpl.description}
                </p>
              </div>

              <Link
                href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(
                  tmpl.name
                )}`}
                className="inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm group"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
