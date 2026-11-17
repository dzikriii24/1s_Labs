import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  FileCode2
} from 'lucide-react';
import type { OneClickOptimizeResult, FaqItem } from '../../../../services/blogApi';

interface OneClickOptimizeModalProps {
  isOpen: boolean;
  result: OneClickOptimizeResult | null;
  onClose: () => void;
  onApply: (selectedPayload: {
    title?: string;
    meta_title?: string;
    meta_description?: string;
    focus_keyphrase?: string;
    excerpt?: string;
    featured_image_alt?: string;
    content?: string;
    faq_items?: FaqItem[];
  }) => void;
}

export const OneClickOptimizeModal: React.FC<OneClickOptimizeModalProps> = ({
  isOpen,
  result,
  onClose,
  onApply
}) => {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [applyContent, setApplyContent] = useState(true);
  const [applyFaq, setApplyFaq] = useState(true);
  const [previewTab, setPreviewTab] = useState<'rendered' | 'html'>('rendered');

  useEffect(() => {
    if (result) {
      const nextSel: Record<string, boolean> = {};
      const nextVal: Record<string, string> = {};
      for (const d of result.fieldDiffs) {
        nextSel[d.field] = d.changed || !d.before;
        nextVal[d.field] = d.after;
      }
      setSelectedFields(nextSel);
      setEditedValues(nextVal);
      setApplyContent(result.contentChanged);
      setApplyFaq((result.proposed.faq_items || []).length > 0);
    }
  }, [result]);

  if (!isOpen || !result) return null;

  const scoreDelta = (afterVal: number, beforeVal: number) => {
    const diff = afterVal - beforeVal;
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  const handleConfirmApply = () => {
    const payload: any = {};
    for (const d of result.fieldDiffs) {
      if (selectedFields[d.field]) {
        payload[d.field] = editedValues[d.field];
      }
    }
    if (applyContent) {
      payload.content = result.proposed.content;
    }
    if (applyFaq && result.proposed.faq_items?.length > 0) {
      payload.faq_items = result.proposed.faq_items;
    }
    onApply(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                Preview Hasil Optimasi SEO &amp; GEO AI 1-Klik
              </h3>
              <p className="text-xs text-zinc-500">
                Tinjau perbandingan skor, pilih atau sunting field yang ingin diterapkan. Revisi lama akan tersimpan otomatis untuk fitur Revert.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {result.guardWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Content Preservation Guard Aktif</p>
                <p>{result.guardWarning}</p>
              </div>
            </div>
          )}

          {/* Before / After Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              { label: 'SEO Score', before: result.before.seo_score, after: result.after.seo_score },
              { label: 'Readability', before: result.before.readability_score, after: result.after.readability_score },
              { label: 'GEO Readiness', before: result.before.geo_score, after: result.after.geo_score }
            ].map((item) => {
              const delta = item.after - item.before;
              return (
                <div key={item.label} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                  <div className="text-xs font-medium text-zinc-500">{item.label}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-lg font-semibold text-zinc-500">{item.before}</span>
                    <ArrowRight size={15} className="text-zinc-400" />
                    <span className="text-2xl font-bold text-blue-600">{item.after}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                      delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {scoreDelta(item.after, item.before)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metrics Row */}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-2.5">
            <span>Kata: <strong>{result.before.word_count} → {result.after.word_count}</strong></span>
            <span>·</span>
            <span>Heading H2: <strong>{result.before.h2_count} → {result.after.h2_count}</strong></span>
            <span>·</span>
            <span>Internal Links: <strong>{result.before.internal_links_count} → {result.after.internal_links_count}</strong></span>
            <span>·</span>
            <span>FAQ Items: <strong>{result.before.faq_count} → {result.after.faq_count}</strong></span>
            <span className="ml-auto text-zinc-400">Model: {result.model}</span>
          </div>

          {result.optimizationNotes.length > 0 && (
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5">
                <ShieldCheck size={14} className="text-blue-600" />
                Ringkasan Perbaikan AI
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                {result.optimizationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Field Diffs Editable */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Perbandingan &amp; Edit Metadata ({result.fieldDiffs.filter((f) => f.changed).length} berubah)
            </h4>
            {result.fieldDiffs.map((diff) => (
              <div key={diff.field} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 bg-white dark:bg-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedFields[diff.field])}
                      onChange={(e) => setSelectedFields((s) => ({ ...s, [diff.field]: e.target.checked }))}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    {diff.label}
                  </label>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    diff.changed ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {diff.changed ? 'Dioptimalkan' : 'Tetap'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border border-zinc-100 dark:border-zinc-800">
                    <div className="text-[10px] font-semibold uppercase mb-1 text-zinc-400">Sebelum</div>
                    {diff.before || <span className="italic text-zinc-400">(Kosong)</span>}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase mb-1 text-blue-600">Sesudah (dapat disunting)</div>
                    <textarea
                      rows={diff.field === 'meta_description' || diff.field === 'excerpt' ? 2 : 1}
                      value={editedValues[diff.field] ?? diff.after}
                      onChange={(e) => setEditedValues((v) => ({ ...v, [diff.field]: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content HTML Preview Toggle */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyContent}
                  onChange={(e) => setApplyContent(e.target.checked)}
                  className="rounded border-zinc-300 text-blue-600"
                />
                Terapkan Konten HTML yang Dioptimalkan
              </label>
              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setPreviewTab('rendered')}
                  className={`px-2.5 py-1 text-[11px] font-medium ${previewTab === 'rendered' ? 'bg-blue-600 text-white' : 'text-zinc-600'}`}
                >
                  Tampilan Artikel
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('html')}
                  className={`px-2.5 py-1 text-[11px] font-medium inline-flex items-center gap-1 ${previewTab === 'html' ? 'bg-blue-600 text-white' : 'text-zinc-600'}`}
                >
                  <FileCode2 size={12} /> HTML
                </button>
              </div>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900">
              {previewTab === 'rendered' ? (
                <div
                  className="oneslabs-blog-prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: result.proposed.content }}
                />
              ) : (
                <pre className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                  {result.proposed.content}
                </pre>
              )}
            </div>
          </div>

          {/* FAQ Preview */}
          {result.proposed.faq_items?.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFaq}
                  onChange={(e) => setApplyFaq(e.target.checked)}
                  className="rounded border-zinc-300 text-blue-600"
                />
                Tambahkan / Perbarui FAQ Terstruktur ({result.proposed.faq_items.length} item Schema FAQPage)
              </label>
              <div className="space-y-2">
                {result.proposed.faq_items.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                    <p className="font-semibold text-zinc-900 dark:text-white">{f.question}</p>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={handleConfirmApply}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
          >
            <Check size={16} />
            Terapkan ke Editor
          </button>
        </div>
      </div>
    </div>
  );
};

