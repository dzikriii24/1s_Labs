import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  Lock,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Unlock,
  X
} from 'lucide-react';
import type {
  ArticlePriority,
  ArticleStatus,
  ArticleVisibility,
  BlogAuthor,
  BlogCategory,
  BlogTag,
  SeoAnalysisResult,
  TopicCluster
} from '../../../../../services/blogApi';
import { PRIORITY_META, STATUS_META } from '../blogUiUtils';
import { ArticleSEOPanel } from './ArticleSEOPanel';
import { quickSlugify, type EditorFormState, type SidebarInspectorTab } from './editorTypes';

interface ArticleSettingsSidebarProps {
  open: boolean;
  activeTab: SidebarInspectorTab;
  form: EditorFormState;
  slugLocked: boolean;
  categories: BlogCategory[];
  tagsList: BlogTag[];
  authors: BlogAuthor[];
  clusters: TopicCluster[];
  seo: SeoAnalysisResult;
  analyzing: boolean;
  aiLoadingTask: string | null;
  optimizingOneClick: boolean;
  revisionCount: number;
  onChangeTab: (tab: SidebarInspectorTab) => void;
  onClose: () => void;
  onUpdateField: <K extends keyof EditorFormState>(field: K, value: EditorFormState[K]) => void;
  onToggleSlugLock: () => void;
  onOpenFeaturedMedia: () => void;
  onOpenOgMedia: () => void;
  onGenerateFeaturedAlt: () => void;
  onRunAiTask: (task: string, extraContext?: string) => void;
  onRunOneClickOptimize: () => void;
  onOpenRevisions: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  value: ArticleVisibility;
  label: string;
  desc: string;
}> = [
  { value: 'public', label: 'Publik', desc: 'Tampil di /blog, sitemap, dan Google' },
  { value: 'unlisted', label: 'Unlisted (Link Saja)', desc: 'Bisa diakses via URL, tidak terindeks' },
  { value: 'private', label: 'Privat (Admin)', desc: 'Hanya dapat dilihat oleh tim editorial' }
];

export const ArticleSettingsSidebar: React.FC<ArticleSettingsSidebarProps> = ({
  open,
  activeTab,
  form,
  slugLocked,
  categories,
  tagsList,
  authors,
  clusters,
  seo,
  analyzing,
  aiLoadingTask,
  optimizingOneClick,
  revisionCount,
  onChangeTab,
  onClose,
  onUpdateField,
  onToggleSlugLock,
  onOpenFeaturedMedia,
  onOpenOgMedia,
  onGenerateFeaturedAlt,
  onRunAiTask,
  onRunOneClickOptimize,
  onOpenRevisions
}) => {
  const [tagInput, setTagInput] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);

  if (!open) return null;

  const handleAddTag = (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    if (!form.tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onUpdateField('tags', [...form.tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateField(
      'tags',
      form.tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleCopyPermalink = async () => {
    const url = `https://1slabs.my.id/blog/${form.slug || quickSlugify(form.title || 'artikel')}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const sidebarInner = (
    <div className="flex flex-col h-full bg-zinc-50/70 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      {/* Inspector Header Tabs */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'post', label: 'Post', Icon: FileText },
              { id: 'seo', label: 'SEO', Icon: Search },
              { id: 'advanced', label: 'Advanced', Icon: Settings2 }
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChangeTab(id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Icon size={13} />
                {label}
                {id === 'seo' && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      seo.seo_score >= 80
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : seo.seo_score >= 55
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {seo.seo_score}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Tutup Panel Pengaturan"
          className="p-1.5 mr-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900"
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'post' && (
          <div className="space-y-4 text-xs">
            {/* Publishing Summary Card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Ringkasan & Publikasi</span>
                <button
                  type="button"
                  onClick={onOpenRevisions}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  <History size={12} /> {revisionCount} Revisi
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => onUpdateField('status', e.target.value as ArticleStatus)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {(Object.keys(STATUS_META) as ArticleStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_META[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Visibilitas</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => onUpdateField('visibility', e.target.value as ArticleVisibility)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Eye size={12} className="shrink-0 text-zinc-400" />
                {VISIBILITY_OPTIONS.find((v) => v.value === form.visibility)?.desc}
              </p>

              {/* Publish / Schedule Date */}
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  {form.status === 'scheduled' ? 'Jadwal Tayang' : 'Tanggal Publikasi'}
                </label>
                <input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => onUpdateField('published_at', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Priority & Editorial Deadline */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Prioritas</label>
                  <select
                    value={form.priority}
                    onChange={(e) => onUpdateField('priority', e.target.value as ArticlePriority)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {(Object.keys(PRIORITY_META) as ArticlePriority[]).map((pr) => (
                      <option key={pr} value={pr}>
                        {PRIORITY_META[pr].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => onUpdateField('due_date', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Penulis (Author)</label>
                {authors.length > 0 ? (
                  <select
                    value={form.author_id}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      onUpdateField('author_id', nextId);
                      const picked = authors.find((a) => String(a.id) === nextId);
                      if (picked) {
                        onUpdateField('author_name', picked.name);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">-- Pilih Penulis --</option>
                    {authors.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={(e) => onUpdateField('author_name', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                )}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => onUpdateField('is_featured', e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Artikel Unggulan</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_pillar}
                    onChange={(e) => onUpdateField('is_pillar', e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Pillar Content</span>
                </label>
              </div>
            </div>

            {/* Permalink / Slug */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Permalink URL</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onToggleSlugLock}
                    title={slugLocked ? 'Slug terkunci (klik untuk ubah)' : 'Sinkron otomatis dengan judul'}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    {slugLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    {slugLocked ? 'Terkunci' : 'Otomatis'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPermalink}
                    title="Salin URL Artikel"
                    className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 hover:text-blue-600"
                  >
                    {copiedSlug ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5">
                <span className="text-[11px] text-zinc-400 shrink-0">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => onUpdateField('slug', quickSlugify(e.target.value))}
                  placeholder="slug-artikel"
                  className="flex-1 min-w-0 bg-transparent text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none ml-0.5"
                />
              </div>
            </div>

            {/* Category, Topic Cluster, Tags */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-3">
              <div>
                <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Kategori</label>
                <select
                  value={form.category_id}
                  onChange={(e) => onUpdateField('category_id', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  <Layers size={12} className="text-blue-600" /> Topic Cluster (Opsional)
                </label>
                <select
                  value={form.cluster_id}
                  onChange={(e) => onUpdateField('cluster_id', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- Tidak terhubung cluster --</option>
                  {clusters.map((cl) => (
                    <option key={cl.id} value={String(cl.id)}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  <Tag size={12} className="text-blue-600" /> Tags ({form.tags.length})
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    list="oneslabs-existing-tags"
                    placeholder="Tambah tag & Enter..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <datalist id="oneslabs-existing-tags">
                    {tagsList.map((tg) => (
                      <option key={tg.id} value={tg.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200"
                    title="Tambah Tag"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium text-[11px]"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600"
                          title={`Hapus tag ${tag}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image Compact Settings */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-blue-600" /> Gambar Utama
                </span>
                <button
                  type="button"
                  onClick={onOpenFeaturedMedia}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  {form.featured_image ? 'Ganti Gambar' : 'Pilih Media'}
                </button>
              </div>

              {form.featured_image ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100">
                  <img
                    src={form.featured_image}
                    alt={form.featured_image_alt || form.title || 'Featured'}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateField('featured_image', '');
                      onUpdateField('featured_image_alt', '');
                      onUpdateField('featured_image_caption', '');
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-zinc-900/75 text-white hover:bg-rose-600"
                    title="Hapus Gambar Utama"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenFeaturedMedia}
                  className="w-full py-5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  Klik untuk unggah atau pilih Media Library
                </button>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">Alt Text Gambar</label>
                  <button
                    type="button"
                    disabled={!form.featured_image || aiLoadingTask === 'featured_alt'}
                    onClick={onGenerateFeaturedAlt}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40"
                  >
                    {aiLoadingTask === 'featured_alt' ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Sparkles size={11} />
                    )}
                    Alt AI
                  </button>
                </div>
                <input
                  type="text"
                  value={form.featured_image_alt}
                  onChange={(e) => onUpdateField('featured_image_alt', e.target.value)}
                  placeholder="Deskripsi gambar untuk aksesibilitas & SEO..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Keterangan Gambar (Caption)
                </label>
                <input
                  type="text"
                  value={form.featured_image_caption}
                  onChange={(e) => onUpdateField('featured_image_caption', e.target.value)}
                  placeholder="Sumber atau penjelasan singkat di bawah foto..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Excerpt & Editorial Notes */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-3">
              <div>
                <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Ringkasan / Excerpt ({form.excerpt.length} kar)
                </label>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => onUpdateField('excerpt', e.target.value)}
                  placeholder="Ringkasan singkat artikel untuk kartu blog..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">Catatan Editorial Internal</label>
                <textarea
                  rows={2}
                  value={form.editorial_notes}
                  onChange={(e) => onUpdateField('editorial_notes', e.target.value)}
                  placeholder="Catatan revisi atau referensi tim internal (tidak tampil ke publik)..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <ArticleSEOPanel
            form={form}
            seo={seo}
            analyzing={analyzing}
            aiLoadingTask={aiLoadingTask}
            optimizingOneClick={optimizingOneClick}
            onUpdateField={onUpdateField}
            onRunAiTask={onRunAiTask}
            onRunOneClickOptimize={onRunOneClickOptimize}
          />
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4 text-xs">
            {/* Canonical & Indexing */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-3">
              <p className="font-bold text-zinc-900 dark:text-zinc-100">Indexing & Canonical</p>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Canonical URL</label>
                <input
                  type="url"
                  value={form.canonical_url}
                  onChange={(e) => onUpdateField('canonical_url', e.target.value)}
                  placeholder={`https://1slabs.my.id/blog/${form.slug || 'slug-artikel'}`}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Biarkan kosong untuk menggunakan URL artikel 1sLabs otomatis.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Robots Meta Directive
                </label>
                <select
                  value={form.robots_directive}
                  onChange={(e) => onUpdateField('robots_directive', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="index,follow">index, follow (Direkomendasikan)</option>
                  <option value="noindex,follow">noindex, follow (Sembunyikan dari Google)</option>
                  <option value="index,nofollow">index, nofollow</option>
                  <option value="noindex,nofollow">noindex, nofollow</option>
                </select>
              </div>
            </div>

            {/* Structured Data Schema */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-2.5">
              <p className="font-bold text-zinc-900 dark:text-zinc-100">Schema.org Structured Data</p>
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Tipe Schema JSON-LD</label>
                <select
                  value={form.schema_type}
                  onChange={(e) => onUpdateField('schema_type', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="BlogPosting">BlogPosting (Artikel Blog Standar)</option>
                  <option value="Article">Article (Artikel Editorial Umum)</option>
                  <option value="TechArticle">TechArticle (Panduan Teknis / Engineering)</option>
                  <option value="HowTo">HowTo (Tutorial Langkah-demi-Langkah)</option>
                </select>
              </div>
            </div>

            {/* Open Graph Settings */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-3 space-y-3">
              <p className="font-bold text-zinc-900 dark:text-zinc-100">Open Graph (Social Sharing)</p>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">OG Title</label>
                <input
                  type="text"
                  value={form.og_title}
                  onChange={(e) => onUpdateField('og_title', e.target.value)}
                  placeholder="Kosongkan untuk mengikuti SEO Title..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1">OG Description</label>
                <textarea
                  rows={2}
                  value={form.og_description}
                  onChange={(e) => onUpdateField('og_description', e.target.value)}
                  placeholder="Kosongkan untuk mengikuti Meta Description..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">OG Image URL</label>
                  <button
                    type="button"
                    onClick={onOpenOgMedia}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Pilih Media
                  </button>
                </div>
                <input
                  type="text"
                  value={form.og_image}
                  onChange={(e) => onUpdateField('og_image', e.target.value)}
                  placeholder="Kosongkan untuk menggunakan Featured Image..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Revision Shortcut */}
            <button
              type="button"
              onClick={onOpenRevisions}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 font-semibold text-zinc-700 dark:text-zinc-200"
            >
              <History size={14} className="text-blue-600" />
              Buka Riwayat Revisi ({revisionCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Panel */}
      <aside className="hidden lg:block w-[348px] xl:w-[372px] shrink-0 h-full overflow-hidden">
        {sidebarInner}
      </aside>

      {/* Mobile / Tablet Slide-over Drawer */}
      <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[1px]" onClick={onClose} />
        <aside className="relative z-10 w-[min(92vw,372px)] h-full shadow-2xl overflow-hidden">
          {sidebarInner}
        </aside>
      </div>
    </>
  );
};

