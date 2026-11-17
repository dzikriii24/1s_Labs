import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Globe,
  HelpCircle,
  Loader2,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2
} from 'lucide-react';
import type { FaqItem, SeoAnalysisResult } from '../../../../../services/blogApi';
import { CheckStatusIcon, getScoreTier } from '../blogUiUtils';
import type { EditorFormState } from './editorTypes';

interface ArticleSEOPanelProps {
  form: EditorFormState;
  seo: SeoAnalysisResult;
  analyzing: boolean;
  aiLoadingTask: string | null;
  optimizingOneClick: boolean;
  onUpdateField: <K extends keyof EditorFormState>(field: K, value: EditorFormState[K]) => void;
  onRunAiTask: (task: string, extraContext?: string) => void;
  onRunOneClickOptimize: () => void;
}

export const ArticleSEOPanel: React.FC<ArticleSEOPanelProps> = ({
  form,
  seo,
  analyzing,
  aiLoadingTask,
  optimizingOneClick,
  onUpdateField,
  onRunAiTask,
  onRunOneClickOptimize
}) => {
  const [serpMode, setSerpMode] = useState<'desktop' | 'mobile'>('desktop');
  const [checkFilter, setCheckFilter] = useState<'all' | 'seo' | 'readability' | 'geo'>('all');
  const [openSections, setOpenSections] = useState<{
    serp: boolean;
    keywords: boolean;
    checks: boolean;
    faq: boolean;
  }>({
    serp: true,
    keywords: true,
    checks: true,
    faq: false
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const seoTier = getScoreTier(seo.seo_score);
  const readabilityTier = getScoreTier(seo.readability_score);
  const geoTier = getScoreTier(seo.geo_score);

  const effectiveMetaTitle = (form.meta_title || form.title || 'Judul Artikel 1sLabs').trim();
  const effectiveMetaDesc = (
    form.meta_description ||
    form.excerpt ||
    'Deskripsi meta artikel akan tampil di hasil pencarian Google dan pratinjau AI.'
  ).trim();
  const effectiveSlug = (form.slug || 'slug-artikel').trim();

  const metaTitleLen = effectiveMetaTitle.length;
  const metaDescLen = effectiveMetaDesc.length;
  const titleBarPct = Math.min(100, Math.round((metaTitleLen / 65) * 100));
  const descBarPct = Math.min(100, Math.round((metaDescLen / 165) * 100));

  const filteredChecks = useMemo(() => {
    const items = checkFilter === 'all' ? seo.checks : seo.checks.filter((c) => c.category === checkFilter);
    const weight: Record<string, number> = { problem: 0, warning: 1, good: 2 };
    return [...items].sort((a, b) => (weight[a.status] ?? 2) - (weight[b.status] ?? 2));
  }, [seo.checks, checkFilter]);

  const issueCounts = useMemo(() => {
    let problems = 0;
    let warnings = 0;
    let goods = 0;
    for (const c of seo.checks) {
      if (c.status === 'problem') problems += 1;
      else if (c.status === 'warning') warnings += 1;
      else goods += 1;
    }
    return { problems, warnings, goods };
  }, [seo.checks]);

  const handleFaqChange = (index: number, key: keyof FaqItem, val: string) => {
    const next = [...form.faq_items];
    next[index] = { ...next[index], [key]: val };
    onUpdateField('faq_items', next);
  };

  const handleAddFaq = () => {
    onUpdateField('faq_items', [...form.faq_items, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    onUpdateField(
      'faq_items',
      form.faq_items.filter((_, idx) => idx !== index)
    );
  };

  const mapCheckActionToTask = (actionType?: string | null): string | null => {
    if (!actionType) return null;
    if (actionType === 'titles' || actionType === 'meta_title') return 'titles';
    if (actionType === 'descriptions' || actionType === 'meta_description') return 'descriptions';
    if (actionType === 'faq') return 'faq';
    if (actionType === 'internal_links') return 'internal_links';
    if (actionType === 'keyphrases') return 'keyphrases';
    if (actionType === 'headings') return 'headings';
    if (actionType === 'intro') return 'intro';
    if (actionType === 'readability') return 'readability';
    return null;
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 3-Meter Score Dashboard */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Search size={13} className="text-blue-600" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Skor SEO & GEO Live</span>
          </div>
          {analyzing ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
              <Loader2 size={11} className="animate-spin" /> Menganalisis...
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">
              {seo.metrics.word_count} kata · {seo.metrics.reading_time} mnt
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'SEO', score: seo.seo_score, tier: seoTier },
            { label: 'Readability', score: seo.readability_score, tier: readabilityTier },
            { label: 'GEO Ready', score: seo.geo_score, tier: geoTier }
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2 text-center"
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${item.tier.bar}`} />
                <span className={`text-base font-extrabold tabular-nums ${item.tier.text}`}>
                  {item.score}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Summary pills + Intent */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold">
              {issueCounts.problems} Kritis
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-semibold">
              {issueCounts.warnings} Saran
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold">
              {issueCounts.goods} Lolos
            </span>
          </div>
          {seo.metrics.detected_intent && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold uppercase tracking-wide text-[10px]">
              {seo.metrics.detected_intent}
            </span>
          )}
        </div>

        {/* One-Click Optimize CTA */}
        <button
          type="button"
          disabled={optimizingOneClick}
          onClick={onRunOneClickOptimize}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold text-xs shadow-sm transition-all"
        >
          {optimizingOneClick ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Wand2 size={14} />
          )}
          {optimizingOneClick ? 'Mengoptimasi SEO & GEO...' : '1-Klik Optimasi SEO + GEO (AI)'}
        </button>
      </div>

      {/* Keywords & Search Snippet */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('keywords')}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <span>Keyphrase & Metadata SERP</span>
          {openSections.keywords ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSections.keywords && (
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Focus Keyphrase</label>
                <button
                  type="button"
                  disabled={aiLoadingTask !== null}
                  onClick={() => onRunAiTask('keyphrases')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {aiLoadingTask === 'keyphrases' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Riset AI
                </button>
              </div>
              <input
                type="text"
                value={form.focus_keyphrase}
                onChange={(e) => onUpdateField('focus_keyphrase', e.target.value)}
                placeholder="Contoh: jasa website enterprise jakarta"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {form.focus_keyphrase.trim() && (
                <p className="text-[10px] text-zinc-500 mt-1">
                  Kepadatan: <strong>{seo.metrics.keyphrase_density}%</strong> ({seo.metrics.keyphrase_count}x muncul)
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Secondary Keyphrases (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.secondary_keyphrases}
                onChange={(e) => onUpdateField('secondary_keyphrases', e.target.value)}
                placeholder="software house, web app b2b, transformasi digital"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* SEO Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  SEO Title ({metaTitleLen}/60)
                </label>
                <button
                  type="button"
                  disabled={aiLoadingTask !== null}
                  onClick={() => onRunAiTask('titles')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {aiLoadingTask === 'titles' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Saran Judul
                </button>
              </div>
              <input
                type="text"
                value={form.meta_title}
                onChange={(e) => onUpdateField('meta_title', e.target.value)}
                placeholder="Kosongkan untuk mengikuti judul utama..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    metaTitleLen >= 45 && metaTitleLen <= 62
                      ? 'bg-emerald-500'
                      : metaTitleLen > 65
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${titleBarPct}%` }}
                />
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Meta Description ({metaDescLen}/160)
                </label>
                <button
                  type="button"
                  disabled={aiLoadingTask !== null}
                  onClick={() => onRunAiTask('descriptions')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {aiLoadingTask === 'descriptions' ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  Buat Meta AI
                </button>
              </div>
              <textarea
                rows={3}
                value={form.meta_description}
                onChange={(e) => onUpdateField('meta_description', e.target.value)}
                placeholder="Ringkasan menarik 140-160 karakter untuk hasil pencarian Google..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    metaDescLen >= 120 && metaDescLen <= 160
                      ? 'bg-emerald-500'
                      : metaDescLen > 165
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${descBarPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google SERP Preview */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleSection('serp')}
            className="inline-flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100"
          >
            {openSections.serp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Pratinjau Google SERP</span>
          </button>
          <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setSerpMode('desktop')}
              title="Desktop SERP"
              className={`p-1 rounded ${serpMode === 'desktop' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-zinc-500'}`}
            >
              <Monitor size={12} />
            </button>
            <button
              type="button"
              onClick={() => setSerpMode('mobile')}
              title="Mobile SERP"
              className={`p-1 rounded ${serpMode === 'mobile' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-zinc-500'}`}
            >
              <Smartphone size={12} />
            </button>
          </div>
        </div>

        {openSections.serp && (
          <div className="px-3 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <div
              className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 ${
                serpMode === 'mobile' ? 'max-w-[290px]' : ''
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-bold">
                  1s
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 leading-tight">1sLabs</div>
                  <div className="truncate text-[10px] text-zinc-500 flex items-center gap-1">
                    <Globe size={9} /> 1slabs.my.id › blog › {effectiveSlug}
                  </div>
                </div>
              </div>
              <p className="text-[14px] font-medium text-blue-700 dark:text-blue-400 leading-snug line-clamp-2">
                {effectiveMetaTitle}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                {effectiveMetaDesc}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Checklist & Recommendations */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('checks')}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <span>Daftar Pemeriksaan ({seo.checks.length})</span>
          {openSections.checks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSections.checks && (
          <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-wrap gap-1 pt-1">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'seo', label: 'SEO' },
                  { id: 'readability', label: 'Keterbacaan' },
                  { id: 'geo', label: 'GEO AI' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCheckFilter(tab.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    checkFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
              {filteredChecks.map((check) => {
                const task = mapCheckActionToTask(check.action_type);
                return (
                  <div
                    key={check.id}
                    className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 p-2.5 flex items-start gap-2"
                  >
                    <div className="mt-0.5 shrink-0">
                      <CheckStatusIcon status={check.status} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {check.title}
                        </p>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {check.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {check.status === 'good' ? check.detail : check.recommendation || check.detail}
                      </p>
                      {check.status !== 'good' && task && (
                        <button
                          type="button"
                          disabled={aiLoadingTask !== null}
                          onClick={() => onRunAiTask(task)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          <Sparkles size={11} />
                          Perbaiki dengan AI
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Schema Builder */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('faq')}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <span className="inline-flex items-center gap-1.5">
            <HelpCircle size={13} className="text-blue-600" />
            FAQ Schema GEO ({form.faq_items.length})
          </span>
          {openSections.faq ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {openSections.faq && (
          <div className="px-3 pb-3 pt-2 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleAddFaq}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-semibold hover:bg-zinc-100"
              >
                <Plus size={12} /> Tambah FAQ
              </button>
              <button
                type="button"
                disabled={aiLoadingTask !== null}
                onClick={() => onRunAiTask('faq')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 disabled:opacity-50"
              >
                {aiLoadingTask === 'faq' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                Generate FAQ AI
              </button>
            </div>

            {form.faq_items.length === 0 ? (
              <p className="text-[11px] text-zinc-500 text-center py-3">
                Belum ada FAQ. FAQ JSON-LD meningkatkan peluang kutipan di AI Overview & Rich Results.
              </p>
            ) : (
              <div className="space-y-2">
                {form.faq_items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 p-2 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-zinc-500">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="p-0.5 text-rose-500 hover:text-rose-700"
                        title="Hapus FAQ"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                      placeholder="Pertanyaan..."
                      className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                      placeholder="Jawaban ringkas & akurat..."
                      className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
