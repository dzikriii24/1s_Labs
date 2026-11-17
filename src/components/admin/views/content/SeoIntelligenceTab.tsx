import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Edit3,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Settings,
  Unlink,
  ExternalLink,
  Search,
  MousePointerClick,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X,
  Copy
} from 'lucide-react';
import {
  blogApi,
  seoIntelligenceApi,
  type BlogArticle,
  type BlogStats,
  type GscDashboardData,
  type GscSettings
} from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';
import { ScorePill, StatusBadge, formatDateId, getScoreTier } from './blogUiUtils';

interface SeoIntelligenceTabProps {
  onOpenEditor: (articleId: number) => void;
}

export const SeoIntelligenceTab: React.FC<SeoIntelligenceTabProps> = ({ onOpenEditor }) => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [gscSettings, setGscSettings] = useState<GscSettings | null>(null);
  const [gscPerf, setGscPerf] = useState<GscDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [gscSubTab, setGscSubTab] = useState<'queries' | 'opportunities' | 'pages' | 'declining'>('queries');

  // GSC Config Modal
  const [showGscModal, setShowGscModal] = useState(false);
  const [gscSiteUrl, setGscSiteUrl] = useState('https://1slabs.my.id');
  const [gscClientId, setGscClientId] = useState('');
  const [gscClientSecret, setGscClientSecret] = useState('');
  const [savingGsc, setSavingGsc] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, gscSetRes, gscPerfRes] = await Promise.all([
        blogApi.getAdminPosts({ limit: 80, sort: 'seo_asc' }),
        seoIntelligenceApi.getGscSettings(),
        seoIntelligenceApi.getGscPerformance().catch(() => ({ performance: null }))
      ]);
      setArticles(postRes.articles || []);
      setStats(postRes.stats || null);
      setGscSettings(gscSetRes.settings);
      setGscSiteUrl(gscSetRes.settings.site_url || 'https://1slabs.my.id');
      setGscClientId(gscSetRes.settings.client_id || '');
      if (gscPerfRes.performance) setGscPerf(gscPerfRes.performance);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat data SEO Intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // Handle GSC OAuth redirect notification in URL
    const params = new URLSearchParams(window.location.search);
    const gscStatus = params.get('gsc');
    if (gscStatus === 'connected') {
      notify.success('Google Search Console berhasil dihubungkan.');
      params.delete('gsc');
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', nextUrl);
    } else if (gscStatus === 'error') {
      notify.error(params.get('message') || 'Koneksi Google Search Console gagal.');
      params.delete('gsc');
      params.delete('message');
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [loadAll]);

  const handleBulkAnalyze = async () => {
    setBulkRunning(true);
    try {
      const res = await seoIntelligenceApi.bulkAnalyze();
      notify.success(
        `${res.analyzed_count} artikel berhasil diaudit ulang (Avg SEO ${res.avg_seo_score}, Readability ${res.avg_readability_score}, GEO ${res.avg_geo_score}).`
      );
      loadAll();
    } catch (err: any) {
      notify.error(err.message || 'Bulk Analyze gagal.');
    } finally {
      setBulkRunning(false);
    }
  };

  const handleSaveGscConfig = async (connectAfterSave = false) => {
    setSavingGsc(true);
    try {
      const res = await seoIntelligenceApi.saveGscSettings({
        site_url: gscSiteUrl.trim(),
        client_id: gscClientId.trim(),
        client_secret: gscClientSecret.trim() || undefined
      });
      setGscSettings(res.settings);
      setGscClientSecret('');
      if (connectAfterSave) {
        const authRes = await seoIntelligenceApi.getGscAuthUrl();
        window.location.href = authRes.authUrl;
      } else {
        notify.success('Konfigurasi Google Search Console disimpan.');
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan konfigurasi GSC.');
    } finally {
      setSavingGsc(false);
    }
  };

  const handleConnectOAuth = async () => {
    try {
      const authRes = await seoIntelligenceApi.getGscAuthUrl();
      window.location.href = authRes.authUrl;
    } catch (err: any) {
      notify.error(err.message || 'Simpan Client ID & Client Secret terlebih dahulu.');
      setShowGscModal(true);
    }
  };

  const handleSyncGsc = async () => {
    setSyncingGsc(true);
    try {
      const res = await seoIntelligenceApi.syncGsc();
      setGscPerf(res.performance);
      notify.success(`Berhasil menyinkronkan ${res.sync.synced_rows} kueri pencarian dari ${res.sync.property}.`);
      loadAll();
    } catch (err: any) {
      notify.error(err.message || 'Gagal sinkronisasi data GSC.');
    } finally {
      setSyncingGsc(false);
    }
  };

  const handleDisconnectGsc = async () => {
    const ok = await notify.confirm({
      title: 'Putuskan Koneksi GSC?',
      text: 'Token OAuth Google Search Console akan dihapus dari server.',
      confirmButtonText: 'Ya, Putuskan',
      isDanger: true
    });
    if (!ok) return;
    try {
      const res = await seoIntelligenceApi.disconnectGsc();
      setGscSettings(res.settings);
      notify.toast('Koneksi GSC diputuskan.');
    } catch (err: any) {
      notify.error(err.message || 'Gagal memutuskan koneksi.');
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.focus_keyphrase || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1.5">
            <TrendingUp size={13} />
            SEO &amp; GEO Intelligence Center
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Audit Kesehatan SEO &amp; Search Console</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Pantau kualitas SEO on-page seluruh artikel, optimalkan artikel ber-skor rendah, dan hubungkan data riil Google Search Console.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGscModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50"
          >
            <Settings size={15} className="text-blue-600" />
            Konfigurasi GSC
          </button>
          <button
            type="button"
            disabled={bulkRunning}
            onClick={handleBulkAnalyze}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={15} className={bulkRunning ? 'animate-spin' : ''} />
            {bulkRunning ? 'Mengaudit Semua Artikel...' : 'Bulk Analyze Semua Artikel'}
          </button>
        </div>
      </div>

      {/* Global SEO Health Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-medium text-zinc-500">Rata-rata SEO Score</div>
          <div className={`text-3xl font-extrabold mt-1 ${getScoreTier(Number(stats?.avg_seo_score || 0)).text}`}>
            {Number(stats?.avg_seo_score || 0)}
            <span className="text-sm font-normal text-zinc-400">/100</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {Number(stats?.good_seo_count || 0)} baik · {Number(stats?.warning_seo_count || 0)} perlu optimasi · {Number(stats?.poor_seo_count || 0)} kurang
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-medium text-zinc-500">Readability Rata-rata</div>
          <div className={`text-3xl font-extrabold mt-1 ${getScoreTier(Number(stats?.avg_readability_score || 0)).text}`}>
            {Number(stats?.avg_readability_score || 0)}
            <span className="text-sm font-normal text-zinc-400">/100</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Evaluasi panjang kalimat, transisi &amp; H2/H3</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-medium text-zinc-500">GEO Readiness Rata-rata</div>
          <div className={`text-3xl font-extrabold mt-1 ${getScoreTier(Number(stats?.avg_geo_score || 0)).text}`}>
            {Number(stats?.avg_geo_score || 0)}
            <span className="text-sm font-normal text-zinc-400">/100</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Kejelasan jawaban, entitas &amp; FAQ Schema</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
            <span>Google Search Console</span>
            <Globe size={15} className={gscSettings?.connected ? 'text-emerald-600' : 'text-zinc-400'} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {gscSettings?.connected ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CheckCircle2 size={16} /> Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600">
                <AlertTriangle size={16} /> Belum Terhubung
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            {gscSettings?.connected_email || gscSettings?.site_url || 'Hubungkan OAuth 2.0 untuk data riil'}
          </p>
        </div>
      </div>

      {/* Google Search Console Live Insights Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 to-white dark:from-blue-950/20 dark:to-zinc-900">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Search size={17} className="text-blue-600" />
              Google Search Console — Peluang Query &amp; Trafik Organik (28 Hari)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {gscSettings?.connected
                ? `Properti: ${gscSettings.site_url} · Sinkron terakhir: ${gscSettings.last_synced_at ? formatDateId(gscSettings.last_synced_at, true) : 'Belum disinkronkan'}`
                : 'Hubungkan Google Search Console (OAuth 2.0) untuk menarik klik, impresi, CTR, posisi rata-rata, dan kueri berpeluang.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {gscSettings?.connected ? (
              <>
                <button
                  type="button"
                  disabled={syncingGsc}
                  onClick={handleSyncGsc}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
                >
                  <RefreshCw size={14} className={syncingGsc ? 'animate-spin' : ''} />
                  {syncingGsc ? 'Menyinkronkan...' : 'Sync Data GSC'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGsc}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 hover:text-rose-600"
                >
                  <Unlink size={14} /> Putuskan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectOAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Link2 size={14} /> Hubungkan Google Search Console
              </button>
            )}
          </div>
        </div>

        {gscPerf && gscPerf.summary.row_count > 0 ? (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-zinc-800/50 border border-blue-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5"><MousePointerClick size={14} className="text-blue-600" /> Total Klik Organik</div>
                <div className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">{gscPerf.summary.total_clicks.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 flex items-center gap-1.5"><Eye size={14} className="text-indigo-600" /> Total Impresi</div>
                <div className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">{gscPerf.summary.total_impressions.toLocaleString('id-ID')}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">Rata-rata CTR</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">{gscPerf.summary.avg_ctr_percent}%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">Posisi Rata-rata</div>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">#{gscPerf.summary.avg_position}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {[
                { key: 'queries', label: `Top Kueri (${gscPerf.topQueries.length})` },
                { key: 'opportunities', label: `Peluang Quick Win (${gscPerf.opportunities.length})` },
                { key: 'pages', label: `Top Halaman (${gscPerf.topPages.length})` },
                { key: 'declining', label: `Kueri Menurun (${gscPerf.declining.length})` }
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setGscSubTab(t.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    gscSubTab === t.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              {gscSubTab === 'pages' ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">URL Halaman</th>
                      <th className="py-2.5 px-3 text-right">Klik</th>
                      <th className="py-2.5 px-3 text-right">Impresi</th>
                      <th className="py-2.5 px-3 text-right">CTR</th>
                      <th className="py-2.5 px-3 text-right">Posisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {gscPerf.topPages.map((p, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-mono text-blue-600 truncate max-w-md">{p.page_url}</td>
                        <td className="py-2 px-3 text-right font-semibold">{p.clicks}</td>
                        <td className="py-2 px-3 text-right">{p.impressions}</td>
                        <td className="py-2 px-3 text-right">{p.ctr}%</td>
                        <td className="py-2 px-3 text-right">#{p.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Kueri Pencarian</th>
                      <th className="py-2.5 px-3">Halaman Target</th>
                      <th className="py-2.5 px-3 text-right">Klik</th>
                      <th className="py-2.5 px-3 text-right">Impresi</th>
                      <th className="py-2.5 px-3 text-right">CTR</th>
                      <th className="py-2.5 px-3 text-right">Posisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(gscSubTab === 'queries'
                      ? gscPerf.topQueries
                      : gscSubTab === 'opportunities'
                        ? gscPerf.opportunities
                        : gscPerf.declining
                    ).map((q) => {
                      const clickDiff = q.clicks - q.prev_clicks;
                      return (
                        <tr key={q.id}>
                          <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-white">{q.query_text}</td>
                          <td className="py-2 px-3 font-mono text-zinc-500 truncate max-w-[260px]">{q.page_url}</td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {q.clicks}
                            {q.prev_clicks > 0 && clickDiff !== 0 && (
                              <span className={`ml-1 inline-flex items-center text-[10px] ${clickDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {clickDiff > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(clickDiff)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">{q.impressions}</td>
                          <td className="py-2 px-3 text-right">{(Number(q.ctr) * 100).toFixed(2)}%</td>
                          <td className="py-2 px-3 text-right font-semibold">#{q.position}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">
            {gscSettings?.connected
              ? 'Belum ada data sinkronisasi Search Console tersimpan. Klik "Sync Data GSC" untuk menarik metrik 28 hari terakhir.'
              : 'Klik "Konfigurasi GSC" untuk memasukkan Client ID & Client Secret Google Cloud OAuth 2.0 Anda.'}
          </div>
        )}
      </div>

      {/* Article Audit Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Prioritas Optimasi Per Artikel</h3>
            <p className="text-xs text-zinc-500">Diurutkan dari skor SEO terendah agar tim fokus memperbaiki artikel yang paling berdampak.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter artikel / keyphrase..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase text-zinc-500">
                <th className="py-3 px-4">Artikel &amp; Focus Keyphrase</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Skor SEO · Read · GEO</th>
                <th className="py-3 px-3">Temuan Utama</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-zinc-500"><Loader2 size={18} className="animate-spin mx-auto" /></td></tr>
              ) : (
                filteredArticles.map((art) => {
                  const problems = (art.seo_audit?.checks || []).filter((c) => c.status !== 'good').slice(0, 2);
                  return (
                    <tr key={art.id} className="hover:bg-blue-50/30 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-zinc-900 dark:text-white line-clamp-1">{art.title}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          KW: {art.focus_keyphrase || <span className="text-rose-500 font-medium">Belum diisi</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={art.status} /></td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          <ScorePill label="SEO" score={art.seo_score} />
                          <ScorePill label="Read" score={art.readability_score} />
                          <ScorePill label="GEO" score={art.geo_score} />
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        {problems.length === 0 ? (
                          <span className="text-emerald-600 font-medium">Struktur &amp; metadata SEO optimal</span>
                        ) : (
                          <ul className="space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                            {problems.map((p) => (
                              <li key={p.id} className="truncate">• {p.title}: {p.detail}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditor(art.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold"
                          >
                            <Edit3 size={12} /> Optimalkan
                          </button>
                          {art.status === 'published' && (
                            <a
                              href={`/blog/${art.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-blue-600"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GSC Configuration Modal */}
      {showGscModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-600" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Konfigurasi Google Search Console (OAuth 2.0)</h4>
              </div>
              <button type="button" onClick={() => setShowGscModal(false)} className="text-zinc-400"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Property URL (Site)</label>
                <input
                  type="text"
                  value={gscSiteUrl}
                  onChange={(e) => setGscSiteUrl(e.target.value)}
                  placeholder="https://1slabs.my.id atau sc-domain:1slabs.my.id"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Google OAuth Client ID</label>
                <input
                  type="text"
                  value={gscClientId}
                  onChange={(e) => setGscClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Google OAuth Client Secret {gscSettings?.has_client_secret ? `(${gscSettings.client_secret_masked})` : ''}
                </label>
                <input
                  type="password"
                  value={gscClientSecret}
                  onChange={(e) => setGscClientSecret(e.target.value)}
                  placeholder={gscSettings?.has_client_secret ? 'Biarkan kosong jika tidak mengubah secret' : 'GOCSPX-...'}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1">
                <div className="font-semibold text-blue-800 dark:text-blue-300">Authorized Redirect URI (Daftarkan di Google Cloud Console):</div>
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-blue-100">
                  <span className="truncate">{gscSettings?.redirect_uri || 'https://1slabs.my.id/api/seo-intelligence/gsc/callback'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gscSettings?.redirect_uri || 'https://1slabs.my.id/api/seo-intelligence/gsc/callback');
                      notify.toast('Redirect URI disalin.');
                    }}
                    className="text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingGsc}
                  onClick={() => handleSaveGscConfig(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-200"
                >
                  Simpan Saja
                </button>
                <button
                  type="button"
                  disabled={savingGsc}
                  onClick={() => handleSaveGscConfig(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Sparkles size={14} /> Simpan &amp; Hubungkan Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

