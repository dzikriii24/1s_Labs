import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  BlogArticleCard,
  BlogCardSkeleton,
  BlogConsultationCta,
} from '../components/blog/BlogArticleCard';
import { formatBlogDate, stripHtmlSnippet } from '../utils/blogFormat';
import { blogApi, type BlogArticle, type BlogCategory } from '../services/blogApi';

const ARTICLES_PER_PAGE = 9;

function buildPaginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

export const BlogListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';
  const activeSearch = searchParams.get('q') || '';
  const activeSort = searchParams.get('sort') === 'popular' ? 'popular' : 'newest';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [searchInput, setSearchInput] = useState(activeSearch);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ARTICLES_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [featuredImgError, setFeaturedImgError] = useState(false);

  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  // Keep input synced with browser back/forward URL updates
  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  // Load categories once on mount
  useEffect(() => {
    let cancelled = false;
    blogApi
      .getCategories()
      .then((res) => {
        if (!cancelled) setCategories(res.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (!v) next.delete(k);
        else next.set(k, v);
      });
      if (resetPage) next.delete('page');
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  // Live debounced search against backend API (Title, Excerpt, Content)
  useEffect(() => {
    const trimmedInput = searchInput.trim();
    if (trimmedInput === activeSearch.trim()) return undefined;

    const timer = window.setTimeout(() => {
      updateParams({ q: trimmedInput || null }, true);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, activeSearch, updateParams]);

  const loadArticles = useCallback(
    async (signalCancelled?: { current: boolean }) => {
      setErrorMessage(null);
      setFetching(true);
      try {
        const res = await blogApi.getPosts({
          category: activeCategory || undefined,
          tag: activeTag || undefined,
          search: activeSearch || undefined,
          sort: activeSort,
          page,
          limit: ARTICLES_PER_PAGE,
        });
        if (signalCancelled?.current) return;
        setArticles(res.articles || []);
        setPagination(
          res.pagination || {
            page: 1,
            limit: ARTICLES_PER_PAGE,
            total: 0,
            totalPages: 1,
          }
        );
        setFeaturedImgError(false);
      } catch (err: unknown) {
        if (signalCancelled?.current) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Gagal memuat daftar artikel dari server.';
        setErrorMessage(message);
      } finally {
        if (!signalCancelled?.current) {
          setLoading(false);
          setFetching(false);
        }
      }
    },
    [activeCategory, activeTag, activeSearch, activeSort, page]
  );

  useEffect(() => {
    const cancelledRef = { current: false };
    loadArticles(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [loadArticles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed !== activeSearch) {
      updateParams({ q: trimmed || null }, true);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (activeSearch) {
      updateParams({ q: null }, true);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (targetPage: number) => {
    if (targetPage < 1 || targetPage > pagination.totalPages || targetPage === page) return;
    updateParams({ page: targetPage === 1 ? null : String(targetPage) }, false);
    if (resultsTopRef.current) {
      const y = resultsTopRef.current.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show only categories that actually have articles (plus active URL category so filter stays reversible)
  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (c) => Number(c.article_count || 0) > 0 || (activeCategory && c.slug === activeCategory)
      ),
    [categories, activeCategory]
  );

  const isDefaultFirstPage =
    !activeCategory && !activeTag && !activeSearch && activeSort === 'newest' && page === 1;

  const featuredArticle = useMemo(() => {
    if (!isDefaultFirstPage || articles.length === 0) return null;
    return articles.find((a) => Boolean(a.is_featured)) || articles[0];
  }, [isDefaultFirstPage, articles]);

  const gridArticles = useMemo(() => {
    if (!featuredArticle) return articles;
    return articles.filter((a) => a.id !== featuredArticle.id);
  }, [articles, featuredArticle]);

  const currentQueryString = searchParams.toString();
  const hasActiveFilters = Boolean(activeCategory || activeTag || activeSearch);
  const paginationItems = useMemo(
    () => buildPaginationItems(page, pagination.totalPages),
    [page, pagination.totalPages]
  );

  const activeCategoryMeta = categories.find((c) => c.slug === activeCategory);
  const seoPageTitle = activeCategoryMeta
    ? `${activeCategoryMeta.name} — Blog & Wawasan | 1sLabs`
    : 'Blog & Wawasan Teknologi | 1sLabs';
  const seoDescription =
    activeCategoryMeta?.description ||
    'Artikel teknis, arsitektur web, AI & otomasi, serta panduan infrastruktur digital dari tim engineering 1sLabs.';
  const canonicalUrl =
    page > 1 ? `https://1slabs.my.id/blog?page=${page}` : 'https://1slabs.my.id/blog';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
      <Helmet>
        <title>{seoPageTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoPageTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="1sLabs" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog & Wawasan 1sLabs',
            description: seoDescription,
            url: 'https://1slabs.my.id/blog',
            publisher: {
              '@type': 'Organization',
              name: '1sLabs',
              url: 'https://1slabs.my.id/',
              logo: {
                '@type': 'ImageObject',
                url: 'https://1slabs.my.id/logo1slabs.png',
              },
            },
          })}
        </script>
      </Helmet>

      <Header />

      <main className="flex-1 pt-6 sm:pt-10 pb-20">
        {/* 1. Compact Editorial Hero + Search */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gray-50/70 dark:bg-gray-800/35 border border-neutral-200/80 dark:border-neutral-800 px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
            <div className="max-w-3xl">
              <h1 className="mt-4 font-['Mori',_'Inter',_sans-serif] text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
                Catatan Engineering, AI &amp; Solusi Digital
              </h1>

              <p className="mt-3 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                Panduan praktis seputar pengembangan sistem web, otomasi workflow, performa server, dan strategi teknologi bisnis dari tim 1sLabs.
              </p>

              {/* Interactive Search Input */}
              <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl" role="search">
                <label htmlFor="blog-search-input" className="sr-only">
                  Cari artikel blog 1sLabs
                </label>
                <div className="relative flex items-center rounded-2xl bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700/80 shadow-xs focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                  <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
                  <input
                    id="blog-search-input"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari topik, arsitektur web, AI, atau kata kunci..."
                    className="w-full py-3 pl-3 pr-24 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                  />

                  <div className="absolute right-2 flex items-center gap-1.5">
                    {fetching && !loading && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-1" />
                    )}
                    {searchInput && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="Hapus kata kunci pencarian"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Cari
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* 2. Category Filter & Sort Toolbar */}
        <section
          ref={resultsTopRef}
          aria-label="Filter dan daftar artikel"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-neutral-200/80 dark:border-neutral-800">
            {/* Category Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => updateParams({ category: null })}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                  !activeCategory
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-900 border-neutral-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600'
                }`}
              >
                Semua Topik
              </button>

              {visibleCategories.map((cat) => {
                const isActive = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParams({ category: isActive ? null : cat.slug })}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-900 border-neutral-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {typeof cat.article_count === 'number' && cat.article_count > 0 && (
                      <span
                        className={`text-[11px] tabular-nums ${
                          isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {cat.article_count}
                      </span>
                    )}
                  </button>
                );
              })}

              {activeTag && (
                <button
                  type="button"
                  onClick={() => updateParams({ tag: null })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tag: {activeTag}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Control */}
            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
              <div
                className="inline-flex items-center p-1 rounded-full bg-gray-100/80 dark:bg-gray-800/70 border border-neutral-200/70 dark:border-neutral-800"
                role="group"
                aria-label="Urutkan artikel"
              >
                <button
                  type="button"
                  onClick={() => updateParams({ sort: null }, true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeSort === 'newest'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => updateParams({ sort: 'popular' }, true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeSort === 'popular'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Populer
                </button>
              </div>
            </div>
          </div>

          {/* Active Search / Filter Summary Bar */}
          {hasActiveFilters && !loading && !errorMessage && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <p>
                Menampilkan <strong className="text-gray-900 dark:text-white">{pagination.total}</strong>{' '}
                artikel
                {activeSearch ? (
                  <>
                    {' '}
                    untuk kata kunci <strong className="text-gray-900 dark:text-white">“{activeSearch}”</strong>
                  </>
                ) : null}
                {activeCategoryMeta ? (
                  <>
                    {' '}
                    dalam topik <strong className="text-gray-900 dark:text-white">{activeCategoryMeta.name}</strong>
                  </>
                ) : null}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset semua filter
              </button>
            </div>
          )}
        </section>

        {/* 3. Main Content Body */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10 sm:space-y-12">
          {/* Loading State */}
          {loading ? (
            <div className="space-y-10">
              {isDefaultFirstPage && (
                <div className="rounded-3xl bg-white dark:bg-gray-900/70 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden grid lg:grid-cols-12 animate-pulse">
                  <div className="lg:col-span-7 aspect-[16/10] lg:min-h-[340px] bg-gray-100 dark:bg-gray-800" />
                  <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-4 flex flex-col justify-center">
                    <div className="h-5 w-28 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="h-7 w-full rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-7 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <BlogCardSkeleton key={idx} />
                ))}
              </div>
            </div>
          ) : errorMessage ? (
            /* Error State */
            <div className="rounded-3xl bg-gray-50/70 dark:bg-gray-800/40 border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="mt-4 font-['Mori',_'Inter',_sans-serif] text-xl font-bold text-gray-900 dark:text-white">
                Gagal Memuat Artikel
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadArticles();
                }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Artikel
              </button>
            </div>
          ) : articles.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl bg-gray-50/70 dark:bg-gray-800/40 border border-neutral-200/80 dark:border-neutral-800 p-10 sm:p-14 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="mt-4 font-['Mori',_'Inter',_sans-serif] text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {hasActiveFilters ? 'Artikel Tidak Ditemukan' : 'Belum Ada Artikel Tersedia'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {hasActiveFilters
                  ? 'Coba ubah kata kunci pencarian atau pilih topik kategori lain untuk melihat artikel terkait.'
                  : 'Tim editorial 1sLabs sedang menyiapkan publikasi teknis dan wawasan digital terbaru.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  Tampilkan Semua Artikel
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Article Spotlight (Default First Page Only) */}
              {featuredArticle && (
                <Link
                  to={`/blog/${featuredArticle.slug}`}
                  state={currentQueryString ? { fromQuery: currentQueryString } : undefined}
                  className="group grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white dark:bg-gray-900/70 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:border-blue-300/90 dark:hover:border-blue-700/70 hover:shadow-[0_14px_36px_-14px_rgba(37,99,235,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:min-h-[360px] bg-gray-50 dark:bg-gray-800/60 overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-100 dark:border-neutral-800/80">
                    {featuredArticle.featured_image && !featuredImgError ? (
                      <img
                        src={featuredArticle.featured_image}
                        alt={featuredArticle.featured_image_alt || featuredArticle.title}
                        onError={() => setFeaturedImgError(true)}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-gray-50 to-white dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900">
                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                          <BookOpen className="w-7 h-7" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
                          {featuredArticle.category_name || 'Insight 1sLabs'}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Artikel Pilihan
                        </span>
                      </div>

                      <h2 className="mt-4 font-['Mori',_'Inter',_sans-serif] text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-gray-900 dark:text-white leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {featuredArticle.title}
                      </h2>

                      <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                        {stripHtmlSnippet(featuredArticle.excerpt) ||
                          'Baca pembahasan lengkap dan rekomendasi implementasi langsung dari tim engineer 1sLabs.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {(featuredArticle.published_at || featuredArticle.created_at) && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatBlogDate(
                              featuredArticle.published_at || featuredArticle.created_at,
                              'short'
                            )}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {Math.max(1, Number(featuredArticle.reading_time) || 3)} mnt baca
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                        Baca Artikel
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Uniform Responsive Article Card Grid */}
              {gridArticles.length > 0 && (
                <div className="space-y-6">
                  {featuredArticle && (
                    <div className="flex items-center justify-between">
                      <h2 className="font-['Mori',_'Inter',_sans-serif] text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Publikasi Terbaru
                      </h2>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                    {gridArticles.map((article) => (
                      <BlogArticleCard
                        key={article.id}
                        article={article}
                        fromQuery={currentQueryString}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Clean Pagination */}
              {pagination.totalPages > 1 && (
                <nav
                  aria-label="Navigasi halaman blog"
                  className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200/80 dark:border-neutral-800"
                >
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Halaman <strong className="text-gray-900 dark:text-white">{page}</strong> dari{' '}
                    <strong className="text-gray-900 dark:text-white">{pagination.totalPages}</strong>
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      aria-label="Halaman sebelumnya"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {paginationItems.map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 text-xs text-gray-400 select-none"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePageChange(item)}
                          aria-current={item === page ? 'page' : undefined}
                          className={`min-w-[36px] h-9 px-3 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${
                            item === page
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-gray-900 border-neutral-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      aria-label="Halaman berikutnya"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}

          {/* 4. Subtle 1sLabs Consultation CTA */}
          <BlogConsultationCta />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogListPage;
