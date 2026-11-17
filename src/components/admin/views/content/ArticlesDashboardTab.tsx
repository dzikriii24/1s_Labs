import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  Tag,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  X,
  Send,
  Archive
} from 'lucide-react';
import {
  blogApi,
  seoIntelligenceApi,
  type BlogArticle,
  type BlogCategory,
  type BlogStats
} from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';
import { formatDateId, ScorePill, StatusBadge, getScoreTier } from './blogUiUtils';

interface ArticlesDashboardTabProps {
  onOpenEditor: (articleId?: number | null) => void;
}

export const ArticlesDashboardTab: React.FC<ArticlesDashboardTabProps> = ({ onOpenEditor }) => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [seoHealthFilter, setSeoHealthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Category modal state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#2563eb');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [optimizingId, setOptimizingId] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await blogApi.getCategories();
      setCategories(res.categories || []);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.getAdminPosts({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        seo_health: seoHealthFilter !== 'all' ? seoHealthFilter : undefined,
        sort: sortBy,
        page,
        limit: 12
      });
      setArticles(res.articles || []);
      setStats(res.stats || null);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat daftar artikel blog.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, seoHealthFilter, sortBy, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadArticles]);

  const handleTogglePublish = async (article: BlogArticle) => {
    const isPublished = article.status === 'published';
    const nextStatus = isPublished ? 'draft' : 'published';
    const ok = await notify.confirm({
      title: isPublished ? 'Unpublish Artikel?' : 'Terbitkan Artikel Sekarang?',
      text: isPublished
        ? `Artikel "${article.title}" akan dikembalikan ke Draft dan tidak tampil di /blog.`
        : `Artikel "${article.title}" akan langsung dipublikasikan di https://1slabs.my.id/blog/${article.slug}.`,
      confirmButtonText: isPublished ? 'Ya, Jadikan Draft' : 'Ya, Terbitkan',
      isDanger: isPublished
    });
    if (!ok) return;

    try {
      await blogApi.updatePostStatus(article.id, { status: nextStatus });
      notify.success(isPublished ? 'Artikel dikembalikan ke Draft.' : 'Artikel berhasil diterbitkan.');
      loadArticles();
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengubah status publikasi.');
    }
  };

  const handleDeleteArticle = async (article: BlogArticle) => {
    const ok = await notify.confirm({
      title: 'Hapus Artikel Permanen?',
      text: `Artikel "${article.title}" beserta seluruh riwayat revisinya akan dihapus permanen.`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;

    try {
      await blogApi.deletePost(article.id);
      notify.success('Artikel berhasil dihapus.');
      loadArticles();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus artikel.');
    }
  };

  const handleQuickAnalyzeOrOptimize = async (article: BlogArticle) => {
    setOptimizingId(article.id);
    try {
      await seoIntelligenceApi.analyzeArticle({ article_id: article.id, save: true });
      notify.toast('Skor SEO, Readability & GEO diperbarui.');
      loadArticles();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menganalisis ulang artikel.');
    } finally {
      setOptimizingId(null);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      notify.warning('Nama kategori wajib diisi.');
      return;
    }
    setSavingCat(true);
    try {
      if (editingCat) {
        await blogApi.updateCategory(editingCat.id, {
          name: catName.trim(),
          color: catColor,
          description: catDesc.trim()
        });
        notify.success('Kategori diperbarui.');
      } else {
        await blogApi.createCategory({
          name: catName.trim(),
          color: catColor,
          description: catDesc.trim()
        });
        notify.success('Kategori baru ditambahkan.');
      }
      setCatName('');
      setCatDesc('');
      setEditingCat(null);
      loadCategories();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: BlogCategory) => {
    const ok = await notify.confirm({
      title: 'Hapus Kategori?',
      text: `Kategori "${cat.name}" akan dihapus. Artikel yang menggunakannya akan menjadi tanpa kategori.`,
      confirmButtonText: 'Hapus Kategori',
      isDanger: true
    });
    if (!ok) return;
    try {
      await blogApi.deleteCategory(cat.id);
      notify.success('Kategori dihapus.');
      loadCategories();
      loadArticles();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1.5">
            <FileText size={13} />
            1sLabs Content &amp; Editorial Hub
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Manajemen Artikel &amp; Publikasi Blog
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kelola artikel edukasi, arsitektur cloud, panduan teknis, serta skor SEO, Readability, dan GEO Readiness secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <FolderOpen size={16} className="text-blue-600" />
            Kategori ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => onOpenEditor(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus size={17} />
            Tulis Artikel Baru
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Total Artikel</span>
            <FileText size={15} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1.5">
            {Number(stats?.total || 0)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {Number(stats?.total_views || 0).toLocaleString('id-ID')} total pembacaan
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Terbit</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1.5">
            {Number(stats?.published_count || 0)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Live di `/blog`
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Terjadwal &amp; Review</span>
            <Clock size={15} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1.5">
            {Number(stats?.scheduled_count || 0) + Number(stats?.in_review_count || 0)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {Number(stats?.scheduled_count || 0)} terjadwal · {Number(stats?.draft_count || 0)} draft
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Rata-Rata Skor SEO</span>
            <TrendingUp size={15} className="text-blue-600" />
          </div>
          <p className={`text-2xl font-bold mt-1.5 ${getScoreTier(Number(stats?.avg_seo_score || 0)).text}`}>
            {Number(stats?.avg_seo_score || 0)}<span className="text-sm font-normal text-zinc-400">/100</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Readability avg {Number(stats?.avg_readability_score || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>GEO Readiness Avg</span>
            <Sparkles size={15} className="text-indigo-600" />
          </div>
          <p className={`text-2xl font-bold mt-1.5 ${getScoreTier(Number(stats?.avg_geo_score || 0)).text}`}>
            {Number(stats?.avg_geo_score || 0)}<span className="text-sm font-normal text-zinc-400">/100</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {Number(stats?.good_seo_count || 0)} artikel skor sehat
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari judul, slug, keyphrase, atau penulis..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200"
          >
            <option value="all">Semua Status</option>
            <option value="published">Terbit (Published)</option>
            <option value="scheduled">Terjadwal (Scheduled)</option>
            <option value="in_review">In Review</option>
            <option value="needs_revision">Perlu Revisi</option>
            <option value="draft">Draft</option>
            <option value="ideas">Ide Topik</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={seoHealthFilter}
            onChange={(e) => { setSeoHealthFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200"
          >
            <option value="all">Semua SEO Health</option>
            <option value="good">SEO Baik (75–100)</option>
            <option value="needs_improvement">Perlu Optimasi (50–74)</option>
            <option value="poor">Kurang (&lt; 50)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200"
          >
            <option value="updated_desc">Terbaru Diperbarui</option>
            <option value="published_desc">Tanggal Terbit</option>
            <option value="seo_desc">Skor SEO Tertinggi</option>
            <option value="seo_asc">Skor SEO Terendah</option>
            <option value="views_desc">Pembacaan Terbanyak</option>
            <option value="title_asc">Judul (A–Z)</option>
          </select>

          <button
            type="button"
            onClick={loadArticles}
            title="Refresh data"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3.5 px-4">Artikel</th>
                <th className="py-3.5 px-3">Kategori &amp; Penulis</th>
                <th className="py-3.5 px-3">Status &amp; Terbit</th>
                <th className="py-3.5 px-3">SEO · Readability · GEO</th>
                <th className="py-3.5 px-3 text-right">Update &amp; Views</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              {loading && articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    Memuat daftar artikel blog...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <FileText size={32} className="mx-auto text-zinc-300 mb-2" />
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">Belum ada artikel yang cocok dengan filter.</p>
                    <p className="text-xs text-zinc-500 mt-1 mb-4">Mulai tulis artikel baru atau ubah filter pencarian Anda.</p>
                    <button
                      type="button"
                      onClick={() => onOpenEditor(null)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      <Plus size={14} /> Buat Artikel Pertama
                    </button>
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} className="hover:bg-blue-50/30 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-[340px]">
                      <div className="flex items-start gap-3">
                        {art.featured_image ? (
                          <img
                            src={art.featured_image}
                            alt={art.featured_image_alt || art.title}
                            className="w-14 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-blue-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenEditor(art.id)}
                            className="text-left font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                          >
                            {art.title}
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
                            <span className="truncate max-w-[200px]">/blog/{art.slug}</span>
                            {art.focus_keyphrase && (
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">
                                KW: {art.focus_keyphrase}
                              </span>
                            )}
                            {Boolean(art.is_pillar) && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                Pillar
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {art.category_name ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: art.category_color || '#2563eb' }} />
                          {art.category_name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Tanpa Kategori</span>
                      )}
                      <div className="text-xs text-zinc-500 mt-1 truncate max-w-[160px]">
                        {art.author_name || 'Tim Editorial 1sLabs'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={art.status} />
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {art.published_at ? formatDateId(art.published_at, true) : 'Belum diterbitkan'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ScorePill label="SEO" score={art.seo_score} />
                        <ScorePill label="Read" score={art.readability_score} />
                        <ScorePill label="GEO" score={art.geo_score} />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right text-xs text-zinc-500">
                      <div className="font-medium text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1">
                        <Eye size={13} className="text-zinc-400" />
                        {Number(art.views || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="mt-1 text-[11px]">{formatDateId(art.updated_at)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditor(art.id)}
                          title="Edit di Artikel Editor"
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAnalyzeOrOptimize(art)}
                          disabled={optimizingId === art.id}
                          title="Hitung Ulang Skor SEO/Readability/GEO"
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Sparkles size={15} className={optimizingId === art.id ? 'animate-spin' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(art)}
                          title={art.status === 'published' ? 'Unpublish ke Draft' : 'Terbitkan Sekarang'}
                          className={`p-1.5 rounded-lg ${
                            art.status === 'published'
                              ? 'text-emerald-600 hover:bg-amber-50 hover:text-amber-600'
                              : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          {art.status === 'published' ? <Archive size={15} /> : <Send size={15} />}
                        </button>
                        {art.status === 'published' && (
                          <a
                            href={`/blog/${art.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka Halaman Publik"
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art)}
                          title="Hapus Artikel"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <span>Menampilkan {articles.length} dari {totalCount} artikel</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2.5 font-medium text-zinc-700 dark:text-zinc-300">
              Hal {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Tag size={17} className="text-blue-600" />
                <h3 className="font-bold text-zinc-900 dark:text-white">Kelola Kategori Blog</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowCatModal(false); setEditingCat(null); setCatName(''); setCatDesc(''); }}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleSaveCategory} className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {editingCat ? `Edit: ${editingCat.name}` : 'Tambah Kategori Baru'}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Contoh: DevOps & Automasi"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Warna Label</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer border-0" />
                    <input
                      type="text"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Topik cakupan kategori..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {savingCat ? 'Menyimpan...' : editingCat ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </button>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => { setEditingCat(null); setCatName(''); setCatDesc(''); }}
                      className="py-2 px-3 rounded-lg border border-zinc-300 text-xs font-medium text-zinc-600"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Daftar Kategori Aktif</h4>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#2563eb' }} />
                        <span className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{cat.name}</span>
                        <span className="text-[11px] text-zinc-400">({cat.article_count || 0})</span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">/blog?category={cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setCatName(cat.name);
                          setCatColor(cat.color || '#2563eb');
                          setCatDesc(cat.description || '');
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-zinc-500 hover:text-blue-600"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-500 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

