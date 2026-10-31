import React, { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Receipt,
  Globe,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api, AdminStats, ServerMonitoringData } from '../../../services/api';
import { AdminMenuKey } from '../AdminSidebar';

interface OverviewDashboardViewProps {
  stats?: AdminStats | null;
  monitoring?: ServerMonitoringData | null;
  onNavigate?: (menu: AdminMenuKey | string) => void;
  isLoading?: boolean;
}

export const OverviewDashboardView: React.FC<OverviewDashboardViewProps> = ({
  stats: propStats,
  monitoring: propMonitoring,
  onNavigate,
  isLoading: propLoading
}) => {
  const [stats, setStats] = useState<AdminStats | null>(propStats || null);
  const [monitoring, setMonitoring] = useState<ServerMonitoringData | null>(propMonitoring || null);
  const [loading, setLoading] = useState<boolean>(propLoading ?? false);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [statsRes, monRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getServerMonitoring()
      ]);
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (monRes.success && monRes.data) {
        setMonitoring(monRes.data);
      }
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propStats || !propMonitoring) {
      fetchOverviewData();
    }
  }, []);

  const handleNav = (menu: AdminMenuKey | string) => {
    if (onNavigate) {
      onNavigate(menu);
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const statCards = [
    {
      title: 'Total Pelanggan',
      value: stats?.totalCustomers ?? 0,
      subtext: 'Akun pelanggan aktif',
      icon: Users,
      menuKey: 'customers' as AdminMenuKey,
      color: 'text-blue-500'
    },
    {
      title: 'Pendapatan Diterima',
      value: formatIDR(stats?.totalRevenue ?? 0),
      subtext: `Bulan ini: ${formatIDR(stats?.monthlyRevenue ?? 0)}`,
      icon: TrendingUp,
      menuKey: 'revenue' as AdminMenuKey,
      color: 'text-emerald-500'
    },
    {
      title: 'Layanan Hosting Aktif',
      value: stats?.activeServices ?? 0,
      subtext: `${stats?.expiringServices ?? 0} layanan aktif`,
      icon: Layers,
      menuKey: 'customer-services' as AdminMenuKey,
      color: 'text-purple-500'
    },
    {
      title: 'Verifikasi Menunggu',
      value: stats?.pendingPayments ?? 0,
      subtext: 'Pembayaran QRIS tertunda',
      icon: Receipt,
      menuKey: 'transactions' as AdminMenuKey,
      color: 'text-amber-500',
      highlight: (stats?.pendingPayments ?? 0) > 0
    }
  ];

  // Helper values for gauges
  const cpuPercent =
    monitoring?.resources?.cpu?.used ??
    (monitoring as any)?.resources?.cpu?.percent ??
    0;

  const memUsedMb =
    monitoring?.resources?.memory?.used_mb ??
    (monitoring as any)?.resources?.memory?.used ??
    128;
  const memLimitMb =
    monitoring?.resources?.memory?.limit_mb ??
    (monitoring as any)?.resources?.memory?.maximum ??
    1024;
  const memPercent = Math.min(100, Math.round((memUsedMb / (memLimitMb || 1024)) * 100));

  const procsUsed =
    monitoring?.resources?.processes?.used ??
    (monitoring as any)?.resources?.numberProcesses?.usage ??
    24;
  const procsLimit =
    monitoring?.resources?.processes?.limit ??
    (monitoring as any)?.resources?.numberProcesses?.maximum ??
    100;
  const procsPercent = Math.min(100, Math.round((procsUsed / (procsLimit || 100)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Welcome & Server Pulse */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              1sLabs Management Center
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1">
            Ringkasan Operasional & Bisnis
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pusat kendali operasional hosting, pelanggan, server cloud, dan arus keuangan 1sLabs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleNav('transactions')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Verifikasi Pembayaran</span>
            {stats && stats.pendingPayments > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {stats.pendingPayments}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => handleNav(card.menuKey)}
              className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer hover:border-zinc-300 shadow-xs hover:shadow-sm group ${
                card.highlight
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl bg-zinc-100 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
                  {loading ? '...' : card.value}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
                  <span>{card.subtext}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Quick Server Health & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Real-time Health Gauge Card */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-zinc-700" />
                <h3 className="font-bold text-xs text-zinc-900">Status Server Cloud</h3>
              </div>
              <button
                onClick={() => handleNav('server-monitoring')}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 inline-flex items-center space-x-1"
              >
                <span>Detail</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* CPU Usage Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500 font-medium">CPU Usage</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {cpuPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cpuPercent > 85 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, cpuPercent)}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500 font-medium">Physical Memory</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {memPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      memPercent > 85 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${memPercent}%` }}
                  />
                </div>
              </div>

              {/* Number of Processes */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500 font-medium">Processes (nproc)</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {procsUsed} / {procsLimit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${procsPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Uptime:</span>
            <span className="truncate max-w-[160px] text-right font-medium text-zinc-700">
              {monitoring?.server?.uptime || 'Active'}
            </span>
          </div>
        </div>

        {/* Pending Verification Payments & Recent Actions */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-zinc-700" />
                <h3 className="font-bold text-xs text-zinc-900">
                  Pembayaran Menunggu Verifikasi
                </h3>
              </div>
              <button
                onClick={() => handleNav('transactions')}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 inline-flex items-center space-x-1"
              >
                <span>Semua Transaksi</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="py-2">
              {!stats?.recentPendingPayments || stats.recentPendingPayments.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-zinc-800">Tidak Ada Pembayaran Tertunda</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Semua bukti transfer QRIS pelanggan telah terverifikasi lunas.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {stats.recentPendingPayments.map((p: any) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {p.customer_name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {p.payment_number} &bull; Order #{p.order_number}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-mono text-zinc-900">
                          {formatIDR(p.amount)}
                        </p>
                        <button
                          onClick={() => handleNav('transactions')}
                          className="mt-1 px-3 py-1 rounded-lg bg-zinc-900 text-white text-[10px] font-bold hover:bg-zinc-800 cursor-pointer"
                        >
                          Periksa Bukti
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px]">
              Verifikasi cepat memicu aktivasi instan addon domain & database server cPanel.
            </span>
            <button
              onClick={() => handleNav('invoices')}
              className="text-xs font-semibold text-zinc-900 hover:underline shrink-0"
            >
              Kelola Faktur Invoice &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Operational Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Analitik Pengunjung', desc: 'Real-time live hits & traffic', menu: 'analytics' as AdminMenuKey, icon: Activity },
          { label: 'Manajemen Domain', desc: 'DNS & status sertifikat SSL', menu: 'domains' as AdminMenuKey, icon: Globe },
          { label: 'Buat Invoice Baru', desc: 'Generator tagihan multi-layanan', menu: 'invoices' as AdminMenuKey, icon: Receipt },
          { label: 'Kustomisasi Email', desc: 'Editor template & preview HTML', menu: 'email-templates' as AdminMenuKey, icon: ShieldCheck }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleNav(item.menu)}
              className="p-4 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xs transition-all text-left group shadow-xs cursor-pointer"
            >
              <Icon className="w-5 h-5 text-zinc-700 group-hover:scale-110 transition-transform mb-2" />
              <p className="text-xs font-bold text-zinc-900">{item.label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
