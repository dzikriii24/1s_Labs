import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  Mail,
  Award,
  RefreshCw,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api, MarketingStatsResponse } from '../../../../services/api';

export const MarketingAnalyticsTab: React.FC = () => {
  const [data, setData] = useState<MarketingStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.marketing.getStats()
      .then(res => {
        if (res.success) setData(res);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs font-mono bg-white border border-zinc-200 rounded-2xl shadow-xs">
        <RefreshCw className="w-7 h-7 animate-spin text-zinc-900 mx-auto mb-2" />
        Memuat analitik performa marketing...
      </div>
    );
  }

  const { stats, charts } = data;
  const deliveryRate = stats.total_sent > 0 ? (((stats.total_sent - stats.total_failed) / stats.total_sent) * 100).toFixed(1) : '100';
  const responseRate = stats.total_sent > 0 ? ((stats.total_responded / stats.total_sent) * 100).toFixed(1) : '0';
  const interestedRate = stats.total_responded > 0 ? ((stats.total_interested / stats.total_responded) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Marketing Analytics & Reports
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Laporan komprehensif perkembangan database prospek, performa email outreach, dan rasio konversi prospek menjadi klien 1sLabs.
            </p>
          </div>
        </div>
      </div>

      {/* Ratios & KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-zinc-500 uppercase font-semibold">Email Delivery Rate</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">{deliveryRate}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">{stats.total_sent - stats.total_failed} email delivered</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-zinc-500 uppercase font-semibold">Response Rate</div>
          <div className="text-2xl font-bold text-blue-600 font-mono mt-1">{responseRate}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">{stats.total_responded} balasan diterima</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-zinc-500 uppercase font-semibold">Interest Conversion</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{interestedRate}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">{stats.total_interested} prospek positif</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-zinc-500 uppercase font-semibold">Total Deals Converted</div>
          <div className="text-2xl font-bold text-zinc-900 font-mono mt-1">{stats.total_converted}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Klien aktif 1sLabs</div>
        </div>
      </div>

      {/* Discovery by Source & Sector breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" /> Pengumpulan Data Berdasarkan Sumber
          </h4>
          <div className="space-y-2">
            {charts.bySource.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada data sumber.</p>
            ) : (
              charts.bySource.map(s => (
                <div key={s.source} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-800">{s.source || 'Public Directory'}</span>
                  <span className="font-mono text-zinc-900 font-bold">{s.count.toLocaleString()} entitas</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-700" /> Sektor & Industri Terbanyak
          </h4>
          <div className="space-y-2">
            {charts.bySector.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada data sektor.</p>
            ) : (
              charts.bySector.map(s => (
                <div key={s.sector} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-800">{s.sector}</span>
                  <span className="font-mono text-zinc-900 font-bold">{s.count.toLocaleString()} prospek</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
