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
  Send,
  CalendarCheck,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  Globe,
  Search,
  Check,
  XCircle,
  AlertTriangle,
  Layers,
  MapPin,
  Ban
} from 'lucide-react';
import { api } from '../../../../services/api';

interface LeadDashboardTabProps {
  onNavigateSubtab: (subtab: string) => void;
  onOpenCompanyDetail?: (company: any) => void;
}

export const LeadDashboardTab: React.FC<LeadDashboardTabProps> = ({
  onNavigateSubtab,
  onOpenCompanyDetail
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getLeadDashboard();
      if (res && res.success) {
        setData(res);
      } else {
        // Fallback to general stats if lead-dashboard endpoint isn't loaded yet
        const statsRes = await api.marketing.getStats();
        if (statsRes && statsRes.success) {
          setData({
            stats: {
              total_companies: statsRes.stats.total_prospects || 0,
              total_umkm: statsRes.stats.total_umkm || 0,
              total_corporate: statsRes.stats.total_companies || 0,
              new_today: statsRes.stats.new_today || 0,
              emails_found: statsRes.stats.with_email_count || 0,
              emails_verified: statsRes.stats.verified_count || 0,
              emails_unverified: Math.max(0, (statsRes.stats.with_email_count || 0) - (statsRes.stats.verified_count || 0)),
              emails_invalid: 0,
              emails_no_email: Math.max(0, (statsRes.stats.total_prospects || 0) - (statsRes.stats.with_email_count || 0)),
              contact_ready: statsRes.stats.outreach_eligible_count || 0,
              emails_sent: statsRes.stats.total_sent || 0,
              replies_received: statsRes.stats.total_responded || 0,
              do_not_contact: 0
            },
            quota: statsRes.quota,
            byProvince: statsRes.charts?.byProvince || [],
            byCategory: statsRes.charts?.bySector || [],
            bySource: statsRes.charts?.bySource || [],
            recentJobs: []
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat statistik lead acquisition.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-500 bg-white border border-zinc-200 rounded-3xl shadow-xs">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-900 mb-3" />
        <p className="text-xs font-mono font-medium text-zinc-600">Memuat Lead Acquisition Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <p className="text-xs font-medium">{error || 'Data dashboard tidak tersedia.'}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-xs font-semibold rounded-xl text-rose-800 transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { stats, quota, byProvince, byCategory, bySource, recentJobs } = data;
  const quotaPercent = Math.min(100, Math.round(((quota?.sent_count || 0) / (quota?.max_limit || 100)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Action & Daily Quota Guard */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                1sLabs Business Lead Acquisition Engine
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                Production Ready
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Ringkasan Akuisisi Prospek Bisnis & UMKM Indonesia
            </h2>
            <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
              Pengumpulan data bisnis terverifikasi dari sumber publik legal (OpenStreetMap, Satu Data Indonesia, Direktori Bisnis) dengan verifikasi DNS MX record dan pengiriman outreach B2B 1sLabs terkontrol.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateSubtab('discovery')}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jalankan Lead Discovery</span>
            </button>
            <button
              onClick={() => onNavigateSubtab('email-discovery')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-200" />
              <span>Email Discovery (DNS MX)</span>
            </button>
            <button
              onClick={fetchDashboard}
              title="Refresh Data"
              className="p-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Quota Guard Progress Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </span>
            <div>
              <div className="text-xs font-bold text-zinc-900">
                Safe Daily Outreach Quota: {quota?.sent_count || 0} / {quota?.max_limit || 100} email terkirim hari ini
              </div>
              <div className="text-[11px] text-zinc-500">
                Sisa kuota aman hari ini: <span className="font-mono font-bold text-emerald-600">{quota?.remaining_quota || 100} email</span> (Relay Brevo SMTP)
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaPercent >= 90 ? 'bg-rose-500' : quotaPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (13 Required Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Bisnis Tersimpan */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Total Bisnis Tersimpan
            </span>
            <Building2 className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 font-mono">
            {(stats.total_companies || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-zinc-700">{stats.total_corporate || 0}</span> Perusahaan &bull;{' '}
            <span className="font-semibold text-zinc-700">{stats.total_umkm || 0}</span> UMKM
          </div>
        </div>

        {/* 2. Data Baru Hari Ini */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Data Baru Hari Ini
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            +{(stats.new_today || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Ditambahkan ke database 1sLabs
          </div>
        </div>

        {/* 3. Total Email Ditemukan */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Email Bisnis Ditemukan
            </span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">
            {(stats.emails_found || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Dari website resmi & direktori
          </div>
        </div>

        {/* 4. Email Valid (DNS MX Record) */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Email Valid (MX Record)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {(stats.emails_verified || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">
            Lolos uji teknis DNS Mail Server
          </div>
        </div>

        {/* 5. Email Belum Diverifikasi */}
        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Belum Diverifikasi
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {(stats.emails_unverified || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1">
            Menunggu pengecekan DNS MX
          </div>
        </div>

        {/* 6. Email Tidak Valid */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Email Tidak Valid
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">
            {(stats.emails_invalid || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Sintaks rusak / NXDOMAIN
          </div>
        </div>

        {/* 7. Prospek Siap Dihubungi */}
        <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Siap Dihubungi
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            {(stats.contact_ready || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-1 font-medium">
            Status QUALIFIED / READY
          </div>
        </div>

        {/* 8. Email Sudah Dikirim */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Outreach Terkirim
            </span>
            <Send className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 font-mono">
            {(stats.emails_sent || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Total email penawaran terkirim
          </div>
        </div>

        {/* 9. Balasan Diterima */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Respons / Balasan
            </span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {(stats.replies_received || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Balasan masuk ke webmail 1sLabs
          </div>
        </div>

        {/* 10. Do Not Contact / Unsubscribe */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500">
              Do Not Contact
            </span>
            <Ban className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-600 font-mono">
            {(stats.do_not_contact || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            Ditekan secara ketat (Opt-out)
          </div>
        </div>
      </div>

      {/* Distribution Statistics Grid: Province, Category, and Data Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Statistik Berdasarkan Wilayah / Provinsi */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Statistik Wilayah (Provinsi)</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Top Wilayah</span>
            </div>

            <div className="space-y-3">
              {byProvince && byProvince.length > 0 ? (
                byProvince.map((item: any, idx: number) => {
                  const maxCount = byProvince[0]?.count || 1;
                  const pct = Math.min(100, Math.round((item.count / maxCount) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 truncate max-w-[180px]">
                          {item.province || 'Lainnya'}
                        </span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="font-bold text-zinc-900">{item.count}</span>
                          {item.verified_emails !== undefined && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                              {item.verified_emails} valid
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-zinc-800 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-400">Belum ada data wilayah tersimpan.</div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Target Wilayah: 38 Provinsi Indonesia</span>
            <button
              onClick={() => onNavigateSubtab('companies')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Lihat Database <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Statistik Berdasarkan Kategori Bisnis */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Kategori Bisnis & Industri</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Sektor</span>
            </div>

            <div className="space-y-3">
              {byCategory && byCategory.length > 0 ? (
                byCategory.map((item: any, idx: number) => {
                  const maxCount = byCategory[0]?.count || 1;
                  const pct = Math.min(100, Math.round((item.count / maxCount) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 truncate max-w-[180px]">
                          {item.category || item.sector || 'Lainnya'}
                        </span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="font-bold text-zinc-900">{item.count}</span>
                          {item.verified_emails !== undefined && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                              {item.verified_emails} email
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-400">Belum ada kategori tersimpan.</div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Kebutuhan: Web, App, ERP, Maintenance</span>
            <button
              onClick={() => onNavigateSubtab('discovery')}
              className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Cari Sektor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Statistik Berdasarkan Sumber Data */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Sumber Data (Lead Sources)</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Legal Sources</span>
            </div>

            <div className="space-y-3">
              {bySource && bySource.length > 0 ? (
                bySource.map((item: any, idx: number) => {
                  const maxCount = bySource[0]?.count || 1;
                  const pct = Math.min(100, Math.round((item.count / maxCount) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 truncate max-w-[180px]">
                          {item.source || 'Direct Discovery'}
                        </span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="font-bold text-zinc-900">{item.count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-400">Belum ada sumber data.</div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>OSM, Satu Data, PaDi UMKM, Crawler</span>
            <button
              onClick={() => onNavigateSubtab('discovery')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Kelola Sumber <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Discovery Activity Logs */}
      {recentJobs && recentJobs.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Riwayat Pekerjaan Pengumpulan Terkini</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Status eksekusi batch pengumpulan data prospek bisnis dari adapter sumber data.
              </p>
            </div>
            <button
              onClick={() => onNavigateSubtab('discovery')}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Mulai Job Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-600 border-y border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Job ID</th>
                  <th className="py-2.5 px-3 font-semibold">Sumber</th>
                  <th className="py-2.5 px-3 font-semibold">Target Wilayah / Sektor</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Ditemukan</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Disimpan</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Duplikat</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Waktu Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentJobs.map((j: any) => (
                  <tr key={j.id} className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-900">#{j.id}</td>
                    <td className="py-2.5 px-3 font-medium text-zinc-800">{j.source_name || 'Generic Source'}</td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      {j.target_province || 'Semua Wilayah'} &bull; {j.target_sector || 'Semua Sektor'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-zinc-700">
                      {j.records_found || 0}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                      {j.records_saved || 0}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-600">
                      {j.records_duplicate || 0}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          j.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : j.status === 'running'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : j.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                      {j.completed_at ? new Date(j.completed_at).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

