import React, { useEffect, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, RefreshCw, Save, Server, ShieldCheck } from 'lucide-react';
import {
  ApprovalMode,
  AutomationSettings,
  EngineHealth,
  ImageProviderStatusMap,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import notify from '../../../../lib/notify';

interface AutomationSettingsPanelProps {
  settings: AutomationSettings | null;
  onUpdated: (s: AutomationSettings) => void;
}

export const AutomationSettingsPanel: React.FC<AutomationSettingsPanelProps> = ({ settings, onUpdated }) => {
  const [form, setForm] = useState<Partial<AutomationSettings>>({});
  const [saving, setSaving] = useState(false);
  const [testingEngine, setTestingEngine] = useState(false);
  const [health, setHealth] = useState<EngineHealth | null>(null);
  const [imgProviders, setImgProviders] = useState<ImageProviderStatusMap | null>(null);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    contentAutomationApi
      .getImageProviders()
      .then((res) => setImgProviders(res.providers))
      .catch(() => {});
  }, []);

  const handleTestEngine = async () => {
    setTestingEngine(true);
    try {
      const res = await contentAutomationApi.getEngineHealth(form.engine_url);
      setHealth(res.health);
      if (res.health.reachable) {
        notify.success(`Engine lokal merespons (${res.health.latency_ms} ms).`);
      } else {
        notify.error(res.health.error || 'Engine lokal tidak merespons.');
      }
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setTestingEngine(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await contentAutomationApi.updateSettings(form);
      onUpdated(res.settings);
      notify.success('Pengaturan AI Content Automation disimpan.');
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const approvalOptions: Array<{ mode: ApprovalMode; title: string; desc: string }> = [
    {
      mode: 'manual_approval',
      title: 'Manual Approval (Default & Direkomendasikan)',
      desc: 'Setiap artikel melewati Quality Gate lalu menunggu persetujuan admin sebelum diterbitkan ke blog.'
    },
    {
      mode: 'auto_publish_qualified',
      title: 'Auto Publish Jika Memenuhi Quality Gate',
      desc: 'Artikel yang lolos seluruh aturan fakta, struktur SEO/GEO, duplikasi, dan ambang skor langsung terbit. Item gagal tetap ditahan.'
    },
    {
      mode: 'always_save_draft',
      title: 'Always Save Draft',
      desc: 'Artikel yang aman dari pelanggaran keras disimpan ke blog_articles sebagai Draft untuk penyuntingan lanjutan di editor.'
    }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Approval Mode */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Approval & Publishing Mode</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {approvalOptions.map((opt) => {
            const active = form.approval_mode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setForm({ ...form, approval_mode: opt.mode })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{opt.title}</span>
                  {active && <CheckCircle2 size={15} className="text-blue-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Engine Connection */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-blue-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Koneksi Article Generator Lokal</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={form.engine_url || ''}
            onChange={(e) => setForm({ ...form, engine_url: e.target.value })}
            placeholder="http://127.0.0.1:8000"
            className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleTestEngine}
            disabled={testingEngine}
            className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={testingEngine ? 'animate-spin' : ''} /> Uji Koneksi Engine
          </button>
        </div>

        {health && (
          <p className={`text-xs ${health.reachable ? 'text-emerald-600' : 'text-rose-600'}`}>
            {health.reachable
              ? `Terhubung ke ${health.engine} v${health.version} (${health.latency_ms} ms)`
              : `Tidak terjangkau: ${health.error}`}
          </p>
        )}
      </div>

      {/* Quality Gate Thresholds & Quotas */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Quality Gate & Quota Controls</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'min_seo_score', label: 'Min SEO Score', min: 40, max: 98 },
            { key: 'min_readability_score', label: 'Min Readability Score', min: 40, max: 98 },
            { key: 'min_geo_score', label: 'Min GEO Score', min: 40, max: 98 },
            { key: 'min_composite_score', label: 'Min Composite Score', min: 40, max: 98 },
            { key: 'min_word_count', label: 'Min Kata Publikasi', min: 300, max: 2000 },
            { key: 'default_word_count', label: 'Target Kata Default', min: 500, max: 3500 },
            { key: 'daily_generation_limit', label: 'Batas Harian Artikel', min: 1, max: 200 },
            { key: 'max_batch_size', label: 'Maks Batch Sekaligus', min: 1, max: 50 }
          ].map((field) => {
            const k = field.key as keyof AutomationSettings;
            return (
              <div key={field.key}>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={Number(form[k] ?? '')}
                  onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Batas Kemiripan Maks (0.30 - 0.95)
            </label>
            <input
              type="number"
              step="0.02"
              min="0.3"
              max="0.95"
              value={form.max_similarity_threshold ?? 0.72}
              onChange={(e) => setForm({ ...form, max_similarity_threshold: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Maks Auto-Regenerasi (0 - 2)
            </label>
            <input
              type="number"
              min={0}
              max={2}
              value={form.max_auto_regenerations ?? 1}
              onChange={(e) => setForm({ ...form, max_auto_regenerations: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.auto_optimize_below_threshold ?? true)}
              onChange={(e) => setForm({ ...form, auto_optimize_below_threshold: e.target.checked })}
              className="rounded border-zinc-300 text-blue-600"
            />
            AI Auto-Optimize Jika Skor &lt; Threshold
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.auto_internal_linking)}
              onChange={(e) => setForm({ ...form, auto_internal_linking: e.target.checked })}
              className="rounded border-zinc-300 text-blue-600"
            />
            Sisipkan Internal Link Otomatis
          </label>

          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.auto_web_research)}
              onChange={(e) => setForm({ ...form, auto_web_research: e.target.checked })}
              className="rounded border-zinc-300 text-blue-600"
            />
            Aktifkan Web Research Default
          </label>
        </div>

        {Array.isArray(form.selected_pillars) && form.selected_pillars.length > 0 && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="block text-[11px] font-semibold text-zinc-500 mb-1.5">
              Content Pillar Default Tersimpan (dapat diubah di Automation Center):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {form.selected_pillars.map((code) => (
                <span
                  key={code}
                  className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Automated Visual & Stock Image Discovery */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-600" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              AI Image Discovery &amp; Visual Content Management
            </h3>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.enable_auto_images ?? true)}
              onChange={(e) => setForm({ ...form, enable_auto_images: e.target.checked })}
              className="rounded border-zinc-300 text-blue-600"
            />
            Otomatis Cari &amp; Pasang Gambar Artikel
          </label>
        </div>

        {imgProviders && (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Status Provider Visual (API key dikelola aman di .env server, tidak dikirim ke frontend):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(imgProviders).map(([name, info]) => (
                <span
                  key={name}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    info.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}
                >
                  {name}: {info.configured ? (info.role === 'fallback_only' ? 'Fallback Ready' : 'Aktif') : 'Key Belum Diset'}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Provider Utama
            </label>
            <select
              value={form.image_primary_provider || 'auto'}
              onChange={(e) =>
                setForm({
                  ...form,
                  image_primary_provider: e.target.value as AutomationSettings['image_primary_provider']
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            >
              <option value="auto">Auto (Prioritas Key + Openverse)</option>
              <option value="unsplash">Unsplash</option>
              <option value="pexels">Pexels</option>
              <option value="pixabay">Pixabay</option>
              <option value="openverse">Openverse (CC)</option>
              <option value="wikimedia">Wikimedia Commons</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Provider Fallback Stock
            </label>
            <select
              value={form.image_fallback_provider || 'wikimedia'}
              onChange={(e) =>
                setForm({
                  ...form,
                  image_fallback_provider: e.target.value as AutomationSettings['image_fallback_provider']
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            >
              <option value="wikimedia">Wikimedia Commons</option>
              <option value="openverse">Openverse</option>
              <option value="pexels">Pexels</option>
              <option value="unsplash">Unsplash</option>
              <option value="pixabay">Pixabay</option>
              <option value="none">Tanpa Fallback Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Maks Gambar / Artikel (1-6)
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={Number(form.max_images_per_article ?? 4)}
              onChange={(e) => setForm({ ...form, max_images_per_article: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Format Optimasi Lokal
            </label>
            <select
              value={form.preferred_image_format || 'webp'}
              onChange={(e) =>
                setForm({
                  ...form,
                  preferred_image_format: e.target.value as AutomationSettings['preferred_image_format']
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            >
              <option value="webp">WebP (Teroptimasi)</option>
              <option value="jpg">JPEG</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Min Inline Images (0-4)
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={Number(form.min_inline_images ?? 1)}
              onChange={(e) => setForm({ ...form, min_inline_images: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Min Width (px)
            </label>
            <input
              type="number"
              min={400}
              max={1920}
              value={Number(form.min_image_width ?? 800)}
              onChange={(e) => setForm({ ...form, min_image_width: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Min Height (px)
            </label>
            <input
              type="number"
              min={240}
              max={1200}
              value={Number(form.min_image_height ?? 450)}
              onChange={(e) => setForm({ ...form, min_image_height: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
              Penempatan Inline
            </label>
            <select
              value={form.inline_image_placement || 'after_h2_balanced'}
              onChange={(e) =>
                setForm({
                  ...form,
                  inline_image_placement: e.target.value as AutomationSettings['inline_image_placement']
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
            >
              <option value="after_h2_balanced">Proporsional Setelah H2</option>
              <option value="end_fallback">Paragraf Merata</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {[
            { key: 'auto_download_images', label: 'Unduh & Simpan ke Storage Lokal (/uploads)' },
            { key: 'auto_optimize_images', label: 'Kompresi & Resize Otomatis (Pillow WebP)' },
            { key: 'auto_image_alt_caption', label: 'Generate Alt Text & Caption SEO AI' },
            { key: 'require_attribution', label: 'Catat Kredit & Lisensi Gambar Resmi' },
            { key: 'enable_ai_image_fallback', label: 'AI Image Fallback (Jika Stock Gagal)' },
            { key: 'image_quality_validation', label: 'Wajibkan Image Quality Gate Sebelum Auto-Publish' }
          ].map((opt) => {
            const k = opt.key as keyof AutomationSettings;
            return (
              <label key={opt.key} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form[k] ?? true)}
                  onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                  className="rounded border-zinc-300 text-blue-600"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Save size={14} /> Simpan Semua Pengaturan
        </button>
      </div>
    </form>
  );
};
