import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  XCircle
} from 'lucide-react';
import {
  GscInspectionRecord,
  GscSettings,
  OptimizationSuggestion,
  UnifiedSeoPerformanceResponse,
  seoIntelligenceApi
} from '../../../../services/blogApi';
import { getErrMsg } from '../../../../services/contentAutomationApi';
import { ScorePill, formatDateId } from '../content/blogUiUtils';
import notify from '../../../../lib/notify';

interface AutomationSeoGscPanelProps {
  initialInspectTarget?: { articleId?: number; url: string } | null;
  onOpenBlogEditor: (articleId: number) => void;
}

function extractDomainHost(val: string): string {
  return val
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^sc-domain:/i, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .toLowerCase();
}

function pickMatchingProperty(
  targetUrl: string,
  sites: Array<{ siteUrl: string; permissionLevel: string }>,
  fallback: string
): string {
  const verified = sites.filter((s) => s.permissionLevel !== 'siteUnverifiedUser');
  if (verified.length === 0) return fallback;
  if (verified.some((s) => s.siteUrl === targetUrl)) return targetUrl;

  const targetHost = extractDomainHost(targetUrl);
  if (targetHost) {
    const matched = verified.find((s) => {
      const siteHost = extractDomainHost(s.siteUrl);
      return siteHost && (targetHost === siteHost || targetHost.endsWith(`.${siteHost}`) || siteHost.endsWith(`.${targetHost}`));
    });
    if (matched) return matched.siteUrl;
  }

  const fbHost = extractDomainHost(fallback);
  const fbMatch = verified.find((s) => extractDomainHost(s.siteUrl) === fbHost);
  return fbMatch?.siteUrl || verified[0].siteUrl;
}

export const AutomationSeoGscPanel: React.FC<AutomationSeoGscPanelProps> = ({
  initialInspectTarget,
  onOpenBlogEditor
}) => {
  const [gscSettings, setGscSettings] = useState<GscSettings | null>(null);
  const [verifiedSites, setVerifiedSites] = useState<Array<{ siteUrl: string; permissionLevel: string }>>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [unified, setUnified] = useState<UnifiedSeoPerformanceResponse | null>(null);
  const [inspections, setInspections] = useState<GscInspectionRecord[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  const [inspectUrlInput, setInspectUrlInput] = useState('');
  const [inspectArticleId, setInspectArticleId] = useState<number | undefined>(undefined);
  const [inspecting, setInspecting] = useState(false);
  const [lastInspectionNote, setLastInspectionNote] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [submittingSitemap, setSubmittingSitemap] = useState(false);
  const [generatingSug, setGeneratingSug] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, perfRes, inspRes, sugRes] = await Promise.all([
        seoIntelligenceApi.getGscSettings(),
        seoIntelligenceApi.getUnifiedPerformance(40),
        seoIntelligenceApi.listInspections(),
        seoIntelligenceApi.listSuggestions()
      ]);
      const initialSite = settingsRes.settings?.site_url || 'https://1slabs.my.id';
      setGscSettings(settingsRes.settings);
      setSelectedSite(initialSite);
      setUnified(perfRes);
      setInspections(inspRes.inspections || []);
      setSuggestions(sugRes.suggestions || []);

      if (settingsRes.settings?.connected) {
        seoIntelligenceApi
          .listGscSites()
          .then((r) => {
            const sites = r.sites || [];
            setVerifiedSites(sites);
            setSelectedSite((prev) => pickMatchingProperty(initialSite, sites, prev || initialSite));
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (initialInspectTarget) {
      setInspectUrlInput(initialInspectTarget.url);
      setInspectArticleId(initialInspectTarget.articleId);
    }
  }, [initialInspectTarget]);

  const handleSyncGsc = async () => {
    setSyncing(true);
    try {
      const res = await seoIntelligenceApi.syncGsc();
      notify.success(`Sinkronisasi ${res.sync.synced_rows} kueri Search Console selesai.`);
      await loadAll();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitSitemap = async () => {
    setSubmittingSitemap(true);
    try {
      const res = await seoIntelligenceApi.submitSitemapAndIndexNow(selectedSite || undefined);
      const gscOk = res.gsc_sitemap?.submitted;
      const inOk = res.indexnow?.submitted;
      if (gscOk || inOk) {
        notify.success(
          `Sitemap GSC: ${gscOk ? 'Terkirim' : res.gsc_sitemap?.error || 'Lewati'} • IndexNow (Bing/DuckDuckGo): ${
            inOk ? `${res.indexnow?.count || 0} URL dikirim` : res.indexnow?.error || 'Lewati'
          }`
        );
      } else {
        notify.error(res.gsc_sitemap?.error || res.indexnow?.error || 'Gagal mengirim sitemap.');
      }
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSubmittingSitemap(false);
    }
  };

  const handleInspectUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let trimmed = inspectUrlInput.trim();
    if (!trimmed && !inspectArticleId) {
      notify.error('Masukkan URL artikel atau pilih artikel terlebih dahulu.');
      return;
    }
    if (trimmed.startsWith('/')) {
      trimmed = `https://1slabs.my.id${trimmed}`;
      setInspectUrlInput(trimmed);
    } else if (trimmed && !/^https?:\/\//i.test(trimmed) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
      setInspectUrlInput(trimmed);
    }
    const effectiveSite = trimmed
      ? pickMatchingProperty(trimmed, verifiedSites, selectedSite)
      : selectedSite || undefined;
    if (effectiveSite && effectiveSite !== selectedSite) {
      setSelectedSite(effectiveSite);
    }
    setInspecting(true);
    try {
      const res = await seoIntelligenceApi.inspectUrl({
        article_id: inspectArticleId,
        inspection_url: trimmed || undefined,
        site_url: effectiveSite || undefined
      });
      setLastInspectionNote(res.official_note || '');
      notify.success(`URL Inspection selesai (${res.inspection.verdict || 'INSPECTED'}).`);
      await loadAll();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setInspecting(false);
    }
  };

  const handleGenerateSuggestions = async (articleId?: number) => {
    setGeneratingSug(true);
    try {
      const res = await seoIntelligenceApi.generateSuggestions({ article_id: articleId, limit: 3 });
      notify.success(`${res.generated} saran optimasi AI dibuat (menunggu persetujuan sebelum diterapkan).`);
      await loadAll();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setGeneratingSug(false);
    }
  };

  const handleApplySuggestion = async (id: number) => {
    const ok = await notify.confirm({
      title: 'Terapkan Saran Optimasi ke Artikel Terbit?',
      text: 'Versi sebelumnya akan otomatis disimpan ke riwayat revisi (blog_article_revisions).',
      confirmButtonText: 'Ya, Terapkan Revisi'
    });
    if (!ok) return;
    try {
      await seoIntelligenceApi.applySuggestion(id);
      notify.success('Saran optimasi diterapkan & skor SEO/GEO diperbarui.');
      await loadAll();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleDismissSuggestion = async (id: number) => {
    try {
      await seoIntelligenceApi.dismissSuggestion(id);
      notify.toast('Saran diabaikan.');
      await loadAll();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const summary = unified?.gsc_summary || {};
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending_approval');

  return (
    <div className="space-y-6">
      {/* GSC Connection + Sync Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                SEO Performance &amp; Google Search Console URL Inspection
              </h3>
              {gscSettings?.connected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                  <CheckCircle2 size={11} /> Terhubung ({gscSettings.connected_email || gscSettings.site_url})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
                  <AlertCircle size={11} /> Belum Terhubung OAuth GSC
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Pantau klik, impresi, CTR, status indeks URL resmi via GSC API, serta usulan perbaikan AI berbasis performa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {verifiedSites.length > 0 && (
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950 font-mono"
              >
                {[...verifiedSites]
                  .sort((a, b) => Number(a.permissionLevel === 'siteUnverifiedUser') - Number(b.permissionLevel === 'siteUnverifiedUser'))
                  .map((s) => (
                    <option
                      key={s.siteUrl}
                      value={s.siteUrl}
                      disabled={s.permissionLevel === 'siteUnverifiedUser'}
                    >
                      {s.siteUrl} ({s.permissionLevel === 'siteUnverifiedUser' ? 'Belum Terverifikasi' : s.permissionLevel})
                    </option>
                  ))}
              </select>
            )}
            <button
              onClick={handleSyncGsc}
              disabled={syncing || !gscSettings?.connected}
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Sync GSC Data
            </button>
            <button
              onClick={handleSubmitSitemap}
              disabled={submittingSitemap}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submittingSitemap ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
              Submit Sitemap &amp; IndexNow
            </button>
            <button
              onClick={() => handleGenerateSuggestions()}
              disabled={generatingSug}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {generatingSug ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Buat Saran Optimasi AI
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950">
            <span className="text-[11px] text-zinc-400 block">Total Clicks (28d)</span>
            <strong className="text-lg text-zinc-900 dark:text-white">{summary.total_clicks ?? 0}</strong>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950">
            <span className="text-[11px] text-zinc-400 block">Total Impressions</span>
            <strong className="text-lg text-zinc-900 dark:text-white">{summary.total_impressions ?? 0}</strong>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950">
            <span className="text-[11px] text-zinc-400 block">Rata-rata CTR</span>
            <strong className="text-lg text-zinc-900 dark:text-white">{summary.avg_ctr_percent ?? 0}%</strong>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950">
            <span className="text-[11px] text-zinc-400 block">Rata-rata Posisi</span>
            <strong className="text-lg text-zinc-900 dark:text-white">{summary.avg_position ?? '—'}</strong>
          </div>
        </div>
      </div>

      {/* Official URL Inspection API Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={17} className="text-blue-600" />
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
            Google Search Console URL Inspection API
          </h4>
        </div>

        <form onSubmit={handleInspectUrl} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={inspectUrlInput}
              onChange={(e) => {
                setInspectUrlInput(e.target.value);
                setInspectArticleId(undefined);
              }}
              placeholder="https://1slabs.my.id/blog/slug-artikel"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-mono bg-white dark:bg-zinc-950"
            />
          </div>
          <button
            type="submit"
            disabled={inspecting || !gscSettings?.connected}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {inspecting ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
            Inspeksi URL Sekarang
          </button>
        </form>

        <p className="text-[11px] text-zinc-500">
          {lastInspectionNote ||
            'Catatan Resmi: API resmi Google Search Console mendukung pemeriksaan status pengindeksan (URL Inspection). Permintaan "Request Indexing" manual tetap dilakukan melalui tautan Google Search Console UI yang muncul di hasil inspeksi.'}
        </p>

        {inspections.length > 0 && (
          <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800 rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 text-left text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="py-2.5 px-3 font-semibold">URL Diperiksa</th>
                  <th className="py-2.5 px-3 font-semibold">Verdict / Coverage</th>
                  <th className="py-2.5 px-3 font-semibold">Canonical / Fetch</th>
                  <th className="py-2.5 px-3 font-semibold">Crawl Terakhir</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Search Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {inspections.slice(0, 10).map((ins) => (
                  <tr key={ins.id}>
                    <td className="py-2.5 px-3 font-mono text-[11px] max-w-xs truncate">{ins.inspection_url}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ins.verdict === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ins.verdict}
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{ins.coverage_state || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-500">
                      Fetch: {ins.page_fetch_state || '-'}
                      <br />
                      Canonical: {ins.google_canonical ? 'Matched/Set' : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-500">{formatDateId(ins.last_crawl_time, true)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {ins.inspection_result_link && (
                        <a
                          href={ins.inspection_result_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                        >
                          Buka di GSC <ExternalLink size={11} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Optimization Suggestions Requiring Admin Approval */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
              Saran Optimasi Berbasis Performa GSC (Menunggu Persetujuan)
            </h4>
            <p className="text-xs text-zinc-500">
              Artikel yang sudah terbit tidak akan pernah ditimpa otomatis sebelum admin menyetujui usulan revisi.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            {pendingSuggestions.length} menunggu approval
          </span>
        </div>

        {pendingSuggestions.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Belum ada saran optimasi yang tertunda. Klik "Buat Saran Optimasi AI" untuk memindai artikel ber-CTR rendah atau skor SEO di bawah target.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 space-y-2.5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">{s.source}</span>
                    <h5 className="font-bold text-xs text-zinc-900 dark:text-white">
                      {s.current_title} → <span className="text-blue-600">{s.proposed_title}</span>
                    </h5>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDismissSuggestion(s.id)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} /> Abaikan
                    </button>
                    <button
                      onClick={() => handleApplySuggestion(s.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Setujui &amp; Terapkan Revisi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <strong className="block text-zinc-500">Usulan Meta Title &amp; Description:</strong>
                    <div className="font-semibold text-blue-700 mt-0.5">{s.proposed_meta_title}</div>
                    <div className="text-zinc-600 mt-0.5">{s.proposed_meta_description}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <strong className="block text-zinc-500">Dampak Audit &amp; Alasan:</strong>
                    <div className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                      SEO {s.trigger_metrics?.before_seo ?? s.current_seo_score} → {s.trigger_metrics?.after_seo ?? '-'} | GEO{' '}
                      {s.trigger_metrics?.before_geo ?? s.current_geo_score} → {s.trigger_metrics?.after_geo ?? '-'}
                    </div>
                    <p className="text-zinc-500 mt-1 line-clamp-2">{s.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Per-Article Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Performa Gabungan Artikel (Internal Score + GSC)</h4>
        {loading ? (
          <p className="text-xs text-zinc-400 py-8 text-center">Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="py-2 pr-3 font-semibold">Artikel</th>
                  <th className="py-2 px-2 font-semibold">Skor Internal</th>
                  <th className="py-2 px-2 font-semibold">GSC Clicks / Impr</th>
                  <th className="py-2 px-2 font-semibold">Indeks GSC</th>
                  <th className="py-2 pl-2 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(unified?.articles || []).map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 pr-3 max-w-xs">
                      <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate">{a.title}</p>
                      <span className="text-[11px] font-mono text-zinc-400">/blog/{a.slug}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex gap-1">
                        <ScorePill label="SEO" score={a.seo_score} />
                        <ScorePill label="GEO" score={a.geo_score} />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-zinc-600">
                      {a.gsc.clicks} / {a.gsc.impressions}
                      {a.gsc.position ? ` (Pos ${a.gsc.position})` : ''}
                    </td>
                    <td className="py-2.5 px-2 text-[11px]">
                      {a.latest_inspection ? (
                        <span className="text-blue-600 font-semibold">{a.latest_inspection.verdict}</span>
                      ) : (
                        <span className="text-zinc-400">Belum diinspeksi</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => {
                          setInspectUrlInput(`https://1slabs.my.id/blog/${a.slug}`);
                          setInspectArticleId(a.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onOpenBlogEditor(a.id)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
