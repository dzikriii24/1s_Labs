import React from 'react';
import { Check, CheckSquare, Compass, Save, Square, X } from 'lucide-react';
import { ContentPillar } from '../../../../services/contentAutomationApi';

interface MultiPillarSelectorProps {
  pillars: ContentPillar[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  onSaveDefault?: (codes: string[]) => void;
  savingDefault?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  emptyHint?: string;
  publishedCounts?: Record<string, number>;
}

export const MultiPillarSelector: React.FC<MultiPillarSelectorProps> = ({
  pillars,
  selectedCodes,
  onChange,
  onSaveDefault,
  savingDefault = false,
  title = 'Pilih Content Pillar Layanan 1sLabs',
  subtitle = 'Pilih satu, beberapa, atau seluruh pilar. AI mendistribusikan topik secara seimbang ke pilar aktif.',
  compact = false,
  emptyHint = 'Belum ada pilar dipilih (sistem akan otomatis memakai seluruh pilar aktif).',
  publishedCounts
}) => {
  const activePillars = pillars.filter((p) => Boolean(p.is_active));
  const selectedSet = new Set(selectedCodes);

  const toggleCode = (code: string) => {
    if (selectedSet.has(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
  };

  const handleSelectAll = () => {
    onChange(activePillars.map((p) => p.code));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{title}</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {selectedCodes.length} / {activePillars.length} terpilih
            </span>
          </div>
          {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold cursor-pointer transition-colors"
          >
            <CheckSquare size={12} /> Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer transition-colors"
          >
            <Square size={12} /> Clear All
          </button>
          {onSaveDefault && (
            <button
              type="button"
              disabled={savingDefault}
              onClick={() => onSaveDefault(selectedCodes)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Save size={12} /> {savingDefault ? 'Menyimpan...' : 'Simpan Pilihan'}
            </button>
          )}
        </div>
      </div>

      {/* Selected Chips Summary */}
      {selectedCodes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedCodes.map((code) => {
            const pil = pillars.find((p) => p.code === code);
            if (!pil) return null;
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-600 text-white"
              >
                {pil.name}
                <button
                  type="button"
                  onClick={() => toggleCode(code)}
                  className="hover:bg-blue-700 rounded-full p-0.5 cursor-pointer"
                  aria-label={`Hapus ${pil.name}`}
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
          {emptyHint}
        </div>
      )}

      {/* Multi-Select Grid */}
      <div
        className={`grid gap-2.5 ${
          compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {activePillars.map((p) => {
          const isSelected = selectedSet.has(p.code);
          const pubCount = publishedCounts?.[p.code] ?? p.published_articles ?? 0;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => toggleCode(p.code)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-300'
              }`}
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                }`}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white leading-snug">{p.name}</span>
                  <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {pubCount} terbit
                  </span>
                </div>
                {p.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
                {!compact && (
                  <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400 pt-0.5">
                    <span className="inline-flex items-center gap-1 font-mono truncate">
                      <Compass size={10} /> {p.primary_cta_path}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="capitalize text-zinc-500">{p.default_intent}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

