import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  MousePointerClick,
  Globe,
  Smartphone,
  Monitor,
  Laptop,
  Calendar,
  Filter,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { api, AdminAnalyticsOverview } from '../../../services/api';

export const AnalyticsDashboardView: React.FC = () => {
  const [range, setRange] = useState<'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [serviceCode, setServiceCode] = useState<string>('1slabs.my.id');
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.admin.getAnalyticsOverview({
        range,
        serviceCode: serviceCode === 'all' ? undefined : serviceCode
      });
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
  }, [range, serviceCode]);

  // Filter out internal /admin routes
  const displayTopPages = (data?.topPages || []).filter(
    (p) => !p.page_path.startsWith('/admin')
  );

  const displayRecentEvents = (data?.recentEvents || []).filter(
    (e) => !e.page_path.startsWith('/admin')
  );

  // Timeline & SVG Line Chart calculations
  const timeline = data?.timeline && data.timeline.length > 0 ? data.timeline : [];
  const maxViews = timeline.length > 0
    ? Math.max(...timeline.map((t) => Math.max(t.views, t.visitors, 1)))
    : 10;

  // Chart dimensions
  const svgWidth = 760;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getCoordinates = (index: number, val: number) => {
    const totalPoints = timeline.length > 1 ? timeline.length - 1 : 1;
    const x = padLeft + (index / totalPoints) * plotWidth;
    const y = padTop + plotHeight - (val / (maxViews * 1.15)) * plotHeight;
    return { x, y };
  };

  const viewsPoints = timeline.map((p, i) => getCoordinates(i, p.views));
  const visitorsPoints = timeline.map((p, i) => getCoordinates(i, p.visitors));

  const buildPathString = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth cubic bezier or straight lines
      const prev = points[idx - 1];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }, '');
  };

  const viewsPath = buildPathString(viewsPoints);
  const visitorsPath = buildPathString(visitorsPoints);

  const viewsAreaPath = viewsPoints.length > 0
    ? `${viewsPath} L ${viewsPoints[viewsPoints.length - 1].x} ${padTop + plotHeight} L ${viewsPoints[0].x} ${padTop + plotHeight} Z`
    : '';

  const visitorsAreaPath = visitorsPoints.length > 0
    ? `${visitorsPath} L ${visitorsPoints[visitorsPoints.length - 1].x} ${padTop + plotHeight} L ${visitorsPoints[0].x} ${padTop + plotHeight} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Analitik Pengunjung Website 1sLabs
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Data real-time live traffic dari embed tracker <code>tracker.js</code> resmi 1slabs.my.id (tidak termasuk akses internal admin).
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls: Range & Service */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Service filter */}
          {data?.trackedServices && data.trackedServices.length > 0 && (
            <select
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="1slabs.my.id">1slabs.my.id (Website Utama 1sLabs)</option>
              <option value="all">Semua Domain Terkelola</option>
              {data.trackedServices
                .filter((s) => s.domain !== '1slabs.my.id' && s.service_code !== '1slabs.my.id')
                .map((s) => (
                  <option key={s.service_code} value={s.service_code}>
                    {s.domain || s.service_code}
                  </option>
                ))}
            </select>
          )}

          {/* Time range buttons */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: 'yesterday', label: 'Kemarin' },
              { key: '7d', label: '7 Hari' },
              { key: '30d', label: '30 Hari' },
              { key: '90d', label: '90 Hari' },
              { key: 'all', label: 'Semua' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRange(tab.key as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === tab.key
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Muat ulang analitik"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Tayangan (Pageviews)',
            val: data?.summary.totalPageviews ?? 0,
            icon: Eye,
            color: 'text-blue-600 bg-blue-50'
          },
          {
            title: 'Pengunjung Unik (Visitors)',
            val: data?.summary.uniqueVisitors ?? 0,
            icon: Users,
            color: 'text-purple-600 bg-purple-50'
          },
          {
            title: 'Total Sesi Kunjungan',
            val: data?.summary.totalSessions ?? 0,
            icon: Clock,
            color: 'text-emerald-600 bg-emerald-50'
          },
          {
            title: 'Interaksi & Klik Konten',
            val: data?.summary.totalClicks ?? 0,
            sub: `CTR: ${data?.summary.clickRate ?? 0}%`,
            icon: MousePointerClick,
            color: 'text-amber-600 bg-amber-50'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {item.title}
                </span>
                <div className={`p-2 rounded-xl ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-zinc-900 tracking-tight font-mono">
                  {isLoading ? '...' : item.val.toLocaleString()}
                </span>
                {item.sub && (
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{item.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive SVG Line Chart: Daily Visits & Views */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-zinc-900">
                Grafik Kunjungan Harian (Interactive Line Chart)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Tren pergerakan tayangan halaman (Pageviews) dan pengunjung unik (Unique Visitors) per hari.
            </p>
          </div>

          <div className="flex items-center space-x-5 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-1 rounded-full bg-zinc-900" />
              <span className="text-zinc-700 font-semibold">Tayangan (Pageviews)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-1 rounded-full bg-purple-600" />
              <span className="text-zinc-700 font-semibold">Pengunjung Unik</span>
            </div>
          </div>
        </div>

        <div className="pt-6 relative">
          {timeline.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs">
              Belum ada data kunjungan pada rentang waktu yang dipilih.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[680px]">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#18181b" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#18181b" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="visitorsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = padTop + plotHeight * (1 - pct);
                    const labelVal = Math.round(maxViews * 1.15 * pct);
                    return (
                      <g key={idx}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="#e4e4e7"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#a1a1aa"
                          fontFamily="monospace"
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fills */}
                  {viewsAreaPath && <path d={viewsAreaPath} fill="url(#viewsAreaGrad)" />}
                  {visitorsAreaPath && <path d={visitorsAreaPath} fill="url(#visitorsAreaGrad)" />}

                  {/* Lines */}
                  {viewsPath && (
                    <path
                      d={viewsPath}
                      fill="none"
                      stroke="#18181b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {visitorsPath && (
                    <path
                      d={visitorsPath}
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points & Hover Targets */}
                  {timeline.map((point, i) => {
                    const pViews = viewsPoints[i];
                    const pVisitors = visitorsPoints[i];
                    const isHovered = hoveredPointIndex === i;

                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(i)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        {/* Vertical line indicator on hover */}
                        {isHovered && (
                          <line
                            x1={pViews.x}
                            y1={padTop}
                            x2={pViews.x}
                            y2={padTop + plotHeight}
                            stroke="#71717a"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Views Dot */}
                        <circle
                          cx={pViews.x}
                          cy={pViews.y}
                          r={isHovered ? 5 : 3.5}
                          fill="#18181b"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        {/* Visitors Dot */}
                        <circle
                          cx={pVisitors.x}
                          cy={pVisitors.y}
                          r={isHovered ? 5 : 3.5}
                          fill="#9333ea"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        {/* Date Label on X Axis */}
                        <text
                          x={pViews.x}
                          y={padTop + plotHeight + 18}
                          textAnchor="middle"
                          fontSize="10"
                          fill={isHovered ? '#18181b' : '#a1a1aa'}
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          fontFamily="monospace"
                        >
                          {point.date.slice(5)}
                        </text>

                        {/* Hover Overlay Box */}
                        {isHovered && (
                          <g>
                            <rect
                              x={Math.min(Math.max(pViews.x - 70, 10), svgWidth - 150)}
                              y={Math.max(pViews.y - 65, 5)}
                              width="140"
                              height="52"
                              rx="8"
                              fill="#18181b"
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
                            />
                            <text
                              x={Math.min(Math.max(pViews.x, 80), svgWidth - 80)}
                              y={Math.max(pViews.y - 48, 22)}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                            >
                              {point.date}
                            </text>
                            <text
                              x={Math.min(Math.max(pViews.x, 80), svgWidth - 80)}
                              y={Math.max(pViews.y - 32, 38)}
                              textAnchor="middle"
                              fill="#e4e4e7"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {point.views} views • {point.visitors} visitors
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Top Pages (excluding /admin) & Visitor Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Halaman Paling Sering Dikunjungi
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Kunjungan pengunjung pada halaman website publik 1sLabs.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full">
              {displayTopPages.length} Halaman
            </span>
          </div>

          {displayTopPages.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">Belum ada data kunjungan halaman publik.</p>
          ) : (
            <div className="divide-y divide-zinc-100 mt-2">
              {displayTopPages.map((page, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs hover:bg-zinc-50/50 px-2 rounded-xl transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="font-mono font-bold text-zinc-900 truncate">
                      {page.page_path}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {page.page_title || 'Halaman Website 1sLabs'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                      {page.views.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 text-[11px] ml-1.5">views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices & Referrers */}
        <div className="space-y-6">
          {/* Devices Breakdown */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-4">
              Perangkat Pengunjung (Device Breakdown)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['Desktop', 'Mobile', 'Tablet'].map((dev) => {
                const found = data?.devices?.find((d) => d.device.toLowerCase() === dev.toLowerCase());
                const count = found?.count || 0;
                const totalDev = data?.devices?.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const percent = Math.round((count / totalDev) * 100);
                const Icon = dev === 'Desktop' ? Monitor : dev === 'Mobile' ? Smartphone : Laptop;

                return (
                  <div
                    key={dev}
                    className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center"
                  >
                    <Icon className="w-5 h-5 mx-auto text-zinc-600 mb-1" />
                    <p className="text-[11px] text-zinc-500 font-medium">{dev}</p>
                    <p className="text-lg font-bold text-zinc-900 mt-0.5">
                      {percent}%
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{count} hits</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources & Referrers */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-3">
              Sumber Lalu Lintas (Referrers)
            </h3>
            {!data?.referrers || data.referrers.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Belum ada data referrer eksternal.</p>
            ) : (
              <div className="space-y-2">
                {data.referrers.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-700 truncate max-w-[240px] font-medium">
                      {ref.source}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                      {ref.count} hits
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Recent Visitor Events Feed (Excluding /admin) */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Aktivitas Pengunjung Terbaru (Live Stream)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Aktivitas publik real-time</span>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {displayRecentEvents.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">Belum ada log aktivitas live pengunjung.</p>
          ) : (
            displayRecentEvents.map((evt: any) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs gap-3 hover:bg-zinc-50/50 px-2 rounded-xl transition-colors">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                      evt.event_type === 'click'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                    }`}
                  >
                    {evt.event_type}
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-zinc-900 truncate">
                      {evt.page_path}
                    </span>
                    {evt.element_text && (
                      <span className="text-zinc-500 text-[11px] ml-1.5 truncate">
                        &quot;{evt.element_text}&quot;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono shrink-0">
                  <span>{evt.browser} / {evt.device}</span>
                  <span>{new Date(evt.created_at).toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
