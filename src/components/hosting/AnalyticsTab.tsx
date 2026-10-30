import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  MousePointerClick,
  Copy,
  Check,
  Code,
  Sparkles,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Laptop,
  ExternalLink,
  Lock,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { api, AnalyticsResponse } from '../../services/api';

interface AnalyticsTabProps {
  serviceCode: string;
  domain: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ serviceCode, domain }) => {
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'html' | 'react' | 'wp'>('html');

  const trackerSnippet = `<!-- 1sLabs Analytics Tracker -->\n<script defer src="https://1slabs.my.id/tracker.js?v=2" data-service="${serviceCode}"></script>`;

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.services.getAnalytics(serviceCode, range);
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // Real-time automatic polling every 5 seconds so live hits appear instantly
    const interval = setInterval(() => {
      loadAnalytics();
    }, 5000);
    return () => clearInterval(interval);
  }, [serviceCode, range]);

  const copyTrackerSnippet = () => {
    navigator.clipboard.writeText(trackerSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find max views in timeline for relative bar height
  const maxViews = data?.timeline && data.timeline.length > 0
    ? Math.max(...data.timeline.map(t => Math.max(t.views, 1)))
    : 10;

  return (
    <div className="space-y-7">
      {/* Top Header & Range Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <span>Statistik & Analitik Kunjungan Website</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pemantauan real-time kunjungan halaman, pengunjung unik, dan interaksi klik untuk{' '}
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1"
                >
                  <span>{domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Range Buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7d', label: '7 Hari' },
                { id: '30d', label: '30 Hari' },
                { id: 'all', label: 'Semua' }
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === opt.id
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors cursor-pointer"
            title="Muat ulang analitik"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Pageviews */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Kunjungan Halaman</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {isLoading ? '...' : (data?.summary.total_pageviews || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Akumulasi tayangan seluruh halaman</p>
          </div>
        </div>

        {/* KPI 2: Unique Visitors */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pengunjung Unik</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {isLoading ? '...' : (data?.summary.unique_visitors || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Individu unik (berdasarkan visitor ID)</p>
          </div>
        </div>

        {/* KPI 3: Total Clicks */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Klik & Interaksi</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {isLoading ? '...' : (data?.summary.total_clicks || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Klik tombol, WhatsApp & link navigasi</p>
          </div>
        </div>

        {/* KPI 4: Click Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Rasio Interaksi (CTR)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {isLoading ? '...' : `${data?.summary.click_rate || 0}%`}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Rasio klik per tampilan halaman</p>
          </div>
        </div>
      </div>

      {/* Visual Traffic Bar Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Grafik Tren Kunjungan Harian</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Visualisasi perbandingan tayangan halaman dan pengunjung unik</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span>Kunjungan (Views)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
              <span>Pengunjung Unik</span>
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        {data?.timeline && data.timeline.length > 0 ? (
          <div className="pt-4 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 overflow-x-auto pb-4">
              {data.timeline.map((item, idx) => {
                const viewHeight = Math.max(12, Math.round((item.views / maxViews) * 100));
                const visitorHeight = Math.max(8, Math.round((item.visitors / maxViews) * 100));
                const displayDate = item.date.slice(5); // MM-DD
                return (
                  <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                      <strong>{item.date}</strong>: {item.views} views • {item.visitors} pengunjung
                    </div>

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center space-x-1 h-36">
                      <div
                        className="w-1/2 bg-blue-500 group-hover:bg-blue-600 rounded-t transition-all duration-300"
                        style={{ height: `${viewHeight}%` }}
                        title={`${item.views} Views`}
                      />
                      <div
                        className="w-1/2 bg-purple-500 group-hover:bg-purple-600 rounded-t transition-all duration-300"
                        style={{ height: `${visitorHeight}%` }}
                        title={`${item.visitors} Unik`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono mt-2 truncate">{displayDate}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-400">
            Belum ada data kunjungan yang tercatat untuk periode ini.
          </div>
        )}
      </div>

      {/* Two Column Grid: Top Pages & Top Clicked Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Halaman Paling Sering Dikunjungi</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Views</span>
          </div>

          <div className="space-y-3">
            {data?.topPages && data.topPages.length > 0 ? (
              data.topPages.map((page, idx) => {
                const total = data.summary.total_pageviews || 1;
                const pct = Math.round((page.views / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[280px]" title={page.page_path}>
                        {page.page_path}
                      </span>
                      <span className="text-gray-500">
                        {page.views} views ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">Belum ada kunjungan halaman.</p>
            )}
          </div>
        </div>

        {/* Top Clicked Elements */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <MousePointerClick className="w-4 h-4 text-emerald-500" />
              <span>Tombol & Link yang Paling Banyak Di-klik</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Klik</span>
          </div>

          <div className="space-y-2.5">
            {data?.topClicks && data.topClicks.length > 0 ? (
              data.topClicks.map((click, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                      {click.element_tag || 'BTN'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate" title={click.element_text}>
                      {click.element_text || 'Tombol / Link'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">
                    {click.count}x
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">Belum ada interaksi klik yang tercatat.</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Recent Activity Stream */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Aktivitas Kunjungan Real-time (Live Stream)</span>
          </h4>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span>Live Recording</span>
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((ev, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.event_type === 'click'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {ev.event_type === 'click' ? 'KLIK' : 'VIEW'}
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white truncate">
                    {ev.event_type === 'click' ? `"${ev.element_text}"` : ev.page_path}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-gray-400 text-[11px] flex-shrink-0 font-mono">
                  <span className="flex items-center space-x-1">
                    {ev.device === 'Mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                    <span>{ev.browser}</span>
                  </span>
                  <span>{ev.created_at ? ev.created_at.slice(11, 19) : '-'}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 py-3 text-center">Menunggu aktivitas baru...</p>
          )}
        </div>
      </div>

      {/* Tutorial Embed Kode Pelacak (Source Code Integration Guide) */}
      <div className="bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent border border-purple-200 dark:border-purple-900/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-purple-100 dark:border-purple-900/40 pb-5">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-xs">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Panduan Integrasi Source Code
              </span>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                Cara Memasang Kode Pelacak di Website Anda (Embed Tutorial)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                Agar seluruh kunjungan dan klik tombol (seperti tombol booking WhatsApp) tercatat secara 100% akurat, pasang kode pelacak resmi di bawah ini ke dalam source code website Anda:
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Copy Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Kode Script Pelacak (Copy-Paste Langsung):</span>
            <button
              type="button"
              onClick={copyTrackerSnippet}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Berhasil Tersalin!' : 'Salin Kode Pelacak'}</span>
            </button>
          </div>

          <div className="p-4 bg-gray-950 text-emerald-400 font-mono text-xs rounded-2xl border border-gray-800 overflow-x-auto shadow-inner">
            <code>{trackerSnippet}</code>
          </div>
        </div>

        {/* Guide Tabs per Framework */}
        <div className="space-y-3">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveGuideTab('html')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGuideTab === 'html'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              HTML & PHP Biasa (Kim Holiday)
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('react')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGuideTab === 'react'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              React / Vite / Next.js
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('wp')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeGuideTab === 'wp'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              WordPress / CMS
            </button>
          </div>

          {activeGuideTab === 'html' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs space-y-2.5 leading-relaxed text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Langkah-langkah untuk Project HTML/PHP:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Buka file <code className="font-mono font-bold text-purple-600">index.html</code> pada project Anda.</li>
                <li>Tempelkan kode script tepat sebelum tag penutup <code className="font-mono text-purple-600">&lt;/head&gt;</code> atau sebelum <code className="font-mono text-purple-600">&lt;/body&gt;</code>.</li>
                <li>Jika memiliki halaman lain (seperti <code className="font-mono">bali.html</code>, <code className="font-mono">bandung.html</code>), tempelkan script yang sama di masing-masing file agar setiap halaman terlacak otomatis.</li>
                <li>Simpan file dan upload kembali melalui <strong>File Manager</strong> kami. Pelacakan langsung aktif saat ada pengunjung!</li>
              </ol>
            </div>
          )}

          {activeGuideTab === 'react' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs space-y-2.5 leading-relaxed text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Langkah-langkah untuk React / Vite / Next.js:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Buka file <code className="font-mono font-bold text-purple-600">index.html</code> di folder root project React/Vite Anda.</li>
                <li>Sisipkan tag <code className="font-mono text-purple-600">&lt;script defer src="..." data-service="..."&gt;&lt;/script&gt;</code> di dalam blok <code className="font-mono">&lt;head&gt;</code>.</li>
                <li>Script otomatis mendeteksi pergantian rute SPA (<code className="font-mono">pushState</code> & <code className="font-mono">popstate</code>) tanpa perlu library tambahan.</li>
              </ol>
            </div>
          )}

          {activeGuideTab === 'wp' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs space-y-2.5 leading-relaxed text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Langkah-langkah untuk WordPress:</p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Masuk ke Dashboard WordPress Anda ➜ Menu <strong>Appearance</strong> ➜ <strong>Theme File Editor</strong>.</li>
                <li>Buka file <code className="font-mono font-bold text-purple-600">header.php</code> dan tempelkan script sebelum <code className="font-mono">&lt;/head&gt;</code>.</li>
                <li>Atau gunakan plugin gratis seperti <em>"WPCode - Insert Headers and Footers"</em> dan paste kode di kolom Header.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Technical Advantages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-900 dark:text-white block mb-0.5">⚡ Ringan & Zero-Lag</span>
            <span className="text-gray-500">Ukuran script &lt; 1 KB, dijalankan asynchronous tanpa memperlambat loading situs.</span>
          </div>
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-900 dark:text-white block mb-0.5">🎯 Deteksi Klik Otomatis</span>
            <span className="text-gray-500">Merekam klik pada tombol WhatsApp, form booking, dan link secara real-time.</span>
          </div>
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-900 dark:text-white block mb-0.5">🔒 100% Privasi & Tanpa Cookie Pihak Ketiga</span>
            <span className="text-gray-500">Data tersimpan di server 1sLabs Anda sendiri tanpa pelacakan iklan eksternal.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
