import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  FileCode,
  ArrowRightLeft,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  ShieldCheck,
  X
} from 'lucide-react';
import { seoIntelligenceApi, type SeoRedirectRule } from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';

export const TechnicalSeoTab: React.FC = () => {
  const [redirects, setRedirects] = useState<SeoRedirectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await seoIntelligenceApi.getRedirects();
      setRedirects(res.redirects || []);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat daftar redirect.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRedirects();
  }, [loadRedirects]);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !targetUrl.trim()) {
      notify.warning('Source path dan Target URL wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await seoIntelligenceApi.createRedirect({
        source_path: sourcePath.trim(),
        target_url: targetUrl.trim(),
        status_code: statusCode,
        is_active: true,
        notes: notes.trim()
      });
      notify.success('Aturan redirect berhasil ditambahkan.');
      setShowModal(false);
      setSourcePath('');
      setTargetUrl('');
      setNotes('');
      loadRedirects();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan redirect.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: SeoRedirectRule) => {
    try {
      await seoIntelligenceApi.updateRedirect(rule.id, { is_active: !rule.is_active });
      loadRedirects();
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status redirect.');
    }
  };

  const handleDelete = async (rule: SeoRedirectRule) => {
    const ok = await notify.confirm({
      title: 'Hapus Aturan Redirect?',
      text: `Redirect dari "${rule.source_path}" ke "${rule.target_url}" akan dihapus.`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;
    await seoIntelligenceApi.deleteRedirect(rule.id);
    loadRedirects();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1.5">
            <Globe size={13} />
            Technical SEO &amp; Indexing Infrastructure
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sitemap XML, Robots.txt, Schema &amp; Redirects</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Pantau endpoint pengindeksan otomatis 1sLabs dan kelola pengalihan URL 301/302 untuk menjaga ekuitas tautan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
        >
          <Plus size={15} /> Tambah Redirect 301/302
        </button>
      </div>

      {/* Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <FileCode size={16} className="text-blue-600" /> Dynamic XML Sitemap
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 size={11} /> Live
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Menyertakan seluruh halaman utama 1sLabs, dokumentasi publik, kategori, dan artikel blog berstatus Published secara otomatis.
          </p>
          <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-mono">
            <span className="truncate">https://1slabs.my.id/sitemap.xml</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://1slabs.my.id/sitemap.xml');
                  notify.toast('URL Sitemap disalin.');
                }}
                className="text-zinc-500 hover:text-blue-600"
              >
                <Copy size={13} />
              </button>
              <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-blue-600">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <ShieldCheck size={16} className="text-blue-600" /> Dynamic Robots.txt
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 size={11} /> Aktif
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Mengizinkan Googlebot, Bingbot, GPTBot, OAI-SearchBot &amp; PerplexityBot merayapi `/blog/` dan `/docs/` sambil memblokir `/admin` &amp; `/portal`.
          </p>
          <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-mono">
            <span className="truncate">https://1slabs.my.id/robots.txt</span>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-blue-600 shrink-0">
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
              <Globe size={16} className="text-indigo-600" /> JSON-LD &amp; Crawler SSR
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
              Aktif
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Setiap `/blog/:slug` merender Schema `BlogPosting`, `BreadcrumbList`, `FAQPage`, serta melayani metadata SSR &amp; HTTP 404 asli bagi crawler bot.
          </p>
          <div className="text-[11px] font-mono bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 truncate">
            /api/seo-intelligence/meta-render
          </div>
        </div>
      </div>

      {/* Redirects Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Aturan Redirect URL ({redirects.length})</h3>
              <p className="text-xs text-zinc-500">Mencegah 404 saat mengubah slug artikel lama atau memigrasikan URL.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                <th className="py-3 px-4">Source Path</th>
                <th className="py-3 px-3">Target URL</th>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-3 text-right">Hits</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-zinc-400">Memuat daftar redirect...</td></tr>
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    Belum ada aturan redirect 301/302 terdaftar.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">{r.source_path}</td>
                    <td className="py-3 px-3 font-mono text-blue-600">{r.target_url}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">{r.status_code}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">{r.hits}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(r)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {r.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Redirect Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddRedirect} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Tambah Aturan Redirect</h4>
              <button type="button" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Source Path *</label>
              <input type="text" value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} placeholder="/blog/slug-lama" className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800 font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Target URL *</label>
              <input type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="/blog/slug-baru atau https://..." className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800 font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tipe HTTP Redirect</label>
              <select value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                <option value={301}>301 — Permanent Redirect (SEO Equity Transfer)</option>
                <option value={302}>302 — Temporary Redirect</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Catatan (Opsional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alasan perubahan URL..." className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 rounded-xl border">Batal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Redirect'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

