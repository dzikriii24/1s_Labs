import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Wand2,
  XCircle
} from 'lucide-react';
import {
  ArticleImageRecord,
  GenerationItem,
  StockImageCandidate,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import { ScorePill, formatDateId } from '../content/blogUiUtils';
import { MediaLibraryModal } from '../content/MediaLibraryModal';
import { StockImagePickerModal } from './StockImagePickerModal';
import notify from '../../../../lib/notify';

interface AutomationReviewPanelProps {
  initialItemId?: number | null;
  onRefreshOverview: () => void;
  onOpenBlogEditor: (articleId: number) => void;
}

const STATUS_FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'awaiting_review', label: 'Butuh Review' },
  { key: 'rejected', label: 'Ditolak / Revisi' },
  { key: 'published', label: 'Terbit' },
  { key: 'saved_draft', label: 'Draft CMS' },
  { key: 'failed', label: 'Gagal' }
];

export const AutomationReviewPanel: React.FC<AutomationReviewPanelProps> = ({
  initialItemId,
  onRefreshOverview,
  onOpenBlogEditor
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('awaiting_review');
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(initialItemId ?? null);
  const [detail, setDetail] = useState<GenerationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit mode inside review
  const [editTab, setEditTab] = useState<'preview' | 'edit' | 'audit'>('preview');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftMetaTitle, setDraftMetaTitle] = useState('');
  const [draftMetaDesc, setDraftMetaDesc] = useState('');
  const [draftFocusKw, setDraftFocusKw] = useState('');
  const [draftExcerpt, setDraftExcerpt] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftFeaturedAlt, setDraftFeaturedAlt] = useState('');
  const [draftFeaturedCaption, setDraftFeaturedCaption] = useState('');
  const [busyAction, setBusyAction] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [expandedPreview, setExpandedPreview] = useState(false);

  // Image Swap / Stock Picker & Media Library State
  const [stockPickerSlot, setStockPickerSlot] = useState<{
    role: 'featured' | 'inline';
    placementIndex: number;
    sectionHeading?: string;
    query: string;
    altText: string;
    caption: string;
  } | null>(null);
  const [mediaModalSlot, setMediaModalSlot] = useState<{
    role: 'featured' | 'inline';
    placementIndex: number;
    sectionHeading?: string;
    caption: string;
  } | null>(null);

  const selectedIdRef = useRef<number | null>(selectedId);
  selectedIdRef.current = selectedId;

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contentAutomationApi.listItems({ status: statusFilter || undefined, limit: 40 });
      setItems(res.items || []);
      if (!selectedIdRef.current && res.items?.length > 0) {
        setSelectedId(res.items[0].id);
      }
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await contentAutomationApi.getItem(id);
      setDetail(res.item);
      setDraftTitle(res.item.draft_title || res.item.topic);
      setDraftSlug(res.item.draft_slug || '');
      setDraftMetaTitle(res.item.draft_meta_title || '');
      setDraftMetaDesc(res.item.draft_meta_description || '');
      setDraftFocusKw(res.item.draft_focus_keyphrase || res.item.target_keyword);
      setDraftExcerpt(res.item.draft_excerpt || '');
      setDraftContent(res.item.draft_content || '');
      setDraftFeaturedAlt(res.item.featured_image_alt || '');
      setDraftFeaturedCaption(res.item.draft_featured_image_caption || '');
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (initialItemId) {
      setStatusFilter('');
      setSelectedId(initialItemId);
    }
  }, [initialItemId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleSaveEditAndReaudit = async () => {
    if (!detail) return;
    setBusyAction('save');
    try {
      const res = await contentAutomationApi.updateItem(detail.id, {
        draft_title: draftTitle,
        draft_slug: draftSlug,
        draft_meta_title: draftMetaTitle,
        draft_meta_description: draftMetaDesc,
        draft_focus_keyphrase: draftFocusKw,
        draft_excerpt: draftExcerpt,
        draft_content: draftContent,
        featured_image_alt: draftFeaturedAlt,
        draft_featured_image_caption: draftFeaturedCaption
      });
      setDetail(res.item);
      notify.success(
        res.item.quality_passed
          ? 'Draf diperbarui & lolos seluruh Quality Gate.'
          : 'Draf diperbarui. Periksa tab Audit Quality Gate untuk catatan skor.'
      );
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleOneClickOptimize = async () => {
    if (!detail) return;
    setBusyAction('optimize');
    try {
      const res = await contentAutomationApi.optimizeItemWithAi(detail.id);
      setDetail(res.item);
      setDraftTitle(res.item.draft_title || '');
      setDraftMetaTitle(res.item.draft_meta_title || '');
      setDraftMetaDesc(res.item.draft_meta_description || '');
      setDraftFocusKw(res.item.draft_focus_keyphrase || '');
      setDraftExcerpt(res.item.draft_excerpt || '');
      setDraftContent(res.item.draft_content || '');
      notify.success('AI Optimization selesai & Quality Gate diperbarui.');
      await loadList();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleRediscoverImages = async () => {
    if (!detail) return;
    setBusyAction('images');
    try {
      const res = await contentAutomationApi.rediscoverItemImages(detail.id);
      setDetail(res.item);
      setDraftContent(res.item.draft_content || '');
      setDraftFeaturedAlt(res.item.featured_image_alt || '');
      setDraftFeaturedCaption(res.item.draft_featured_image_caption || '');
      notify.success('Pencarian & optimasi gambar artikel selesai.');
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleReplaceFromStock = async (cand: StockImageCandidate, altText: string, caption: string) => {
    if (!detail || !stockPickerSlot) return;
    const res = await contentAutomationApi.replaceItemImage(detail.id, {
      role: stockPickerSlot.role,
      placement_index: stockPickerSlot.placementIndex,
      placement_section: stockPickerSlot.sectionHeading,
      search_query: stockPickerSlot.query,
      candidate: cand,
      alt_text: altText,
      caption
    });
    setDetail(res.item);
    setDraftContent(res.item.draft_content || '');
    setDraftFeaturedAlt(res.item.featured_image_alt || '');
    setDraftFeaturedCaption(res.item.draft_featured_image_caption || '');
    notify.success('Gambar berhasil diunduh, dioptimasi, dan dipasang.');
    await loadList();
    onRefreshOverview();
  };

  const handleReplaceFromMediaLibrary = async (url: string, altText?: string, caption?: string) => {
    if (!detail || !mediaModalSlot) return;
    setBusyAction('replace_img');
    try {
      const res = await contentAutomationApi.replaceItemImage(detail.id, {
        role: mediaModalSlot.role,
        placement_index: mediaModalSlot.placementIndex,
        placement_section: mediaModalSlot.sectionHeading,
        local_url: url,
        alt_text: altText,
        caption: caption ?? mediaModalSlot.caption
      });
      setDetail(res.item);
      setDraftContent(res.item.draft_content || '');
      setDraftFeaturedAlt(res.item.featured_image_alt || '');
      setDraftFeaturedCaption(res.item.draft_featured_image_caption || '');
      notify.success('Gambar dari Media Library dipasang ke artikel.');
      setMediaModalSlot(null);
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleApprove = async (publishMode: 'published' | 'draft', allowOverride = false) => {
    if (!detail) return;
    setBusyAction(publishMode);
    try {
      const res = await contentAutomationApi.approveItem(detail.id, {
        publish_mode: publishMode,
        allow_override: allowOverride
      });
      notify.success(
        publishMode === 'published'
          ? `Artikel diterbitkan ke Blog 1sLabs (/blog/${res.publication.slug}).`
          : `Disimpan sebagai Draft di Blog 1sLabs (ID #${res.publication.article_id}).`
      );
      await loadDetail(detail.id);
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    setBusyAction('reject');
    try {
      await contentAutomationApi.rejectItem(detail.id, rejectReason.trim() || 'Ditolak saat review manual admin.');
      notify.toast('Artikel ditandai rejected.');
      setRejectReason('');
      await loadDetail(detail.id);
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const handleRegenerate = async () => {
    if (!detail) return;
    setBusyAction('regenerate');
    try {
      const res = await contentAutomationApi.regenerateItem(detail.id);
      notify.success(`Job regenerasi #${res.job.id} dimasukkan ke antrean.`);
      await loadList();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setBusyAction('');
    }
  };

  const qr = detail?.quality_report;
  const iq = detail?.image_quality_report || qr?.image_quality;
  const hasHardFailure = Boolean(qr?.hard_failures && qr.hard_failures.length > 0);
  const selectedImages: ArticleImageRecord[] = (detail?.images || []).filter(
    (img) => img.is_selected !== 0 && img.status !== 'failed'
  );
  const featuredRecord = selectedImages.find((img) => img.role === 'featured') || null;
  const inlineRecords = selectedImages.filter((img) => img.role === 'inline');

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key || 'all'}
              onClick={() => {
                setSelectedId(null);
                setStatusFilter(f.key);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={loadList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        {/* Left List */}
        <div className="w-full min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 space-y-2 lg:max-h-[780px] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-zinc-400 py-10 text-center">Memuat daftar artikel...</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-zinc-400 py-10 text-center">Tidak ada artikel untuk filter ini.</p>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className={`w-full min-w-0 text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedId === it.id
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="uppercase font-bold text-blue-600 truncate">{it.status}</span>
                  <span className="text-zinc-400 shrink-0">{formatDateId(it.created_at, true)}</span>
                </div>
                <p className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 break-words">
                  {it.draft_title || it.topic}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <ScorePill label="SEO" score={it.seo_score} />
                  <ScorePill label="GEO" score={it.geo_score} />
                  <ScorePill label="Read" score={it.readability_score} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Review Workbench */}
        <div className="w-full min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {!detail ? (
            <div className="py-20 text-center text-xs text-zinc-400">
              {loadingDetail ? 'Memuat detail artikel...' : 'Pilih artikel di sebelah kiri untuk meninjau hasil Quality Gate dan preview HTML.'}
            </div>
          ) : (
            <>
              {/* Header + Action Toolbar (stacked vertically so title & slug always use full width) */}
              <div className="space-y-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase whitespace-nowrap">
                      {detail.status}
                    </span>
                    {detail.quality_passed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold whitespace-nowrap">
                        <CheckCircle2 size={11} /> Lolos Quality Gate
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold whitespace-nowrap">
                        <ShieldAlert size={11} /> Butuh Perbaikan Audit
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                      Kemiripan: {Math.round((detail.similarity_score || 0) * 100)}%
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg leading-snug text-zinc-900 dark:text-white break-words">
                    {detail.draft_title || detail.topic}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 min-w-0">
                    <span className="min-w-0 break-all">
                      Slug:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                        /blog/{detail.draft_slug}
                      </code>
                    </span>
                    <span className="break-words">
                      Keyphrase: <strong className="text-zinc-800 dark:text-zinc-200">{detail.draft_focus_keyphrase}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    onClick={handleOneClickOptimize}
                    disabled={Boolean(busyAction) || !detail.draft_content}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'optimize' ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                    AI Optimize
                  </button>

                  {!hasHardFailure && detail.draft_content && (
                    <button
                      onClick={() => handleApprove('draft', true)}
                      disabled={Boolean(busyAction)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      <Save size={13} /> Simpan ke Draft CMS
                    </button>
                  )}

                  {!hasHardFailure && detail.draft_content && (
                    <button
                      onClick={() => handleApprove('published', !detail.quality_passed)}
                      disabled={Boolean(busyAction)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      {busyAction === 'published' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <FileCheck2 size={13} />
                      )}
                      {detail.published_article_id ? 'Update & Terbitkan' : 'Setujui & Terbitkan'}
                    </button>
                  )}

                  {detail.published_article_id && (
                    <button
                      onClick={() => onOpenBlogEditor(detail.published_article_id!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Buka di Editor Rich Text
                    </button>
                  )}
                </div>
              </div>

              {/* Subtabs: Preview | Inline Edit | Quality Audit */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'preview', label: 'Preview Artikel HTML', icon: Eye },
                      { id: 'edit', label: 'Edit & Audit Ulang', icon: Sparkles },
                      {
                        id: 'audit',
                        label: `Quality Gate (${(qr?.hard_failures?.length || 0) + (qr?.score_failures?.length || 0)} masalah)`,
                        icon: ShieldAlert
                      }
                    ] as const
                  ).map((t) => {
                    const TIcon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setEditTab(t.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          editTab === t.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        <TIcon size={13} /> {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                      detail.composite_score >= 90
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : detail.composite_score >= 80
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : detail.composite_score >= 70
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {detail.composite_score >= 90
                      ? 'Excellent (90-100)'
                      : detail.composite_score >= 80
                        ? 'Siap Publish (80-89)'
                        : detail.composite_score >= 70
                          ? 'Perlu Perbaikan (70-79)'
                          : 'Perlu Optimasi (<70)'}
                  </span>
                  <ScorePill label="SEO" score={detail.seo_score} />
                  <ScorePill label="Readability" score={detail.readability_score} />
                  <ScorePill label="GEO" score={detail.geo_score} />
                  <ScorePill label="Total" score={detail.composite_score} />
                </div>
              </div>

              {editTab === 'preview' && (
                <div className="space-y-4">
                  {/* Meta Preview Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 min-w-0">
                    <div className="text-[11px] font-mono text-emerald-700 break-all">
                      https://1slabs.my.id/blog/{detail.draft_slug}
                    </div>
                    <div className="text-sm font-bold text-blue-700 break-words">{detail.draft_meta_title || detail.draft_title}</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 break-words">
                      {detail.draft_meta_description || detail.draft_excerpt}
                    </div>

                    {(detail.target_audience ||
                      detail.recommended_category ||
                      detail.featured_image_alt ||
                      detail.generation_trace?.tags?.length) && (
                      <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                        {detail.target_audience && (
                          <div className="min-w-0 break-words">
                            <span className="text-zinc-400">Target Audiens:</span>{' '}
                            <strong className="text-zinc-800 dark:text-zinc-100">{detail.target_audience}</strong>
                          </div>
                        )}
                        {detail.recommended_category && (
                          <div className="min-w-0 break-words">
                            <span className="text-zinc-400">Kategori Rekomendasi:</span>{' '}
                            <strong className="text-zinc-800 dark:text-zinc-100">{detail.recommended_category}</strong>
                          </div>
                        )}
                        {detail.featured_image_recommendation && (
                          <div className="md:col-span-2 min-w-0 break-words">
                            <span className="text-zinc-400">Saran Gambar Utama:</span>{' '}
                            <span>{detail.featured_image_recommendation}</span>
                            {detail.featured_image_alt && (
                              <span className="text-zinc-400"> (Alt: {detail.featured_image_alt})</span>
                            )}
                          </div>
                        )}
                        {detail.generation_trace?.tags && detail.generation_trace.tags.length > 0 && (
                          <div className="md:col-span-2 flex flex-wrap items-center gap-1">
                            <span className="text-zinc-400 mr-1">Tags:</span>
                            {detail.generation_trace.tags.map((tg) => (
                              <span
                                key={tg}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Visual & Image Management Preview Card */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon size={15} className="text-blue-600" />
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          Visual &amp; Featured Image ({selectedImages.length} aktif)
                        </span>
                        {iq && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              iq.passed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            Image Gate: {iq.score}/100
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRediscoverImages}
                          disabled={Boolean(busyAction) || !detail.draft_content}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {busyAction === 'images' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          Cari Gambar AI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStockPickerSlot({
                              role: 'featured',
                              placementIndex: 0,
                              query:
                                featuredRecord?.search_query ||
                                detail.image_plan?.featured?.search_query ||
                                detail.draft_focus_keyphrase ||
                                detail.topic,
                              altText: detail.featured_image_alt || featuredRecord?.alt_text || '',
                              caption: detail.draft_featured_image_caption || featuredRecord?.caption || ''
                            })
                          }
                          disabled={Boolean(busyAction)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-[11px] font-semibold cursor-pointer"
                        >
                          <Search size={11} /> Ganti Featured (Stock)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMediaModalSlot({
                              role: 'featured',
                              placementIndex: 0,
                              caption: detail.draft_featured_image_caption || featuredRecord?.caption || ''
                            })
                          }
                          disabled={Boolean(busyAction)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 text-[11px] font-semibold cursor-pointer"
                        >
                          Media Library
                        </button>
                      </div>
                    </div>

                    {/* Featured Hero Thumbnail */}
                    {detail.draft_featured_image ? (
                      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-3 items-start">
                        <div className="aspect-[16/9] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100">
                          <img
                            src={detail.draft_featured_image}
                            alt={detail.featured_image_alt || detail.draft_title || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold uppercase text-[10px]">
                              {featuredRecord?.provider || 'local'}
                            </span>
                            {featuredRecord?.width ? (
                              <span className="px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-mono">
                                {featuredRecord.width}x{featuredRecord.height}px •{' '}
                                {(featuredRecord.file_format || 'webp').toUpperCase()} •{' '}
                                {Math.round((featuredRecord.file_size_bytes || 0) / 1024)} KB
                              </span>
                            ) : null}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                detail.draft_featured_image.startsWith('/uploads/')
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {detail.draft_featured_image.startsWith('/uploads/') ? 'Lokal Server' : 'External Fallback'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400">Alt Text:</span>{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-100">
                              {detail.featured_image_alt || '-'}
                            </span>
                          </div>
                          {detail.draft_featured_image_caption && (
                            <div>
                              <span className="text-zinc-400">Caption:</span> {detail.draft_featured_image_caption}
                            </div>
                          )}
                          {featuredRecord?.attribution_text && (
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <span>Kredit: {featuredRecord.attribution_text}</span>
                              {featuredRecord.source_page_url && (
                                <a
                                  href={featuredRecord.source_page_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                >
                                  Sumber <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-xs text-amber-800">
                        Featured image belum terpasang. Klik &ldquo;Cari Gambar AI&rdquo;, &ldquo;Ganti Featured (Stock)&rdquo;,
                        atau pilih dari Media Library sebelum publikasi.
                      </div>
                    )}

                    {/* Inline Section Images Strip */}
                    {inlineRecords.length > 0 && (
                      <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 space-y-2">
                        <span className="block text-[11px] font-semibold text-zinc-500">
                          Gambar Pendukung Bagian Artikel ({inlineRecords.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {inlineRecords.map((img) => (
                            <div
                              key={img.id || `${img.role}-${img.placement_index}`}
                              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5"
                            >
                              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-zinc-100">
                                <img
                                  src={img.local_url || img.original_url}
                                  alt={img.alt_text || ''}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {img.placement_section || `Bagian #${img.placement_index}`}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate">
                                {img.provider} • {img.width && img.height ? `${img.width}x${img.height}` : img.file_format}
                              </div>
                              <div className="flex gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStockPickerSlot({
                                      role: 'inline',
                                      placementIndex: img.placement_index,
                                      sectionHeading: img.placement_section || undefined,
                                      query: img.search_query || img.placement_section || detail.draft_focus_keyphrase || '',
                                      altText: img.alt_text || '',
                                      caption: img.caption || ''
                                    })
                                  }
                                  className="flex-1 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-[10px] font-semibold cursor-pointer"
                                >
                                  Ganti Stock
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMediaModalSlot({
                                      role: 'inline',
                                      placementIndex: img.placement_index,
                                      sectionHeading: img.placement_section || undefined,
                                      caption: img.caption || ''
                                    })
                                  }
                                  className="flex-1 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-[10px] font-semibold cursor-pointer"
                                >
                                  Media Library
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HTML Content Render (sanitized cleanly in backend) */}
                  {detail.draft_content ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                        <span>
                          Preview Rendering Artikel (
                          {Number(
                            qr?.metrics?.word_count ??
                              (detail.draft_content
                                ? detail.draft_content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
                                : 0)
                          )}{' '}
                          kata)
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedPreview((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                        >
                          {expandedPreview ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                          {expandedPreview ? 'Ringkas Tinggi' : 'Perluas Preview'}
                        </button>
                      </div>
                      <div
                        className={`oneslabs-blog-prose max-w-none p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-hidden ${
                          expandedPreview ? '' : 'max-h-[560px] overflow-y-auto'
                        }`}
                        dangerouslySetInnerHTML={{ __html: detail.draft_content }}
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      Konten belum tersedia: {detail.error_message || detail.review_notes || 'Proses gagal.'}
                    </div>
                  )}
                </div>
              )}

              {editTab === 'edit' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Judul Artikel</label>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">URL Slug</label>
                      <input
                        type="text"
                        value={draftSlug}
                        onChange={(e) => setDraftSlug(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">SEO Title</label>
                      <input
                        type="text"
                        value={draftMetaTitle}
                        onChange={(e) => setDraftMetaTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Focus Keyphrase</label>
                      <input
                        type="text"
                        value={draftFocusKw}
                        onChange={(e) => setDraftFocusKw(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      value={draftMetaDesc}
                      onChange={(e) => setDraftMetaDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Excerpt Ringkas</label>
                    <textarea
                      rows={2}
                      value={draftExcerpt}
                      onChange={(e) => setDraftExcerpt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Featured Image Alt Text</label>
                      <input
                        type="text"
                        value={draftFeaturedAlt}
                        onChange={(e) => setDraftFeaturedAlt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Featured Image Caption</label>
                      <input
                        type="text"
                        value={draftFeaturedCaption}
                        onChange={(e) => setDraftFeaturedCaption(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Konten HTML</label>
                    <textarea
                      rows={11}
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveEditAndReaudit}
                      disabled={busyAction === 'save'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <Save size={13} /> Simpan Perubahan &amp; Audit Ulang
                    </button>
                  </div>
                </div>
              )}

              {editTab === 'audit' && (
                <div className="space-y-4 text-xs">
                  {iq && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        iq.passed
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-amber-50/80 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                          <ImageIcon size={14} className={iq.passed ? 'text-emerald-600' : 'text-amber-600'} />
                          Image Quality Gate ({iq.score}/100)
                        </h5>
                        <span className="text-[11px] text-zinc-600">
                          Featured: {iq.has_featured ? 'Ada' : 'Belum Ada'} • Inline: {iq.inline_count} • Lokal:{' '}
                          {iq.local_count}
                        </span>
                      </div>
                      {iq.issues && iq.issues.length > 0 && (
                        <ul className="list-disc pl-5 text-zinc-700 space-y-1">
                          {iq.issues.map((iss, idx) => (
                            <li key={idx}>{iss.message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {qr?.hard_failures && qr.hard_failures.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
                      <h5 className="font-bold text-rose-800 flex items-center gap-1.5">
                        <XCircle size={14} /> Pelanggaran Keras (Memblokir Publikasi)
                      </h5>
                      <ul className="list-disc pl-5 text-rose-700 space-y-1">
                        {qr.hard_failures.map((f, i) => (
                          <li key={i}>{f.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {qr?.score_failures && qr.score_failures.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                      <h5 className="font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Skor di Bawah Ambang Quality Gate
                      </h5>
                      <ul className="list-disc pl-5 text-amber-700 space-y-1">
                        {qr.score_failures.map((f, i) => (
                          <li key={i}>{f.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {qr?.warnings && qr.warnings.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1.5">
                      <h5 className="font-bold text-blue-800">Peringatan Editorial</h5>
                      <ul className="list-disc pl-5 text-blue-700 space-y-1">
                        {qr.warnings.map((w, i) => (
                          <li key={i}>{w.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {qr?.checks && qr.checks.length > 0 && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                      {qr.checks.map((c, idx) => (
                        <div key={idx} className="p-2.5 flex items-start justify-between gap-3">
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.label}</span>
                            <p className="text-[11px] text-zinc-500">{c.detail}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.status === 'pass'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.status === 'warn'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reject / Regenerate Footer */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Catatan penolakan atau revisi (opsional)..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                  />
                  <button
                    onClick={handleReject}
                    disabled={Boolean(busyAction)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Tolak
                  </button>
                </div>

                <button
                  onClick={handleRegenerate}
                  disabled={Boolean(busyAction)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw size={12} /> Generate Ulang Topik Ini
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stock Search Picker Modal */}
      <StockImagePickerModal
        isOpen={Boolean(stockPickerSlot)}
        initialQuery={stockPickerSlot?.query || ''}
        roleLabel={
          stockPickerSlot?.role === 'featured'
            ? 'Featured Image'
            : `Gambar Inline: ${stockPickerSlot?.sectionHeading || 'Bagian Artikel'}`
        }
        initialAlt={stockPickerSlot?.altText || ''}
        initialCaption={stockPickerSlot?.caption || ''}
        excludeUrls={selectedImages.map((img) => img.original_url).filter(Boolean)}
        onClose={() => setStockPickerSlot(null)}
        onSelectCandidate={handleReplaceFromStock}
      />

      {/* Existing 1sLabs Media Library Modal Reuse */}
      <MediaLibraryModal
        isOpen={Boolean(mediaModalSlot)}
        mode={mediaModalSlot?.role === 'inline' ? 'inline' : 'featured'}
        articleTitle={detail?.draft_title || detail?.topic || ''}
        focusKeyphrase={detail?.draft_focus_keyphrase || detail?.target_keyword || ''}
        onClose={() => setMediaModalSlot(null)}
        onSelectFeatured={(url, alt) => handleReplaceFromMediaLibrary(url, alt)}
        onInsertInline={() => {}}
        onSelectStructuredImage={(img) => handleReplaceFromMediaLibrary(img.url, img.alt, img.caption)}
      />
    </div>
  );
};
