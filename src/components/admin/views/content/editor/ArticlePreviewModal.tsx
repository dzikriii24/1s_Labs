import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  HelpCircle,
  Monitor,
  Smartphone,
  Sparkles,
  User,
  X
} from 'lucide-react';
import type { BlogCategory } from '../../../../../services/blogApi';
import type { EditorFormState } from './editorTypes';
import { sanitizeClientHtml } from './tiptapExtensions';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  form: EditorFormState;
  categories: BlogCategory[];
  readingTime: number;
  wordCount: number;
  onClose: () => void;
}

function extractHeadingsForToc(html: string): Array<{ id: string; tag: 'h2' | 'h3'; text: string }> {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined' || !html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const results: Array<{ id: string; tag: 'h2' | 'h3'; text: string }> = [];
  doc.querySelectorAll('h2, h3').forEach((el, idx) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    results.push({
      id: `preview-sec-${idx}`,
      tag: el.tagName.toLowerCase() === 'h3' ? 'h3' : 'h2',
      text
    });
  });
  return results;
}

export const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  form,
  categories,
  readingTime,
  wordCount,
  onClose
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const category = useMemo(
    () => categories.find((c) => String(c.id) === String(form.category_id)),
    [categories, form.category_id]
  );

  const safeHtml = useMemo(() => sanitizeClientHtml(form.content || '<p></p>'), [form.content]);
  const headings = useMemo(() => extractHeadingsForToc(safeHtml), [safeHtml]);

  if (!isOpen) return null;

  const displayDate = form.published_at
    ? new Date(form.published_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm flex flex-col">
      {/* Top Preview Chrome */}
      <div className="h-14 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Eye size={13} /> Pratinjau Langsung Publik
          </span>
          <span className="hidden sm:inline text-xs text-zinc-500 truncate font-mono">
            https://1slabs.my.id/blog/{form.slug || 'draft-artikel'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Monitor size={13} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Smartphone size={13} /> Mobile (390px)
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={14} /> Tutup Pratinjau
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 overflow-y-auto py-6 px-3 sm:px-6 flex justify-center bg-zinc-200/70 dark:bg-zinc-950">
        <div
          className={`bg-white text-zinc-900 shadow-2xl transition-all duration-200 ${
            viewport === 'mobile'
              ? 'w-[390px] max-w-full rounded-[28px] border-[8px] border-zinc-800 overflow-x-hidden min-h-[760px]'
              : 'w-full max-w-6xl rounded-2xl border border-zinc-200 overflow-hidden'
          }`}
        >
          <div className={viewport === 'mobile' ? 'px-5 py-7' : 'px-8 lg:px-12 py-10'}>
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 mb-5">
              <span>Beranda</span>
              <ChevronRight size={13} />
              <span>Blog</span>
              {category && (
                <>
                  <ChevronRight size={13} />
                  <span className="text-blue-600 font-medium">{category.name}</span>
                </>
              )}
            </nav>

            <div className={viewport === 'desktop' ? 'grid grid-cols-1 lg:grid-cols-12 gap-10' : 'space-y-8'}>
              {/* Main Article Column */}
              <article className={viewport === 'desktop' ? 'lg:col-span-8 min-w-0' : 'min-w-0'}>
                <header className="space-y-4 mb-8">
                  <div className="flex flex-wrap items-center gap-2">
                    {category && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: `${category.color || '#2563eb'}14`,
                          color: category.color || '#2563eb',
                          borderColor: `${category.color || '#2563eb'}33`
                        }}
                      >
                        {category.name}
                      </span>
                    )}
                    {form.visibility !== 'public' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Visibilitas: {form.visibility}
                      </span>
                    )}
                  </div>

                  <h1
                    className={`font-extrabold tracking-tight text-zinc-900 leading-[1.18] ${
                      viewport === 'mobile' ? 'text-2xl' : 'text-3xl sm:text-4xl'
                    }`}
                  >
                    {form.title || 'Judul Artikel Anda Akan Tampil Di Sini'}
                  </h1>

                  {form.excerpt && (
                    <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">{form.excerpt}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                    <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                      <User size={13} className="text-blue-600" />
                      {form.author_name || 'Tim Editorial 1sLabs'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      {displayDate}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} />
                      {readingTime} menit baca ({wordCount} kata)
                    </span>
                  </div>
                </header>

                {form.featured_image && (
                  <figure className="mb-8">
                    <img
                      src={form.featured_image}
                      alt={form.featured_image_alt || form.title}
                      className="w-full max-h-[440px] object-cover rounded-2xl border border-zinc-200"
                    />
                    {form.featured_image_caption && (
                      <figcaption className="text-center text-xs text-zinc-500 mt-2">
                        {form.featured_image_caption}
                      </figcaption>
                    )}
                  </figure>
                )}

                <div className="oneslabs-blog-prose" dangerouslySetInnerHTML={{ __html: safeHtml }} />

                {/* FAQ Section */}
                {form.faq_items.length > 0 && (
                  <section className="mt-10 pt-8 border-t border-zinc-200">
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2 mb-4">
                      <HelpCircle size={20} className="text-blue-600" />
                      Pertanyaan yang Sering Diajukan (FAQ)
                    </h2>
                    <div className="space-y-2.5">
                      {form.faq_items.map((faq, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-zinc-200 bg-zinc-50/50 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-4 py-3 text-left font-semibold text-sm text-zinc-900 flex items-center justify-between gap-3"
                          >
                            <span>{faq.question || 'Pertanyaan FAQ'}</span>
                            <ChevronRight
                              size={15}
                              className={`shrink-0 transition-transform ${openFaq === idx ? 'rotate-90 text-blue-600' : ''}`}
                            />
                          </button>
                          {openFaq === idx && (
                            <div className="px-4 pb-3.5 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-2.5">
                              {faq.answer || 'Jawaban belum diisi.'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tags */}
                {form.tags.length > 0 && (
                  <div className="mt-8 pt-5 border-t border-zinc-100 flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              {/* Sidebar TOC & 1sLabs Consultation Card */}
              <aside className={viewport === 'desktop' ? 'lg:col-span-4 space-y-6' : 'space-y-5'}>
                {headings.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Daftar Isi</p>
                    <ul className="space-y-2 text-sm">
                      {headings.map((h) => (
                        <li
                          key={h.id}
                          className={`${h.tag === 'h3' ? 'pl-3 text-zinc-500 text-xs' : 'font-medium text-zinc-800'}`}
                        >
                          {h.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                    <Sparkles size={14} /> Solusi Digital 1sLabs
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Ingin mengimplementasikan strategi ini di bisnis Anda?
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Diskusikan kebutuhan website, sistem aplikasi kustom, atau infrastruktur digital Anda bersama tim
                    engineering 1sLabs.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                    Konsultasi Gratis <ArrowUpRight size={13} />
                  </span>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

