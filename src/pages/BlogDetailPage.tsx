import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Layers,
  List,
  MessageSquare,
  Tag,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
  BlogArticleCard,
  BlogConsultationCta,
} from '../components/blog/BlogArticleCard';
import { formatBlogDate } from '../utils/blogFormat';
import { blogApi, type BlogArticle } from '../services/blogApi';

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Normalize heading hierarchy (prevent body <h1>), wrap <table> for safe mobile scrolling,
 * and assign deterministic IDs to <h2>/<h3> elements for the interactive Table of Contents.
 */
function prepareArticleContent(rawHtml: string): { html: string; headings: TocHeading[] } {
  if (!rawHtml) return { html: '', headings: [] };

  // Downgrade any accidental body <h1> to <h2> to preserve strict single-H1 document hierarchy
  let normalized = rawHtml.replace(/<(\/?)h1(\b[^>]*)>/gi, '<$1h2$2>');

  // Wrap bare <table> tags inside a horizontally scrollable container
  normalized = normalized.replace(
    /(<div\b[^>]*class=["'][^"']*oneslabs-table-wrap[^"']*["'][^>]*>\s*)?(<table\b[\s\S]*?<\/table>)/gi,
    (full, existingWrapper, tableHtml) => {
      if (existingWrapper) return full;
      return `<div class="oneslabs-table-wrap">${tableHtml}</div>`;
    }
  );

  const headings: TocHeading[] = [];
  const usedIds = new Set<string>();

  const html = normalized.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag, attrs, inner) => {
      const plain = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim();
      if (!plain) return full;

      const existingIdMatch = attrs.match(/\bid=(["'])(.*?)\1/i);
      const baseId = existingIdMatch
        ? existingIdMatch[2]
        : plain
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 64) || `bagian-${headings.length + 1}`;

      let finalId = baseId;
      let counter = 2;
      while (usedIds.has(finalId)) {
        finalId = `${baseId}-${counter}`;
        counter += 1;
      }
      usedIds.add(finalId);

      headings.push({
        id: finalId,
        text: plain,
        level: tag.toLowerCase() === 'h3' ? 3 : 2,
      });

      const cleanedAttrs = attrs.replace(/\sid=(["']).*?\1/gi, '');
      return `<${tag}${cleanedAttrs} id="${finalId}">${inner}</${tag}>`;
    }
  );

  return { html, headings };
}

function getInitials(name?: string | null): string {
  const clean = (name || '1sLabs').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isPreview = searchParams.get('preview') === '1';
  const fromQuery =
    typeof (location.state as { fromQuery?: unknown } | null)?.fromQuery === 'string'
      ? ((location.state as { fromQuery: string }).fromQuery || '')
      : '';
  const backToBlogUrl = fromQuery ? `/blog?${fromQuery}` : '/blog';

  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [prevArticle, setPrevArticle] = useState<{
    id: number;
    title: string;
    slug: string;
  } | null>(null);
  const [nextArticle, setNextArticle] = useState<{
    id: number;
    title: string;
    slug: string;
  } | null>(null);
  const [related, setRelated] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [featuredImgError, setFeaturedImgError] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const articleBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setFeaturedImgError(false);
    setOpenFaqIdx(0);
    setMobileTocOpen(false);
    setReadingProgress(0);
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    blogApi
      .getPostBySlug(slug, isPreview)
      .then((res) => {
        if (cancelled) return;
        setArticle(res.article);
        setPrevArticle(res.prevArticle || null);
        setNextArticle(res.nextArticle || null);
        setRelated((res.relatedArticles || []).slice(0, 3));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const redirectTarget = (err as { redirect?: { target_url?: unknown } } | null)?.redirect
          ?.target_url;
        if (typeof redirectTarget === 'string' && redirectTarget) {
          if (/^https?:\/\//i.test(redirectTarget)) {
            window.location.replace(redirectTarget);
          } else {
            navigate(redirectTarget, { replace: true });
          }
          return;
        }
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, isPreview, navigate]);

  const { html: renderedHtml, headings: tocHeadings } = useMemo(
    () => prepareArticleContent(article?.content || ''),
    [article?.content]
  );

  const showToc = tocHeadings.length >= 2;

  // Reading progress indicator across article prose container
  useEffect(() => {
    if (!article) return undefined;
    const handleScroll = () => {
      const target = articleBodyRef.current;
      if (!target) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setReadingProgress(
          docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0
        );
        return;
      }

      const rect = target.getBoundingClientRect();
      const totalDistance = Math.max(1, target.offsetHeight - window.innerHeight * 0.5);
      const passed = Math.max(0, -rect.top + window.innerHeight * 0.2);
      setReadingProgress(Math.min(100, Math.max(0, (passed / totalDistance) * 100)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [article, renderedHtml]);

  // Scrollspy for interactive Table of Contents (active when >= 2 headings)
  useEffect(() => {
    if (!showToc) return undefined;

    const firstHeadingId = tocHeadings[0]?.id || '';
    if (firstHeadingId && !activeTocId) {
      setActiveTocId(firstHeadingId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveTocId(visible[0].target.id);
        }
      },
      { rootMargin: '-104px 0px -65% 0px', threshold: 0.05 }
    );

    tocHeadings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [showToc, tocHeadings, activeTocId]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setActiveTocId(id);
    setMobileTocOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-8 sm:pt-12 pb-20 animate-pulse space-y-6">
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="space-y-3">
            <div className="h-6 w-28 bg-blue-50 dark:bg-blue-950/50 rounded-full" />
            <div className="h-10 w-11/12 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-5 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-gray-800 rounded-3xl" />
          <div className="space-y-3 pt-4">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
        <Helmet>
          <title>Artikel Tidak Ditemukan | 1sLabs</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="font-['Mori',_'Inter',_sans-serif] text-2xl sm:text-3xl font-bold tracking-tight">
            Artikel Tidak Ditemukan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2.5 max-w-md text-sm sm:text-base leading-relaxed">
            Halaman artikel yang Anda tuju mungkin sudah dipindahkan, masih berstatus draft, atau URL tidak tersedia.
          </p>
          <Link
            to={backToBlogUrl}
            className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Blog 1sLabs
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const canonical = article.canonical_url || `https://1slabs.my.id/blog/${article.slug}`;
  const seoTitle = article.meta_title || article.title;
  const seoDesc = article.meta_description || article.excerpt || '';
  const ogImgRaw = article.og_image || article.featured_image || 'https://1slabs.my.id/logo1slabs.png';
  const ogImg = /^https?:\/\//i.test(ogImgRaw)
    ? ogImgRaw
    : `https://1slabs.my.id${ogImgRaw.startsWith('/') ? '' : '/'}${ogImgRaw}`;

  const faqItems = Array.isArray(article.faq_items)
    ? article.faq_items.filter((f) => f && f.question && f.answer)
    : [];

  const publishedDateStr = formatBlogDate(article.published_at || article.created_at, 'long');
  const updatedDateStr = formatBlogDate(article.updated_at, 'long');
  const showUpdatedNote = Boolean(
    updatedDateStr && publishedDateStr && updatedDateStr !== publishedDateStr
  );
  const readingMinutes = Math.max(1, Number(article.reading_time) || 3);
  const authorName = article.author_name || 'Tim Editorial 1sLabs';

  const graph: Record<string, unknown>[] = [
    {
      '@type': article.schema_type || 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      headline: seoTitle,
      description: seoDesc,
      image: ogImg,
      author: { '@type': 'Person', name: authorName },
      publisher: {
        '@type': 'Organization',
        name: '1sLabs',
        url: 'https://1slabs.my.id/',
        logo: { '@type': 'ImageObject', url: 'https://1slabs.my.id/logo1slabs.png' },
      },
      datePublished: new Date(article.published_at || article.created_at).toISOString(),
      dateModified: new Date(
        article.updated_at || article.published_at || article.created_at
      ).toISOString(),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://1slabs.my.id' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://1slabs.my.id/blog' },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
      ],
    },
  ];

  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  const shareUrl = canonical;
  const shareText = encodeURIComponent(`${article.title} — 1sLabs`);
  const encodedShareUrl = encodeURIComponent(shareUrl);

  const handleCopyShare = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
      <Helmet>
        <title>{seoTitle} | 1sLabs Blog</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonical} />
        <meta
          name="robots"
          content={
            article.visibility === 'unlisted'
              ? 'noindex, nofollow'
              : article.robots_directive || 'index, follow'
          }
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.og_title || seoTitle} />
        <meta property="og:description" content={article.og_description || seoDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImg} />
        <meta property="og:site_name" content="1sLabs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={ogImg} />
        <script type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}
        </script>
      </Helmet>

      {/* Subtle Top Reading Progress Bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2.5px] z-[60] pointer-events-none bg-transparent"
      >
        <div
          className="h-full bg-blue-600 transition-[width] duration-100 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <Header />

      <main className="flex-1 pt-6 sm:pt-10 pb-20">
        {isPreview && article.status !== 'published' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium">
              Mode Pratinjau Admin — Artikel ini berstatus “{article.status}” dan belum dipublikasikan untuk umum.
            </div>
          </div>
        )}

        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Navigation Bar: Back Link & Breadcrumb */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Link
                to={backToBlogUrl}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Blog</span>
              </Link>

              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
              >
                <Link to="/" className="hover:text-blue-600 transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <Link to="/blog" className="hover:text-blue-600 transition-colors">
                  Blog
                </Link>
                {article.category_name && article.category_slug && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Link
                      to={`/blog?category=${encodeURIComponent(article.category_slug)}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {article.category_name}
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Article Header Hierarchy */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {article.category_name && article.category_slug && (
                  <Link
                    to={`/blog?category=${encodeURIComponent(article.category_slug)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50 hover:bg-blue-100/70 dark:hover:bg-blue-950 transition-colors"
                  >
                    {article.category_name}
                  </Link>
                )}
                {article.cluster_name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {article.cluster_name}
                  </span>
                )}
              </div>

              <h1 className="font-['Mori',_'Inter',_sans-serif] text-2xl sm:text-4xl lg:text-[2.625rem] font-bold tracking-tight text-gray-900 dark:text-white leading-[1.16]">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Author, Date, Reading Time & Minimalist Share Row */}
              <div className="pt-4 pb-4 border-y border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(authorName)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                      {authorName}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
                      {publishedDateStr && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {publishedDateStr}
                        </span>
                      )}
                      {showUpdatedNote && (
                        <span className="hidden sm:inline text-gray-400 dark:text-gray-500">
                          (Diperbarui {updatedDateStr})
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {readingMinutes} menit baca
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Share Actions */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bagikan ke WhatsApp"
                    title="Bagikan ke WhatsApp"
                    className="px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-gray-900 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bagikan ke LinkedIn"
                    title="Bagikan ke LinkedIn"
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-gray-900 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    LinkedIn
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-gray-900 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400">Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </header>

            {/* Consistent Rounded Featured Image */}
            {article.featured_image && !featuredImgError && (
              <figure className="mt-7 rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={article.featured_image}
                    alt={article.featured_image_alt || article.title}
                    onError={() => setFeaturedImgError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
                {article.featured_image_caption && (
                  <figcaption className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-900 border-t border-neutral-200/70 dark:border-neutral-800 text-center">
                    {article.featured_image_caption}
                  </figcaption>
                )}
              </figure>
            )}
          </div>

          {/* Reading Body + Optional Responsive TOC */}
          <div
            className={`mt-10 ${
              showToc
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start max-w-6xl mx-auto'
                : 'max-w-[74ch] mx-auto'
            }`}
          >
            {/* Main Editorial Prose Column */}
            <div className={showToc ? 'lg:col-span-8 min-w-0' : 'w-full min-w-0'}>
              {/* Mobile & Tablet Collapsible Table of Contents */}
              {showToc && (
                <div className="lg:hidden mb-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-gray-50/70 dark:bg-gray-800/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileTocOpen((prev) => !prev)}
                    aria-expanded={mobileTocOpen}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    <span className="inline-flex items-center gap-2">
                      <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Daftar Isi ({tocHeadings.length})</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        mobileTocOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileTocOpen && (
                    <nav aria-label="Daftar isi artikel" className="px-4 pb-4 pt-1 border-t border-neutral-200/70 dark:border-neutral-800">
                      <ul className="space-y-1.5 text-xs sm:text-sm">
                        {tocHeadings.map((h) => {
                          const isActive = activeTocId === h.id;
                          return (
                            <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                              <button
                                type="button"
                                onClick={() => scrollToHeading(h.id)}
                                className={`w-full text-left py-1 transition-colors ${
                                  isActive
                                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                              >
                                {h.text}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </nav>
                  )}
                </div>
              )}

              {/* Long-form Article Prose */}
              <div
                ref={articleBodyRef}
                className="oneslabs-blog-prose max-w-[74ch]"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />

              {/* Visual Sources & License Attributions (rendered only when credits exist) */}
              {Array.isArray(article.image_attributions) &&
                article.image_attributions.some((att) => att.attribution_text || att.photographer_name) && (
                  <aside className="mt-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-gray-900/50 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Kredit &amp; Lisensi Visual
                    </div>
                    <ul className="space-y-1">
                      {article.image_attributions
                        .filter((att) => att.attribution_text || att.photographer_name)
                        .map((att, idx) => (
                          <li key={idx} className="flex flex-wrap items-center gap-x-1.5">
                            <span className="capitalize font-medium text-gray-600 dark:text-gray-300">
                              {att.role === 'featured' ? 'Foto Utama:' : 'Ilustrasi:'}
                            </span>
                            {att.source_page_url ? (
                              <a
                                href={att.source_page_url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {att.attribution_text || `${att.photographer_name} (${att.license_name || att.provider})`}
                              </a>
                            ) : (
                              <span>
                                {att.attribution_text || `${att.photographer_name} (${att.license_name || att.provider})`}
                              </span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </aside>
                )}

              {/* Structured FAQ Accordion */}
              {faqItems.length > 0 && (
                <section className="mt-12 pt-8 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4">
                  <h2 className="font-['Mori',_'Inter',_sans-serif] text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Pertanyaan Umum (FAQ)
                  </h2>
                  <div className="space-y-3">
                    {faqItems.map((faq, idx) => {
                      const isOpen = openFaqIdx === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-gray-900/60 overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                            className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                          >
                            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 pt-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Tags & Topic Cluster Pillar */}
              {(article.tags && article.tags.length > 0) || article.cluster_name ? (
                <div className="mt-10 pt-6 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4">
                  {article.cluster_name && (
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        Bagian dari Seri Topik:{' '}
                        <strong className="text-gray-900 dark:text-white">
                          {article.cluster_name}
                        </strong>
                      </span>
                      {article.cluster_pillar_slug &&
                        article.cluster_pillar_slug !== article.slug && (
                          <Link
                            to={`/blog/${article.cluster_pillar_slug}`}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            Baca Artikel Pilar →
                          </Link>
                        )}
                    </div>
                  )}

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {article.tags.map((t) => (
                        <Link
                          key={t.id}
                          to={`/blog?tag=${encodeURIComponent(t.slug)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Article Footer Toolbar: Share Channels + Back to Blog */}
              <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Bagikan Artikel Ini
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${shareUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      LinkedIn
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      X
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      Facebook
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Link disalin!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <Link
                  to={backToBlogUrl}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Semua Artikel Blog
                </Link>
              </div>

              {/* Previous / Next Sequential Articles */}
              {(prevArticle || nextArticle) && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prevArticle ? (
                    <Link
                      to={`/blog/${prevArticle.slug}`}
                      state={fromQuery ? { fromQuery } : undefined}
                      className="group p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-gray-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        ← Sebelumnya
                      </div>
                      <div className="font-['Mori',_'Inter',_sans-serif] font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1 line-clamp-2 transition-colors">
                        {prevArticle.title}
                      </div>
                    </Link>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  {nextArticle && (
                    <Link
                      to={`/blog/${nextArticle.slug}`}
                      state={fromQuery ? { fromQuery } : undefined}
                      className="group p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-gray-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-colors sm:text-right"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Berikutnya →
                      </div>
                      <div className="font-['Mori',_'Inter',_sans-serif] font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1 line-clamp-2 transition-colors">
                        {nextArticle.title}
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Desktop Sidebar (Shown ONLY when TOC has >= 2 headings) */}
            {showToc && (
              <aside className="hidden lg:block lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <nav
                  aria-label="Daftar isi artikel"
                  className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-gray-900/60 p-5"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                      <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Daftar Isi
                    </span>
                    <span className="text-[11px] text-gray-400">{tocHeadings.length} bagian</span>
                  </div>

                  <ul className="space-y-1 max-h-[55vh] overflow-y-auto pr-1 text-xs">
                    {tocHeadings.map((h) => {
                      const isActive = activeTocId === h.id;
                      return (
                        <li key={h.id} className={h.level === 3 ? 'pl-3' : ''}>
                          <button
                            type="button"
                            onClick={() => scrollToHeading(h.id)}
                            className={`w-full text-left py-1.5 px-2.5 rounded-lg border-l-2 transition-all line-clamp-2 ${
                              isActive
                                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            {h.text}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Compact Consultation Card */}
                <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-gray-50/70 dark:bg-gray-800/40 p-5 space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Konsultasi 1sLabs
                    </span>
                    <h3 className="font-['Mori',_'Inter',_sans-serif] font-bold text-base text-gray-900 dark:text-white leading-snug">
                      Butuh Bantuan Implementasi Sistem?
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Diskusikan pengembangan web custom, integrasi AI, atau optimasi server bersama engineer kami.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Link
                      to="/schedule"
                      className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      Jadwalkan Konsultasi
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <a
                      href="https://wa.me/6285156296580"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      WhatsApp Tim
                    </a>
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* Related Articles — Shared Card Design */}
          {related.length > 0 && (
            <section className="mt-16 pt-12 border-t border-neutral-200/80 dark:border-neutral-800 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-['Mori',_'Inter',_sans-serif] text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Artikel Terkait Lainnya
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Bacaan lanjutan dari kategori dan topik yang relevan.
                  </p>
                </div>

                <Link
                  to={backToBlogUrl}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Semua Artikel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {related.map((rel) => (
                  <BlogArticleCard key={rel.id} article={rel} fromQuery={fromQuery} />
                ))}
              </div>
            </section>
          )}

          {/* Full-width Restrained Bottom Consultation CTA */}
          <div className="mt-14 sm:mt-16">
            <BlogConsultationCta compact />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetailPage;
