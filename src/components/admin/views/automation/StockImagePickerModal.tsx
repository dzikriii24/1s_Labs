import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, Search, X } from 'lucide-react';
import {
  StockImageCandidate,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import notify from '../../../../lib/notify';

interface StockImagePickerModalProps {
  isOpen: boolean;
  initialQuery?: string;
  roleLabel: string;
  excludeUrls?: string[];
  onClose: () => void;
  onSelectCandidate: (candidate: StockImageCandidate, altText: string, caption: string) => Promise<void>;
  initialAlt?: string;
  initialCaption?: string;
}

export const StockImagePickerModal: React.FC<StockImagePickerModalProps> = ({
  isOpen,
  initialQuery = '',
  roleLabel,
  excludeUrls = [],
  onClose,
  onSelectCandidate,
  initialAlt = '',
  initialCaption = ''
}) => {
  const [queryText, setQueryText] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<StockImageCandidate[]>([]);
  const [selected, setSelected] = useState<StockImageCandidate | null>(null);
  const [altText, setAltText] = useState(initialAlt);
  const [caption, setCaption] = useState(initialCaption);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQueryText(initialQuery);
    setAltText(initialAlt);
    setCaption(initialCaption);
    setSelected(null);
    setCandidates([]);
  }, [isOpen, initialQuery, initialAlt, initialCaption]);

  if (!isOpen) return null;

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = queryText.trim();
    if (q.length < 2) {
      notify.warning('Masukkan kata kunci visual minimal 2 karakter (disarankan Bahasa Inggris).');
      return;
    }
    setSearching(true);
    try {
      const res = await contentAutomationApi.searchStockImages({
        query: q,
        exclude_urls: excludeUrls,
        per_provider: 6
      });
      setCandidates(res.candidates || []);
      if (!res.candidates || res.candidates.length === 0) {
        notify.toast('Tidak ditemukan kandidat gambar dari provider aktif; coba kata kunci lebih umum.');
      }
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      await onSelectCandidate(selected, altText.trim(), caption.trim());
      onClose();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Cari &amp; Pilih Gambar Resmi ({roleLabel})</h3>
            <p className="text-[11px] text-zinc-500">
              Sumber legal: Unsplash / Pexels / Pixabay (jika API key aktif) + Openverse &amp; Wikimedia Commons.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={runSearch} className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex gap-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Contoh: software engineer laptop modern office workspace"
            className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
          />
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Cari Stok Foto
          </button>
        </form>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {candidates.length === 0 ? (
              <div className="py-14 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                {searching ? 'Mencari gambar dari stock API legal...' : 'Tekan "Cari Stok Foto" untuk melihat kandidat resmi.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {candidates.map((cand) => {
                  const active = selected?.original_url === cand.original_url;
                  return (
                    <div
                      key={cand.original_url}
                      onClick={() => {
                        setSelected(cand);
                        if (!altText) setAltText(cand.alt || cand.title || '');
                      }}
                      className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        active
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={cand.thumb_url || cand.original_url}
                        alt={cand.title}
                        loading="lazy"
                        className="w-full h-28 object-cover bg-zinc-100"
                      />
                      {active && (
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                          <Check size={12} />
                        </span>
                      )}
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-semibold uppercase">
                        {cand.provider}
                      </span>
                      <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-[10px] space-y-0.5">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{cand.title}</p>
                        <p className="text-zinc-400 truncate">
                          {cand.width && cand.height ? `${cand.width}x${cand.height} • ` : ''}
                          {cand.license_name || 'Open License'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800 pt-3 lg:pt-0 lg:pl-4">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Metadata &amp; Penempatan</h4>
            {selected ? (
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-[11px]">
                <img
                  src={selected.thumb_url || selected.original_url}
                  alt={selected.title}
                  className="w-full h-28 object-cover rounded-lg bg-zinc-100"
                />
                <div className="text-zinc-700 dark:text-zinc-300 font-semibold line-clamp-2">{selected.title}</div>
                {selected.attribution_text && (
                  <div className="text-[10px] text-zinc-500">Kredit: {selected.attribution_text}</div>
                )}
                {selected.source_page_url && (
                  <a
                    href={selected.source_page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                  >
                    Halaman Sumber Resmi <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400">Klik salah satu foto di sebelah kiri untuk memilih.</p>
            )}

            <div>
              <label className="block text-[11px] font-semibold mb-1">Alt Text (SEO &amp; Aksesibilitas)</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Deskripsi visual relevan dalam Bahasa Indonesia..."
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Caption Gambar (Opsional)</label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Keterangan singkat di bawah gambar..."
                className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected || applying}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {applying ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Unduh, Optimasi WebP &amp; Pasang Gambar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

