import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Edit3,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck
} from 'lucide-react';
import { BlogArticle, blogApi } from '../../../../services/blogApi';
import { getErrMsg } from '../../../../services/contentAutomationApi';
import { ScorePill, formatDateId } from '../content/blogUiUtils';
import notify from '../../../../lib/notify';

interface AutomationPublishedPanelProps {
  onOpenBlogEditor: (articleId: number) => void;
  onInspectArticleUrl: (articleId: number, url: string) => void;
}

export const AutomationPublishedPanel: React.FC<AutomationPublishedPanelProps> = ({
  onOpenBlogEditor,
  onInspectArticleUrl
}) => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | ''>('published');
  const [search, setSearch] = useState('');
  const searchRef = useRef(search);
  searchRef.current = search;

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getAdminPosts({
        status: statusFilter || undefined,
        search: searchRef.current.trim() || undefined,
        limit: 40
      });
      setArticles(res.articles || []);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Artikel di Database Blog 1sLabs</h3>
            <p className="text-xs text-zinc-500">
              Pusat pengelolaan tunggal (<code className="font-mono">blog_articles</code>). Terbit otomatis muncul di{' '}
              <code className="font-mono">/blog</code> dan <code className="font-mono">/sitemap.xml</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
            {(
              [
                { k: 'published', l: 'Published' },
                { k: 'draft', l: 'Draft' },
                { k: '', l: 'Semua' }
              ] as const
            ).map((t) => (
              <button
                key={t.k || 'all'}
                onClick={() => setStatusFilter(t.k)}
                className={`px-3 py-1.5 font-semibold cursor-pointer ${
                  statusFilter === t.k ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-600'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadArticles();
            }}
            className="flex items-center gap-1"
          >
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau slug..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              />
            </div>
            <button
              type="button"
              onClick={loadArticles}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-xs text-zinc-400">Memuat artikel 1sLabs...</div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">Belum ada artikel untuk filter ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500">
                  <th className="py-3 px-4 font-semibold">Judul &amp; Slug</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Skor Audit</th>
                  <th className="py-3 px-3 font-semibold">Views</th>
                  <th className="py-3 px-3 font-semibold">Terbit / Update</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{a.title}</p>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">
                        /blog/{a.slug} {a.focus_keyphrase ? `• ${a.focus_keyphrase}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          a.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        <ScorePill label="SEO" score={a.seo_score} />
                        <ScorePill label="GEO" score={a.geo_score} />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-200">{a.views || 0}</td>
                    <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                      {formatDateId(a.published_at || a.updated_at)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenBlogEditor(a.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 font-semibold cursor-pointer"
                        >
                          <Edit3 size={12} /> Editor
                        </button>
                        <button
                          onClick={() => onInspectArticleUrl(a.id, `https://1slabs.my.id/blog/${a.slug}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                          title="Inspeksi URL di Google Search Console"
                        >
                          <ShieldCheck size={12} /> Inspect URL
                        </button>
                        <a
                          href={`/blog/${a.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
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
};
