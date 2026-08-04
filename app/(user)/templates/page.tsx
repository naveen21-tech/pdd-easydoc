'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  ArrowRight,
  Sparkles,
  Heart,
  Zap,
  Clock,
  Eye,
  X,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Presentation,
  Briefcase,
  Building2,
  FileCheck,
  Search as SearchIcon,
  FileMinus,
  Cpu,
  Layers,
  Award,
  Mail,
  BookMarked,
  FileSpreadsheet,
  ShieldCheck,
  CheckSquare,
  Coins,
  TrendingUp,
  Compass,
  ShieldAlert,
  Receipt,
  FileCheck2,
  UserCheck,
  BarChart3,
  MailX,
  Send,
  Building,
  Wallet,
} from 'lucide-react';
import { TEMPLATE_CATALOG, TEMPLATE_CATEGORIES, TemplateEntry } from '@/lib/templates/catalog';

const ICON_MAP: Record<string, any> = {
  BookOpen,
  FlaskConical,
  FileText,
  Code: FileText,
  GraduationCap,
  Presentation,
  Briefcase,
  Building2,
  FileCheck,
  Search: SearchIcon,
  FileMinus,
  Cpu,
  Layers,
  Award,
  Mail,
  BookMarked,
  FileSpreadsheet,
  ShieldCheck,
  CheckSquare,
  Coins,
  TrendingUp,
  Compass,
  ShieldAlert,
  Receipt,
  FileCheck2,
  UserCheck,
  BarChart3,
  MailX,
  Send,
  Building,
  Wallet,
};

export default function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateEntry | null>(null);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('easydoc_fav_templates');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedRecent = localStorage.getItem('easydoc_recent_templates');
      if (savedRecent) setRecentlyUsed(JSON.parse(savedRecent));
    } catch (e) {
      console.error('LocalStorage read error:', e);
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];

    setFavorites(updated);
    try {
      localStorage.setItem('easydoc_fav_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const markRecentlyUsed = (id: string) => {
    const updated = [id, ...recentlyUsed.filter((rId) => rId !== id)].slice(0, 10);
    setRecentlyUsed(updated);
    try {
      localStorage.setItem('easydoc_recent_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const extraFilters = ['Popular', 'Newest', 'Favorites', 'Recently Used'];
  const allFilterPills = [...TEMPLATE_CATEGORIES, ...extraFilters];

  const filteredTemplates = TEMPLATE_CATALOG.filter((t) => {
    // Category or Special Filter match
    let matchesCategory = true;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Popular') {
      matchesCategory = !!t.isPopular;
    } else if (selectedCategory === 'Newest') {
      matchesCategory = !!t.isNew;
    } else if (selectedCategory === 'Favorites') {
      matchesCategory = favorites.includes(t.id);
    } else if (selectedCategory === 'Recently Used') {
      matchesCategory = recentlyUsed.includes(t.id);
    } else {
      matchesCategory = t.category.toLowerCase() === selectedCategory.toLowerCase();
    }

    // Search query match across title, category, description, and tags
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-brand-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Over 100+ Professional AI Templates</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Template Catalog</h2>
          <p className="text-sm text-slate-500">
            Explore curated document blueprints for college, faculty, business, legal, and government needs
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-card space-y-4">
        {/* Category Pills Slider */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {allFilterPills.map((cat) => {
            const selected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'Favorites' && <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />}
                {cat === 'Popular' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 100+ templates by title, category, keywords (e.g. 'SRS', 'IEEE', 'Lesson Plan', 'Resignation')..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white text-ink transition-all"
          />
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-sm">No matching templates found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tmpl) => {
            const IconComponent = ICON_MAP[tmpl.iconName] || FileText;
            const isFav = favorites.includes(tmpl.id);

            return (
              <div
                key={tmpl.id}
                className="group relative bg-white/90 backdrop-blur-md rounded-2xl border border-border p-6 shadow-card hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon, Category Badge & Favorite */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5.5 h-5.5" />
                    </div>

                    <div className="flex items-center space-x-2">
                      {tmpl.isPopular && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Popular</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => toggleFavorite(tmpl.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                        title={isFav ? 'Remove Favorite' : 'Save Favorite'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? 'text-red-500 fill-red-500' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block mb-1">
                      {tmpl.category}
                    </span>
                    <h3 className="font-display font-bold text-base text-ink group-hover:text-brand-600 transition-colors">
                      {tmpl.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6">
                    {tmpl.description}
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{tmpl.estimatedTime || '30s'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewTemplate(tmpl)}
                      className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/generate?templateId=${tmpl.id}&templateName=${encodeURIComponent(
                        tmpl.name
                      )}`}
                      onClick={() => markRecentlyUsed(tmpl.id)}
                      className="inline-flex items-center space-x-1.5 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-float max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-blue-50 px-2 py-0.5 rounded">
                    {previewTemplate.category}
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink">
                    {previewTemplate.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>{previewTemplate.description}</p>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Suggested Tone
                  </span>
                  <span className="font-medium text-ink">{previewTemplate.suggestedTone}</span>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Suggested Length
                  </span>
                  <span className="font-medium text-ink">{previewTemplate.suggestedLength}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">
                  Input Parameters Supported:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewTemplate.placeholderInputs.map((input) => (
                    <span
                      key={input}
                      className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium"
                    >
                      {input}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>

              <Link
                href={`/generate?templateId=${
                  previewTemplate.id
                }&templateName=${encodeURIComponent(previewTemplate.name)}`}
                onClick={() => markRecentlyUsed(previewTemplate.id)}
                className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Document</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
