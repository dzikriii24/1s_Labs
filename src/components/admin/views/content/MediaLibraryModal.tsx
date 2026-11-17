import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Check,
  Loader2,
  AlignCenter,
  AlignLeft,
  AlignRight
} from 'lucide-react';
import { blogApi, seoIntelligenceApi, type BlogMediaItem } from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';

interface MediaLibraryModalProps {
  isOpen: boolean;
  mode: 'featured' | 'inline';
  articleTitle?: string;
  focusKeyphrase?: string;
  onClose: () => void;
  onSelectFeatured: (url: string, altText?: string) => void;
  onInsertInline: (htmlSnippet: string) => void;
  onSelectStructuredImage?: (image: {
    url: string;
    alt: string;
    caption: string;
    align: 'left' | 'center' | 'right';
    width: '100%' | '75%' | '50%';
  }) => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  mode,
  articleTitle = '',
  focusKeyphrase = '',
  onClose,
  onSelectFeatured,
  onInsertInline,
  onSelectStructuredImage
}) => {
  const [media, setMedia] = useState<BlogMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center');
  const [widthPct, setWidthPct] = useState<'100%' | '75%' | '50%'>('100%');
  const [generatingAlt, setGeneratingAlt] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await blogApi.getMediaLibrary();
      setMedia(res.media || []);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat Media Library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl('');
      setAltText('');
      setCaption('');
      loadMedia();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify.warning('Ukuran file melebihi batas maksimal 5MB.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await blogApi.uploadImage(file);
      notify.toast('Gambar berhasil diunggah.');
      await loadMedia();
      setSelectedUrl(uploaded.url);
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    const ok = await notify.confirm({
      title: 'Hapus Gambar dari Server?',
      text: `File "${filename}" akan dihapus permanen. Pastikan tidak sedang dipakai di artikel aktif.`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;
    try {
      await blogApi.deleteMedia(filename);
      if (selectedUrl.endsWith(filename)) setSelectedUrl('');
      loadMedia();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus file gambar.');
    }
  };

  const handleGenerateAlt = async () => {
    setGeneratingAlt(true);
    try {
      const res = await seoIntelligenceApi.aiAssist(
        'alt_text',
        { title: articleTitle, focus_keyphrase: focusKeyphrase, featured_image: selectedUrl },
        caption || selectedUrl
      );
      if (res.result?.alt_text) {
        setAltText(res.result.alt_text);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal membuat Alt Text otomatis.');
    } finally {
      setGeneratingAlt(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedUrl) {
      notify.warning('Pilih atau unggah gambar terlebih dahulu.');
      return;
    }
    if (mode === 'featured') {
      onSelectFeatured(selectedUrl, altText.trim() || undefined);
      onClose();
      return;
    }

    const alignStyle =
      align === 'center'
        ? 'margin: 1.5rem auto; text-align: center;'
        : align === 'left'
          ? 'margin: 1.5rem auto 1.5rem 0; text-align: left;'
          : 'margin: 1.5rem 0 1.5rem auto; text-align: right;';
    const safeAlt = (altText || caption || articleTitle || 'Ilustrasi artikel 1sLabs').replace(/"/g, '&quot;');
    if (onSelectStructuredImage) {
      onSelectStructuredImage({
        url: selectedUrl,
        alt: altText.trim() || caption.trim() || articleTitle || 'Ilustrasi artikel 1sLabs',
        caption: caption.trim(),
        align,
        width: widthPct
      });
      onClose();
      return;
    }

    const html = `<figure style="max-width: ${widthPct}; ${alignStyle}">
  <img src="${selectedUrl}" alt="${safeAlt}" style="width: 100%; height: auto; border-radius: 12px;" loading="lazy" />
  ${caption.trim() ? `<figcaption style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">${caption.trim()}</figcaption>` : ''}
</figure><p></p>`;

    onInsertInline(html);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon size={18} className="text-blue-600" />
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                {mode === 'featured' ? 'Pilih Featured Image' : 'Sisipkan Gambar ke Isi Artikel'}
              </h3>
              <p className="text-xs text-zinc-500">Upload file JPG/PNG/WebP/SVG maks 5MB atau pilih dari galeri media 1sLabs</p>
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

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Gallery */}
          <div className="lg:col-span-2 space-y-4">
            <label className="flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 cursor-pointer transition-colors">
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Mengunggah gambar ke server...</span>
                </>
              ) : (
                <>
                  <Upload size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Klik untuk Unggah Gambar Baru (Maks 5MB)
                  </span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>

            {loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">Memuat galeri media...</div>
            ) : media.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                Belum ada gambar di Media Library. Unggah gambar pertama Anda di atas.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((item) => {
                  const isSelected = selectedUrl === item.url;
                  const isArticleAsset = item.folder === 'articles';
                  return (
                    <div
                      key={item.url}
                      onClick={() => {
                        setSelectedUrl(item.url);
                        if (!altText && item.alt_text) setAltText(item.alt_text);
                        if (!caption && item.caption) setCaption(item.caption);
                      }}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                      }`}
                    >
                      <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-28 object-cover bg-zinc-100" />
                      {isSelected && (
                        <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                          <Check size={13} />
                        </span>
                      )}
                      {isArticleAsset && (
                        <span className="absolute bottom-14 left-2 px-1.5 py-0.5 rounded bg-zinc-900/75 text-white text-[9px] font-semibold">
                          {item.provider ? item.provider : 'Artikel AI'}
                        </span>
                      )}
                      {!isArticleAsset && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.filename); }}
                          title="Hapus permanen"
                          className="absolute top-2 right-2 p-1 rounded-md bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <div className="px-2 py-1.5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{item.filename}</p>
                        <p className="text-[10px] text-zinc-400">{Math.round(item.size / 1024)} KB</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Options Panel */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 h-fit">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Pengaturan Gambar</h4>

            {selectedUrl ? (
              <img src={selectedUrl} alt="Preview" className="w-full h-36 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700" />
            ) : (
              <div className="w-full h-36 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                Belum ada gambar dipilih
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Alt Text (Aksesibilitas &amp; SEO)</label>
                <button
                  type="button"
                  onClick={handleGenerateAlt}
                  disabled={generatingAlt || !selectedUrl}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40"
                >
                  <Sparkles size={11} className={generatingAlt ? 'animate-spin' : ''} />
                  {generatingAlt ? 'Menulis...' : 'AI Alt Text'}
                </button>
              </div>
              <textarea
                rows={2}
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Jelaskan isi visual gambar secara singkat..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
              />
            </div>

            {mode === 'inline' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Caption (Opsional)</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Keterangan di bawah gambar..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Lebar</label>
                    <select
                      value={widthPct}
                      onChange={(e) => setWidthPct(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                    >
                      <option value="100%">Penuh (100%)</option>
                      <option value="75%">Sedang (75%)</option>
                      <option value="50%">Setengah (50%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Perataan</label>
                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setAlign(pos)}
                          className={`flex-1 py-1.5 rounded-lg border flex justify-center ${
                            align === pos
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600'
                          }`}
                        >
                          {pos === 'left' ? <AlignLeft size={14} /> : pos === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedUrl}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40"
            >
              {mode === 'featured' ? 'Gunakan sebagai Featured Image' : 'Sisipkan ke Artikel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

