import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  Gift,
  Globe,
  Server,
  Layout,
  Cpu,
  Code,
  Receipt,
  Wrench,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Calendar,
  MessageSquare,
  Database
} from 'lucide-react';
import { DOCS_CATEGORIES as STATIC_CATEGORIES, ALL_DOC_ARTICLES as STATIC_ARTICLES, DocArticle, DocCategory } from '../data/docsData';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { api } from '../services/api';
import notify from '../lib/notify';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Gift,
  Globe,
  Server,
  Layout,
  Cpu,
  Code,
  Receipt,
  Wrench,
  Shield,
  Database,
  BookOpen
};

export const DocumentationPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // Dynamic Categories from API, fallback to static docs
  const [categories, setCategories] = useState<DocCategory[]>(STATIC_CATEGORIES);
  const [extraArticle, setExtraArticle] = useState<DocArticle | null>(null);

  // Flattened all articles across loaded categories
  const allArticles: DocArticle[] = useMemo(() => {
    const list: DocArticle[] = [];
    categories.forEach((cat) => {
      cat.articles.forEach((art) => list.push(art));
    });
    if (extraArticle && !list.some((a) => a.slug === extraArticle.slug)) {
      list.push(extraArticle);
    }
    return list.length > 0 ? list : STATIC_ARTICLES;
  }, [categories, extraArticle]);

  // Fetch dynamic categories from API
  useEffect(() => {
    let isMounted = true;
    api.docs
      .getAll()
      .then((res) => {
        if (isMounted && res.success && res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      })
      .catch((err) => {
        // Fallback silently to static docs
        console.warn('Docs API fallback to static:', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch specific article if not in loaded list
  useEffect(() => {
    if (!slug) return;
    const exists = allArticles.some((a) => a.slug === slug);
    if (!exists) {
      api.docs
        .getBySlug(slug)
        .then((res) => {
          if (res.success && res.article) {
            setExtraArticle(res.article);
          }
        })
        .catch(() => {});
    }
  }, [slug, allArticles]);

  // Selected article
  const currentArticle: DocArticle = useMemo(() => {
    if (!slug) {
      return allArticles[0] || STATIC_ARTICLES[0];
    }
    const found = allArticles.find((a) => a.slug === slug);
    return found || extraArticle || allArticles[0] || STATIC_ARTICLES[0];
  }, [slug, allArticles, extraArticle]);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    STATIC_CATEGORIES.forEach((c) => {
      init[c.id] = true;
    });
    return init;
  });

  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  // Toggle category collapse
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filtered articles based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.content && a.content.toLowerCase().includes(q)) ||
        (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  }, [searchQuery, allArticles]);

  // Current article index for next/prev navigation
  const currentIndex = allArticles.findIndex((a) => a.slug === currentArticle.slug);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // Copy code helper
  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(idx);
    notify.success('Kode berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedCodeIndex(null), 2500);
  };

  // Inline formatting helper for bold and code
  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-gray-800 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">$1</code>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  };

  // Render markdown-like content cleanly with interactive code blocks
  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockCount = 0;

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const lang = part.slice(3, firstLineEnd).trim() || 'bash';
        const code = part.slice(firstLineEnd + 1, -3).trim();
        const codeIdx = codeBlockCount++;
        const isCopied = copiedCodeIndex === codeIdx;

        return (
          <div key={index} className="my-5 rounded-2xl overflow-hidden border border-neutral-800 bg-[#070A11] shadow-lg font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800 text-gray-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 font-mono">{lang}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(code, codeIdx)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-sans">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-sans">Salin Kode</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-400 leading-relaxed font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Normal text blocks: format headings and lists
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-3 leading-relaxed text-neutral-700 dark:text-neutral-300 text-sm sm:text-base">
          {lines.map((line, lIdx) => {
            if (line.startsWith('### ')) {
              const hTitle = line.replace('### ', '').trim();
              const anchor = hTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <h3
                  key={lIdx}
                  id={anchor}
                  className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white pt-6 pb-1 scroll-mt-28 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2 font-['Mori',_sans-serif]"
                >
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base font-normal">#</span>
                  {hTitle}
                </h3>
              );
            }
            if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2.5 pl-2 my-1">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    {line.slice(0, 1)}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(3)) }} />
                </div>
              );
            }
            if (line.startsWith('- ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-2 my-1 text-neutral-700 dark:text-neutral-300">
                  <span className="text-indigo-500 font-bold shrink-0 mt-1">&bull;</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
                </div>
              );
            }
            if (!line.trim()) return null;
            return <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
          })}
        </div>
      );
    });
  };

  const canonicalUrl = `https://1slabs.my.id/docs/${currentArticle.slug}`;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0B0F19] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      <Helmet>
        <title>{`${currentArticle.title} - Dokumentasi Resmi 1sLabs`}</title>
        <meta name="description" content={currentArticle.description} />
        {currentArticle.keywords && (
          <meta name="keywords" content={currentArticle.keywords.join(', ')} />
        )}
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${currentArticle.title} - Dokumentasi 1sLabs`} />
        <meta property="og:description" content={currentArticle.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Official 1sLabs Header */}
      <Header />

      {/* Sub-Header Bar (Clean, Integrated with Header) */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Buka menu dokumentasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/docs" className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs font-mono">
                DOCS
              </span>
              <span className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base hidden sm:inline font-['Mori',_sans-serif]">
                Pusat Dokumentasi 1sLabs
              </span>
            </Link>
          </div>

          {/* Quick Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumentasi (cth. deploy nodejs, cpanel, autossl, free plan)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-800/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Live Search Popup */}
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-2.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                  Hasil Pencarian ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    Tidak ditemukan panduan untuk kata kunci "{searchQuery}".
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {searchResults.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/docs/${item.slug}`}
                        onClick={() => setSearchQuery('')}
                        className="block p-3 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-indigo-500 font-normal">{item.categoryTitle}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/portal"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Documentation Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar (Desktop Navigation) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-3 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2 flex items-center justify-between">
              <span>Daftar Kategori</span>
              <span className="text-[10px] bg-neutral-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-neutral-500 font-mono">
                {categories.length} Topik
              </span>
            </div>

            <nav className="space-y-1">
              {categories.map((cat) => {
                const IconComponent = ICON_MAP[cat.iconName] || BookOpen;
                const isExpanded = expandedCategories[cat.id] ?? true;
                const hasActiveArticle = cat.articles.some((a) => a.slug === currentArticle.slug);

                return (
                  <div key={cat.id} className="rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-left rounded-2xl transition-colors cursor-pointer ${
                        hasActiveArticle
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComponent className="w-4 h-4 shrink-0 text-indigo-500" />
                        <span className="truncate">{cat.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-neutral-200 dark:border-neutral-800 ml-4 mt-1">
                        {cat.articles.map((art) => {
                          const isCurrent = art.slug === currentArticle.slug;
                          return (
                            <Link
                              key={art.slug}
                              to={`/docs/${art.slug}`}
                              className={`block px-3 py-2 rounded-xl text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-gray-800/60'
                              }`}
                            >
                              {art.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Center Main Article Content */}
          <main className="lg:col-span-6 bg-white dark:bg-gray-900/80 rounded-3xl p-6 sm:p-8 lg:p-10 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6 backdrop-blur-sm">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <Link to="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400">Dokumentasi</Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{currentArticle.categoryTitle}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-900 dark:text-white font-bold truncate max-w-[200px]">{currentArticle.title}</span>
            </div>

            {/* Article Header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  {currentArticle.categoryTitle}
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentArticle.readingTime}
                </span>
                {currentArticle.lastUpdated && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Pembaruan: {currentArticle.lastUpdated}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-['Mori',_sans-serif] leading-tight">
                {currentArticle.title}
              </h1>

              {currentArticle.description && (
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed border-l-4 border-indigo-600 pl-3.5 bg-neutral-50 dark:bg-gray-800/40 py-2.5 rounded-r-2xl">
                  {currentArticle.description}
                </p>
              )}
            </div>

            {/* Article Content */}
            <div className="article-body border-t border-neutral-100 dark:border-neutral-800 pt-4">
              {renderContent(currentArticle.content)}
            </div>

            {/* Helpful Feedback Box */}
            <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-gray-800/40 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Apakah panduan ini membantu Anda?</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Umpan balik Anda membantu kami memperbarui dokumentasi teknis 1sLabs.</p>
                </div>
                {feedbackGiven ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Terima kasih atas penilaian Anda!
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackGiven('yes');
                        notify.success('Terima kasih atas tanggapan positif Anda!');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 hover:border-emerald-300 cursor-pointer shadow-xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackGiven('no');
                        notify.info('Terima kasih. Kami akan terus menyempurnakan artikel ini.');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-rose-600 hover:border-rose-300 cursor-pointer shadow-xs"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Belum
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Next / Previous Article Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {prevArticle ? (
                <Link
                  to={`/docs/${prevArticle.slug}`}
                  className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-gray-800/70 text-left transition group shadow-xs"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 mb-1 font-mono">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                    Sebelumnya
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                    {prevArticle.title}
                  </div>
                </Link>
              ) : <div />}

              {nextArticle ? (
                <Link
                  to={`/docs/${nextArticle.slug}`}
                  className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-gray-800/70 text-right transition group shadow-xs"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-end gap-1 mb-1 font-mono">
                    Selanjutnya
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                    {nextArticle.title}
                  </div>
                </Link>
              ) : <div />}
            </div>
          </main>

          {/* Right Sidebar: On This Page (TOC) & Need Support */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            {/* Table of Contents */}
            {currentArticle.toc && currentArticle.toc.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  Pada Halaman Ini
                </h4>
                <nav className="space-y-1.5 text-xs">
                  {currentArticle.toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block py-0.5 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Need Direct Help Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-gray-900 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Butuh Bantuan Teknis?</h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                Punya kendala teknis deployment atau butuh pendampingan konfigurasi? Tim engineer 1sLabs siap mendampingi.
              </p>
              <a
                href="https://wa.me/6285156296580?text=Halo%201sLabs%2C%20saya%20sedang%20membaca%20dokumentasi%20dan%20memerlukan%20bantuan%20teknis."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition shadow-xs w-full justify-center"
              >
                <span>WhatsApp Engineer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </aside>

        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white dark:bg-gray-900 h-full overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="font-bold text-sm text-neutral-900 dark:text-white font-['Mori',_sans-serif]">Kategori Dokumentasi</div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                    {cat.title}
                  </div>
                  <div className="pl-3 space-y-1 border-l border-neutral-200 dark:border-neutral-800">
                    {cat.articles.map((art) => (
                      <Link
                        key={art.slug}
                        to={`/docs/${art.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-1.5 text-xs ${
                          art.slug === currentArticle.slug
                            ? 'text-indigo-600 font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {art.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default DocumentationPage;
