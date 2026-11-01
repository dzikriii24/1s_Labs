import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  TrendingUp,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  Send,
  CalendarCheck,
  Award,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  Globe
} from 'lucide-react';
import { api, MarketingStatsResponse, MarketingCompany, MarketingAiLog } from '../../../../services/api';

interface MarketingOverviewTabProps {
  onNavigateSubtab: (subtab: string) => void;
  onOpenCompanyDetail: (company: MarketingCompany) => void;
}

export const MarketingOverviewTab: React.FC<MarketingOverviewTabProps> = ({
  onNavigateSubtab,
  onOpenCompanyDetail
}) => {
  const [data, setData] = useState<MarketingStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getStats();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat statistik marketing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-500 bg-white border border-zinc-200 rounded-2xl shadow-xs">
        <RefreshCw className="w-7 h-7 animate-spin text-zinc-900 mb-3" />
        <p className="text-xs font-mono font-medium text-zinc-600">Memuat Marketing Intelligence Overview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <p className="text-xs font-medium">{error || 'Data statistik tidak tersedia.'}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-xs font-semibold rounded-xl text-rose-800 transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { stats, quota, todaysDiscovery, aiActivities, charts } = data;
  const quotaPercent = Math.min(100, Math.round((quota.sent_count / quota.max_limit) * 100));

  return (
    <div className="space-y-6">
      {/* Top Card: Daily Email Quota & Guardrail */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                Daily Email Quota (Asia/Jakarta)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-mono font-semibold">
                Batas 100 / Hari
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {quota.sent_count} <span className="text-zinc-500 text-lg font-normal">/ {quota.max_limit} email terkirim hari ini</span>
            </h2>
            <p className="text-xs text-zinc-500 max-w-2xl">
              Sisa kuota pengiriman hari ini: <strong className="text-zinc-900 font-mono text-sm">{quota.remaining_quota}</strong> email. Sistem automasi 1sLabs membatasi pengiriman agar reputasi domain dan deliverability tetap prima.
            </p>
          </div>

          <div className="lg:w-80 space-y-2 p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-600">Penggunaan Kuota</span>
              <span className="font-bold text-zinc-900">{quotaPercent}%</span>
            </div>
            <div className="w-full bg-zinc-200/70 h-2 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
              <span>Maksimal 100/hari</span>
              <span>{quota.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 1: Database & Discovery KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-zinc-700" /> Database & Discovery Intelligence
          </h3>
          <button
            onClick={() => onNavigateSubtab('prospects')}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-1"
          >
            Buka Database <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Total Prospek</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{stats.total_prospects.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Seluruh Indonesia</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Total UMKM</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.total_umkm.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Usaha Mikro & Kecil</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Total Perusahaan</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.total_companies.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">PT, CV, Distributor</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Baru Hari Ini</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
              {stats.new_today}
              {stats.new_today > 0 && <span className="text-xs text-emerald-600 font-mono font-semibold">+new</span>}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">{stats.new_this_week} minggu ini</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Punya Email Bisnis</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{stats.with_email_count.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Siap dijangkau</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all">
            <div className="text-[11px] font-medium text-zinc-500">Outreach Eligible</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.outreach_eligible_count.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Lolos verifikasi hukum</div>
          </div>
        </div>
      </div>

      {/* Grid 2: Campaign & Conversion Funnel KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-zinc-700" /> Performa Outreach & Conversion Funnel
          </h3>
          <button
            onClick={() => onNavigateSubtab('campaigns')}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-1"
          >
            Kelola Campaign <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Email Terkirim</div>
            <div className="text-xl font-bold text-zinc-900 mt-1">{stats.total_sent.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">{stats.total_failed} gagal</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Email Dibalas</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{stats.total_responded}</div>
            <div className="text-[11px] text-zinc-400 mt-1 font-mono">
              {stats.total_sent > 0 ? ((stats.total_responded / stats.total_sent) * 100).toFixed(1) : 0}% rate
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Prospek Tertarik</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{stats.total_interested}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Minat layanan 1sLabs</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Konsultasi Dijadwalkan</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats.total_consultations}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Online VMeet</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Menjadi Pelanggan</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{stats.total_converted}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Closed deals</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Terkirim Hari Ini</div>
            <div className="text-xl font-bold text-zinc-900 mt-1">{stats.emails_sent_today}</div>
            <div className="text-[11px] text-zinc-400 mt-1">dari 100 kuota</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
            <div className="text-[11px] font-medium text-zinc-500">Sisa Kuota Hari Ini</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{stats.remaining_quota_today}</div>
            <div className="text-[11px] text-zinc-400 mt-1">Slot tersedia</div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Today's Discovery & AI Research Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Today's Discovery */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Today's Discovery</h4>
                  <p className="text-[11px] text-zinc-500">Entitas bisnis yang baru ditemukan hari ini</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono font-medium border border-zinc-200">
                {todaysDiscovery.length} baru
              </span>
            </div>

            {todaysDiscovery.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Belum ada bisnis baru yang ditemukan hari ini.
                <div className="mt-3">
                  <button
                    onClick={() => onNavigateSubtab('sources')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Jalankan Scraper Sekarang
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysDiscovery.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => onOpenCompanyDetail(company)}
                    className="p-3 bg-zinc-50/70 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 group-hover:text-emerald-600 transition truncate">
                          {company.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-zinc-600 border border-zinc-200">
                          {company.category}
                        </span>
                        {company.lead_score >= 80 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5 font-medium">
                            <Flame className="w-3 h-3 text-rose-500" /> Hot Lead
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-1 truncate">
                        <span>{company.city || company.province || 'Indonesia'}</span>
                        {company.industry && <span>• {company.industry}</span>}
                        {company.email && <span className="font-mono text-zinc-600">• {company.email}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-zinc-400">Score</div>
                        <div className="text-xs font-bold text-zinc-900 font-mono">{company.lead_score}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-100 flex justify-end">
            <button
              onClick={() => onNavigateSubtab('prospects')}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua Database Prospek <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Widget 2: AI Research Activity */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">AI Research Activity</h4>
                  <p className="text-[11px] text-zinc-500">Aktivitas real-time agen riset Gemini AI</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
                Agent Active
              </span>
            </div>

            {aiActivities.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Belum ada riwayat aktivitas AI Agent.
              </div>
            ) : (
              <div className="space-y-2">
                {aiActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-zinc-50/70 border border-zinc-200 rounded-xl flex items-start gap-3"
                  >
                    <div className="p-1.5 bg-white text-emerald-600 rounded-lg border border-zinc-200 mt-0.5 shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900 capitalize">
                          {act.purpose.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {act.latency_ms}ms • {new Date(act.created_at).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-0.5 truncate">
                        {act.input_snapshot ? act.input_snapshot.slice(0, 110) : 'Analisis profil bisnis & kebutuhan digital'}...
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                        <span>Model: {act.model}</span>
                        <span>• Status: <strong className="text-emerald-600 font-semibold">{act.status}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-zinc-100 flex justify-end">
            <button
              onClick={() => onNavigateSubtab('ai-agent')}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Buka AI Research Agent Console <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Distribution Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Table */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs lg:col-span-1">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-900">Marketing Conversion Funnel</h4>
            <p className="text-[11px] text-zinc-500">Perjalanan prospek dari discovery hingga menjadi pelanggan</p>
          </div>
          <div className="space-y-2.5">
            {charts.funnel.map((item, index) => {
              const maxVal = Math.max(...charts.funnel.map(f => f.count), 1);
              const pct = Math.round((item.count / maxVal) * 100);
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-700 font-medium">{index + 1}. {item.stage}</span>
                    <span className="text-zinc-900 font-mono font-bold">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/60">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Sektor Distribution */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs lg:col-span-1">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-900">Distribusi Sektor Bisnis</h4>
            <p className="text-[11px] text-zinc-500">Top 5 sektor industri prospek yang terdata</p>
          </div>
          <div className="space-y-2">
            {charts.bySector.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada data sektor.</p>
            ) : (
              charts.bySector.map((s) => (
                <div key={s.sector} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-800 font-medium truncate max-w-[180px]">{s.sector}</span>
                  <span className="font-mono text-zinc-900 font-bold">{s.count} prospek</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Provinsi Distribution */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs lg:col-span-1">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-900">Distribusi Wilayah & Provinsi</h4>
            <p className="text-[11px] text-zinc-500">Sebaran letak geografis bisnis di Indonesia</p>
          </div>
          <div className="space-y-2">
            {charts.byProvince.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Belum ada data wilayah.</p>
            ) : (
              charts.byProvince.map((p) => (
                <div key={p.province} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-800 font-medium truncate max-w-[180px]">{p.province}</span>
                  <span className="font-mono text-zinc-900 font-bold">{p.count} bisnis</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
