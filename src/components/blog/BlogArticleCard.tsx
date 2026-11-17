import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Clock, MessageSquare } from 'lucide-react';
import type { BlogArticle } from '../../services/blogApi';
import { formatBlogDate, stripHtmlSnippet } from '../../utils/blogFormat';

interface BlogArticleCardProps {
  article: BlogArticle;
  fromQuery?: string;
}

/**
 * Shared 1sLabs article card used uniformly across the Blog Listing grid
 * and Related Articles sections.
 */
export const BlogArticleCard: React.FC<BlogArticleCardProps> = ({ article, fromQuery }) => {
  const [imgError, setImgError] = useState(false);
  const displayDate = formatBlogDate(article.published_at || article.created_at, 'short');
  const excerptText = stripHtmlSnippet(article.excerpt);
  const readingMinutes = Math.max(1, Number(article.reading_time) || 3);

  return (
    <Link
      to={`/blog/${article.slug}`}
      state={fromQuery ? { fromQuery } : undefined}
      className="group flex flex-col h-full rounded-2xl bg-white dark:bg-gray-900/70 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-200 hover:border-blue-300/90 dark:hover:border-blue-700/70 hover:shadow-[0_12px_32px_-12px_rgba(37,99,235,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Thumbnail Container — Fixed 16:9 Ratio */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-50 dark:bg-gray-800/60 border-b border-neutral-100 dark:border-neutral-800/80">
        {article.featured_image && !imgError ? (
          <img
            src={article.featured_image}
            alt={article.featured_image_alt || article.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/80 via-gray-50 to-white dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 text-blue-600/70 dark:text-blue-400/70">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 shadow-xs flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 min-h-[24px]">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              {article.category_name || 'Insight 1sLabs'}
            </span>
          </div>

          <h3 className="mt-3 font-['Mori',_'Inter',_sans-serif] text-base sm:text-[17px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {excerptText || 'Panduan teknis dan strategi digital terbaru dari tim engineering 1sLabs.'}
          </p>
        </div>

        {/* Clean Single-Row Footer Metadata */}
        <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 min-w-0 truncate">
            {displayDate && (
              <span className="inline-flex items-center gap-1 truncate">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                {displayDate}
              </span>
            )}
            {displayDate && <span aria-hidden="true">·</span>}
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              {readingMinutes} mnt baca
            </span>
          </div>

          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 shrink-0">
            Baca
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export const BlogCardSkeleton: React.FC = () => (
  <div className="flex flex-col rounded-2xl bg-white dark:bg-gray-900/70 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] w-full bg-gray-100 dark:bg-gray-800" />
    <div className="p-5 sm:p-6 space-y-3">
      <div className="h-5 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-2 pt-1">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-12 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  </div>
);

interface BlogConsultationCtaProps {
  compact?: boolean;
}

/**
 * Restrained, non-aggressive 1sLabs consultation CTA aligned with homepage surfaces.
 */
export const BlogConsultationCta: React.FC<BlogConsultationCtaProps> = ({ compact = false }) => (
  <section
    aria-label="Konsultasi Teknologi 1sLabs"
    className={`rounded-3xl bg-gray-50/80 dark:bg-gray-800/40 border border-neutral-200/80 dark:border-neutral-800 ${
      compact ? 'p-6 sm:p-8' : 'p-6 sm:p-10 md:p-12'
    }`}
  >
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="max-w-2xl space-y-2.5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
          Partner Engineering 1sLabs
        </span>
        <h2 className="font-['Mori',_'Inter',_sans-serif] text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Siap membangun sistem web atau otomasi yang lebih andal?
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Diskusikan kebutuhan website custom, integrasi AI &amp; API, atau infrastruktur server bersama engineer 1sLabs dengan estimasi transparan.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Link
          to="/schedule"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
        >
          Jadwalkan Konsultasi
          <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href="https://wa.me/6285156296580?text=Halo%201sLabs%2C%20saya%20baru%20membaca%20artikel%20di%20blog%201sLabs%20dan%20ingin%20berkonsultasi."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 border border-neutral-200 dark:border-neutral-700 text-sm font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          WhatsApp Tim
        </a>
      </div>
    </div>
  </section>
);

