import React from 'react';
import {
  AlignLeft,
  ArrowRight,
  Check,
  Expand,
  FileCheck2,
  Heading2,
  HelpCircle,
  Link2,
  Loader2,
  Minimize2,
  PenLine,
  Search,
  Sparkles,
  Tag,
  Type,
  Wand2,
  X
} from 'lucide-react';
import type { AiSeoAuditResult, FaqItem } from '../../../../../services/blogApi';
import type { SelectedAiPreview, SelectionRangeText } from './editorTypes';
import { sanitizeClientHtml } from './tiptapExtensions';

export interface AiTaskResultPayload {
  intro_html?: string;
  conclusion_html?: string;
  faq_html?: string;
  faqs?: FaqItem[];
  titles?: Array<{ title: string; char_count?: number; rationale?: string }>;
  descriptions?: Array<{ description: string; char_count?: number; rationale?: string }>;
  outline?: Array<{ tag?: string; heading: string; purpose?: string }>;
  headings?: Array<{ tag: string; text: string; rationale?: string }>;
  recommendations?: Array<{
    target_title: string;
    target_url: string;
    anchor_text: string;
    context_sentence?: string;
  }>;
  primary_keyphrase?: string;
  secondary_keyphrases?: string[];
  summary?: string;
  suggestions?: string[];
  original_text?: string;
  improved_html?: string;
  improved_text?: string;
  explanation?: string;
}

export interface AiTaskOutput {
  task: string;
  model?: string;
  latencyMs?: number;
  result: AiTaskResultPayload;
}

interface ArticleAIAssistantProps {
  open: boolean;
  selection: SelectionRangeText | null;
  selectedAiPreview: SelectedAiPreview | null;
  aiLoadingTask: string | null;
  lastAiOutput: AiTaskOutput | null;
  auditResult: AiSeoAuditResult | null;
  auditing: boolean;
  optimizingOneClick: boolean;
  onClose: () => void;
  onRunSelectionTask: (task: string) => void;
  onApplySelectedPreview: () => void;
  onDiscardSelectedPreview: () => void;
  onRunArticleTask: (task: string, extraContext?: string) => void;
  onRunAudit: () => void;
  onRunOneClickOptimize: () => void;
  onInsertHtmlTop: (html: string) => void;
  onInsertHtmlBottom: (html: string) => void;
  onInsertHtmlAtCursor: (html: string) => void;
  onApplyTitle: (title: string, target: 'main' | 'meta') => void;
  onApplyMetaDescription: (desc: string) => void;
  onApplyKeyphrases: (primary: string, secondary?: string[]) => void;
  onApplyFaqItems: (items: FaqItem[]) => void;
}

export const ArticleAIAssistant: React.FC<ArticleAIAssistantProps> = ({
  open,
  selection,
  selectedAiPreview,
  aiLoadingTask,
  lastAiOutput,
  auditResult,
  auditing,
  optimizingOneClick,
  onClose,
  onRunSelectionTask,
  onApplySelectedPreview,
  onDiscardSelectedPreview,
  onRunArticleTask,
  onRunAudit,
  onRunOneClickOptimize,
  onInsertHtmlTop,
  onInsertHtmlBottom,
  onInsertHtmlAtCursor,
  onApplyTitle,
  onApplyMetaDescription,
  onApplyKeyphrases,
  onApplyFaqItems
}) => {
  if (!open) return null;

  const hasSelection = Boolean(selection && selection.text.trim().length > 0);
  const headingSuggestions =
    lastAiOutput?.task === 'generate_heading_selection' && Array.isArray(lastAiOutput.result?.headings)
      ? (lastAiOutput.result.headings as Array<{ tag: string; text: string; rationale?: string }>)
      : null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(94vw,430px)] max-h-[82vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white dark:from-blue-950/50 dark:via-zinc-900 dark:to-zinc-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white inline-flex items-center justify-center shrink-0">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              AI Writing & SEO Assistant
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {aiLoadingTask
                ? `Gemini sedang memproses (${aiLoadingTask})...`
                : hasSelection
                  ? `${selection!.text.trim().length} karakter terpilih di editor`
                  : 'Blokir teks untuk edit paragraf, atau pakai aksi artikel'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          title="Tutup Asisten AI"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* Selected Text Comparison Preview */}
        {selectedAiPreview && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/25 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-blue-800 dark:text-blue-300 inline-flex items-center gap-1.5">
                <Sparkles size={13} /> Pratinjau Perubahan Teks Terpilih
              </span>
              <button
                type="button"
                onClick={onDiscardSelectedPreview}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
              >
                Buang
              </button>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Asli</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-4 whitespace-pre-wrap">
                  {selectedAiPreview.originalText}
                </p>
              </div>

              <div className="rounded-lg bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-800 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                  Versi Disempurnakan AI
                </p>
                <div
                  className="text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeClientHtml(
                      selectedAiPreview.improvedHtml || `<p>${selectedAiPreview.improvedText}</p>`
                    )
                  }}
                />
              </div>
            </div>

            {selectedAiPreview.explanation && (
              <p className="text-[11px] text-blue-800/90 dark:text-blue-200/80 leading-snug">
                {selectedAiPreview.explanation}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onDiscardSelectedPreview}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                Buang
              </button>
              <button
                type="button"
                onClick={onApplySelectedPreview}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                <Check size={13} /> Terapkan ke Pilihan
              </button>
            </div>
          </div>
        )}

        {/* Heading Suggestions for Selection */}
        {headingSuggestions && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/25 p-3 space-y-2">
            <p className="font-bold text-indigo-900 dark:text-indigo-200">Rekomendasi Subheading untuk Bagian Ini</p>
            <div className="space-y-1.5">
              {headingSuggestions.map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const tag = h.tag?.toLowerCase() === 'h3' ? 'h3' : 'h2';
                    onInsertHtmlAtCursor(`<${tag}>${h.text}</${tag}>`);
                  }}
                  className="w-full text-left rounded-lg border border-indigo-200/80 dark:border-indigo-800 bg-white dark:bg-zinc-900 p-2 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{h.text}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase">
                      {h.tag || 'H2'}
                    </span>
                  </div>
                  {h.rationale && <p className="text-[10px] text-zinc-500 mt-0.5">{h.rationale}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Paragraph Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
              Edit Teks Terpilih Saja
            </p>
            {!hasSelection && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Sorot paragraf di editor terlebih dahulu
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'improve_selection', label: 'Perbaiki Tulisan', Icon: Sparkles },
              { id: 'rewrite_selection', label: 'Tulis Ulang', Icon: PenLine },
              { id: 'expand_selection', label: 'Perpanjang', Icon: Expand },
              { id: 'summarize_selection', label: 'Ringkas', Icon: Minimize2 },
              { id: 'fix_grammar', label: 'Perbaiki Ejaan', Icon: FileCheck2 },
              { id: 'improve_readability_selection', label: 'Lebih Mudah Dibaca', Icon: AlignLeft },
              { id: 'generate_heading_selection', label: 'Buat Subheading', Icon: Heading2 }
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                disabled={!hasSelection || aiLoadingTask !== null}
                onClick={() => onRunSelectionTask(id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/40 text-left font-medium text-zinc-700 dark:text-zinc-200 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoadingTask === id ? (
                  <Loader2 size={12} className="animate-spin text-blue-600 shrink-0" />
                ) : (
                  <Icon size={12} className="text-blue-600 shrink-0" />
                )}
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Whole Article Co-Writer Actions */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
            Generator & Optimasi Artikel
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'intro', label: 'Buat Paragraf Intro', Icon: Type },
              { id: 'conclusion', label: 'Buat Penutup (CTA)', Icon: AlignLeft },
              { id: 'headings', label: 'Outline H2 / H3', Icon: Heading2 },
              { id: 'faq', label: 'Generate FAQ GEO', Icon: HelpCircle },
              { id: 'titles', label: '5 Ide Judul SEO', Icon: Sparkles },
              { id: 'descriptions', label: 'Meta Description', Icon: Search },
              { id: 'internal_links', label: 'Saran Internal Link', Icon: Link2 },
              { id: 'keyphrases', label: 'Riset Keyphrase', Icon: Tag }
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                disabled={aiLoadingTask !== null}
                onClick={() => onRunArticleTask(id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/40 text-left font-medium text-zinc-700 dark:text-zinc-200 disabled:opacity-50 transition-colors"
              >
                {aiLoadingTask === id ? (
                  <Loader2 size={12} className="animate-spin text-blue-600 shrink-0" />
                ) : (
                  <Icon size={12} className="text-blue-600 shrink-0" />
                )}
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={auditing}
              onClick={onRunAudit}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 disabled:opacity-50"
            >
              {auditing ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Audit Mendalam
            </button>
            <button
              type="button"
              disabled={optimizingOneClick}
              onClick={onRunOneClickOptimize}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {optimizingOneClick ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              1-Klik Optimasi
            </button>
          </div>
        </div>

        {/* Last Whole-Article AI Output */}
        {lastAiOutput && !headingSuggestions && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                Hasil AI: {lastAiOutput.task}
              </span>
              {lastAiOutput.latencyMs && (
                <span className="text-zinc-400">{(lastAiOutput.latencyMs / 1000).toFixed(1)}s</span>
              )}
            </div>

            {lastAiOutput.task === 'intro' && lastAiOutput.result.intro_html && (
              <div className="space-y-2">
                <div
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 text-zinc-800 dark:text-zinc-200 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(lastAiOutput.result.intro_html) }}
                />
                <button
                  type="button"
                  onClick={() => onInsertHtmlTop(lastAiOutput.result.intro_html || '')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  <ArrowRight size={12} /> Sisipkan di Awal Artikel
                </button>
              </div>
            )}

            {lastAiOutput.task === 'conclusion' && lastAiOutput.result.conclusion_html && (
              <div className="space-y-2">
                <div
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 text-zinc-800 dark:text-zinc-200 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(lastAiOutput.result.conclusion_html) }}
                />
                <button
                  type="button"
                  onClick={() => onInsertHtmlBottom(lastAiOutput.result.conclusion_html || '')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  <ArrowRight size={12} /> Sisipkan di Akhir Artikel
                </button>
              </div>
            )}

            {lastAiOutput.task === 'titles' && Array.isArray(lastAiOutput.result.titles) && (
              <div className="space-y-1.5">
                {lastAiOutput.result.titles.map((item: { title: string; char_count?: number; rationale?: string }, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    {item.rationale && <p className="text-[10px] text-zinc-500">{item.rationale}</p>}
                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onApplyTitle(item.title, 'main')}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Pakai sbg Judul Utama
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyTitle(item.title, 'meta')}
                        className="text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        Pakai sbg SEO Title
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lastAiOutput.task === 'descriptions' && Array.isArray(lastAiOutput.result.descriptions) && (
              <div className="space-y-1.5">
                {lastAiOutput.result.descriptions.map(
                  (item: { description: string; rationale?: string }, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
                    >
                      <p className="text-zinc-800 dark:text-zinc-200">{item.description}</p>
                      <button
                        type="button"
                        onClick={() => onApplyMetaDescription(item.description)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Terapkan ke Meta Description ({item.description.length} kar)
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {lastAiOutput.task === 'headings' && Array.isArray(lastAiOutput.result.outline) && (
              <div className="space-y-1.5">
                {lastAiOutput.result.outline.map(
                  (h: { tag?: string; heading: string; purpose?: string }, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const tag = h.tag?.toLowerCase() === 'h3' ? 'h3' : 'h2';
                        onInsertHtmlAtCursor(`<${tag}>${h.heading}</${tag}><p></p>`);
                      }}
                      className="w-full text-left rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 hover:border-blue-400"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{h.heading}</span>
                        <span className="text-[10px] font-bold uppercase text-blue-600">{h.tag || 'H2'}</span>
                      </div>
                      {h.purpose && <p className="text-[10px] text-zinc-500 mt-0.5">{h.purpose}</p>}
                    </button>
                  )
                )}
              </div>
            )}

            {lastAiOutput.task === 'faq' && Array.isArray(lastAiOutput.result.faqs) && (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  {lastAiOutput.result.faqs.length} item FAQ siap ditambahkan ke Schema GEO artikel.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onApplyFaqItems(lastAiOutput.result.faqs || [])}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                  >
                    Simpan ke FAQ Schema
                  </button>
                  {lastAiOutput.result.faq_html && (
                    <button
                      type="button"
                      onClick={() => onInsertHtmlBottom(lastAiOutput.result.faq_html || '')}
                      className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-700 font-semibold"
                    >
                      + Sisipkan ke Konten
                    </button>
                  )}
                </div>
              </div>
            )}

            {lastAiOutput.task === 'internal_links' && Array.isArray(lastAiOutput.result.recommendations) && (
              <div className="space-y-1.5">
                {lastAiOutput.result.recommendations.map(
                  (rec: { target_title: string; target_url: string; anchor_text: string; context_sentence?: string }, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rec.target_title}</p>
                      <p className="text-[10px] text-zinc-500">
                        Anchor: <strong>{rec.anchor_text}</strong> → <code>{rec.target_url}</code>
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onInsertHtmlAtCursor(
                            rec.context_sentence
                              ? `<p>${rec.context_sentence} <a href="${rec.target_url}">${rec.anchor_text}</a>.</p>`
                              : `<p>Pelajari juga <a href="${rec.target_url}">${rec.anchor_text}</a>.</p>`
                          )
                        }
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Sisipkan Link di Posisi Kursor
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {lastAiOutput.task === 'keyphrases' && lastAiOutput.result.primary_keyphrase && (
              <div className="space-y-2">
                <p>
                  <strong>Primary:</strong> {lastAiOutput.result.primary_keyphrase}
                </p>
                {Array.isArray(lastAiOutput.result.secondary_keyphrases) && (
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    <strong>Secondary:</strong> {lastAiOutput.result.secondary_keyphrases.join(', ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onApplyKeyphrases(
                      lastAiOutput.result.primary_keyphrase || '',
                      lastAiOutput.result.secondary_keyphrases
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Terapkan Keyphrases
                </button>
              </div>
            )}

            {lastAiOutput.task === 'readability' && (
              <div className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                {lastAiOutput.result.summary && <p>{lastAiOutput.result.summary}</p>}
                {Array.isArray(lastAiOutput.result.suggestions) && (
                  <ul className="list-disc pl-4 space-y-1">
                    {lastAiOutput.result.suggestions.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deep SEO + GEO Audit Result */}
        {auditResult && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2">
            <p className="font-bold text-emerald-900 dark:text-emerald-200">
              Ringkasan Audit AI (Skor Komposit {auditResult.deterministic?.composite_score ?? 0})
            </p>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {auditResult.audit.summary}
            </p>
            {auditResult.audit.prioritized_actions?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {auditResult.audit.prioritized_actions.slice(0, 4).map((act, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200/70 dark:border-emerald-900 p-2"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      [{act.priority?.toUpperCase()}] {act.area}: {act.issue}
                    </p>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">{act.fix}</p>
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
