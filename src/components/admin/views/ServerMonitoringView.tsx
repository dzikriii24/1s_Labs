import React, { useEffect, useState } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  Zap,
  Sliders,
  History,
  Database,
  Eye,
  Check,
  X,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Info
} from 'lucide-react';
import { api, ServerMonitoringData } from '../../../services/api';
import notify from '../../../lib/notify';

interface ServerMonitoringViewProps {
  onNavigate?: (tab: string) => void;
}

export const ServerMonitoringView: React.FC<ServerMonitoringViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<ServerMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  // Modals state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [showDbModal, setShowDbModal] = useState(false);
  const [dbAuditData, setDbAuditData] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  const [optResult, setOptResult] = useState<any>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getServerMonitoring();
      if (res.success) {
        const payload = (res as any).data || res;
        setData(payload);
        if (payload.adaptive?.settings) {
          setDryRun(Boolean(payload.adaptive.settings.dry_run_mode));
          setManualOverride(Boolean(payload.adaptive.settings.manual_override));
        }
      }
    } catch (err) {
      console.error('Failed to load server metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRunOptimization = async (isDryRunOption = dryRun) => {
    setOptimizing(true);
    try {
      const res = await api.admin.runOptimization(isDryRunOption);
      if (res.success) {
        setOptResult(res.result || res);
        notify.success(
          isDryRunOption
            ? '[Dry-Run] Simulasi optimasi berhasil dieksekusi.'
            : 'Optimasi adaptif berhasil diterapkan ke server.'
        );
        await fetchMetrics();
      } else {
        notify.error(res.message || 'Gagal menjalankan optimasi server.');
      }
    } catch (err: any) {
      notify.error(err.message || 'Terjadi kesalahan saat mengeksekusi optimasi.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      const res = await api.admin.updateOptimizationSettings({ [key]: value });
      if (res.success) {
        notify.success(res.message || 'Pengaturan berhasil diperbarui.');
        if (key === 'dry_run_mode') setDryRun(value);
        if (key === 'manual_override') setManualOverride(value);
        await fetchMetrics();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  const openLogsModal = async () => {
    setShowLogsModal(true);
    setLoadingLogs(true);
    try {
      const res = await api.admin.getOptimizationLogs();
      if (res.success && res.logs) {
        setOptimizationLogs(res.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const openDbAuditModal = async () => {
    setShowDbModal(true);
    setLoadingDb(true);
    try {
      const res = await api.admin.getDatabaseAudit();
      if (res.success && res.audit) {
        setDbAuditData(res.audit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDb(false);
    }
  };

  const getMetricPercent = (used: number, limit: number) => {
    if (!limit || limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  // 5-Tier Adaptive Level Details
  const adaptiveStatus = data?.adaptive?.status || {
    badge: 'optimal',
    level: 'level_1_normal',
    dominantPct: 0,
    hysteresisActive: false
  };

  const getStatusBadgeConfig = (badge: string) => {
    switch (badge) {
      case 'emergency':
        return {
          title: 'Level 5 – Emergency (95–100%)',
          sub: 'Resource Protection Mode aktif. Background task dibekukan, layanan inti dijaga ketat.',
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-600',
          pill: 'bg-rose-100 text-rose-800'
        };
      case 'critical':
        return {
          title: 'Level 4 – Critical (90–94%)',
          sub: 'Emergency Resource Protection. Pruning worker idle dan pembatasan background queue.',
          bg: 'bg-red-50 border-red-200 text-red-700',
          dot: 'bg-red-600',
          pill: 'bg-red-100 text-red-800'
        };
      case 'high_usage':
        return {
          title: 'Level 3 – High Usage (80–89%)',
          sub: 'Adaptive Optimization aktif. Concurrency dibatasi, worker duplikat idle di-recycle.',
          bg: 'bg-orange-50 border-orange-200 text-orange-700',
          dot: 'bg-orange-500',
          pill: 'bg-orange-100 text-orange-800'
        };
      case 'warning':
        return {
          title: 'Level 2 – Warning (70–79%)',
          sub: 'Preventive Warning. Identifikasi proses tinggi, pembersihan temporary cache.',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          pill: 'bg-amber-100 text-amber-800'
        };
      case 'optimal':
      default:
        return {
          title: 'Level 1 – Normal (0–69%)',
          sub: 'Sistem stabil. Seluruh layanan berjalan optimal dengan pemantauan berkala.',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
          pill: 'bg-emerald-100 text-emerald-800'
        };
    }
  };

  const badgeConfig = getStatusBadgeConfig(adaptiveStatus.badge);

  const getGaugeColor = (pct: number) => {
    if (pct >= 95) return 'bg-rose-600';
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 80) return 'bg-orange-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Intelligent Resource Management & CloudLinux LVE
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Monitoring multi-level adaptif real-time, perlindungan batas CloudLinux LVE, dan otomasi pencegahan overload.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleRunOptimization(dryRun)}
            disabled={optimizing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Jalankan optimasi sesuai level saat ini"
          >
            {optimizing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-purple-200" />
            )}
            <span>Jalankan Optimasi {dryRun ? '(Dry-Run)' : 'Adaptif'}</span>
          </button>

          <button
            onClick={openLogsModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
            title="Riwayat tindakan optimasi"
          >
            <History className="w-3.5 h-3.5 text-zinc-500" />
            <span>Riwayat Log</span>
          </button>

          <button
            onClick={openDbAuditModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
            title="Audit koneksi & database MySQL"
          >
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span>Audit MySQL</span>
          </button>

          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl font-medium">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              Auto (15s)
            </label>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Refresh metrik"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Adaptive Status & Emergency Protection Banner */}
      <div className={`p-5 rounded-3xl border ${badgeConfig.bg} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300`}>
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white/80 border border-white/60 shadow-xs flex-shrink-0">
            {adaptiveStatus.badge === 'emergency' || adaptiveStatus.badge === 'critical' ? (
              <ShieldAlert className="w-6 h-6 text-rose-600 animate-bounce" />
            ) : adaptiveStatus.badge === 'high_usage' ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-zinc-900">{badgeConfig.title}</h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeConfig.pill}`}>
                {adaptiveStatus.badge.replace('_', ' ')}
              </span>
              {adaptiveStatus.hysteresisActive && (
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Hysteresis Cooldown: {adaptiveStatus.cooldownRemainingSec || 0}s
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              {badgeConfig.sub} Utilisasi dominan saat ini:{' '}
              <strong className="font-mono font-bold text-zinc-900">{adaptiveStatus.dominantPct}%</strong>.
            </p>
          </div>
        </div>

        {/* Protection Mode Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-white/60 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => handleToggleSetting('dry_run_mode', e.target.checked)}
              className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Dry-Run Mode</span>
            <Info className="w-3.5 h-3.5 text-zinc-400" title="Simulasikan optimasi tanpa mematikan proses nyata" />
          </label>

          <span className="text-zinc-300">|</span>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={manualOverride}
              onChange={(e) => handleToggleSetting('manual_override', e.target.checked)}
              className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
            />
            <span className={manualOverride ? 'text-amber-700 font-bold' : ''}>Manual Override</span>
            <Info className="w-3.5 h-3.5 text-zinc-400" title="Nonaktifkan pruning otomatis agar kontrol penuh ada di tangan admin" />
          </label>
        </div>
      </div>

      {/* Server Health Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Hostname Server</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Active
            </span>
          </div>
          <div className="text-base font-bold font-mono text-zinc-900 mt-2 truncate">
            {data?.server?.hostname || '1slabs.my.id'}
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">
            IP: {data?.server?.serverIp || data?.server?.ip || '103.119.237.132'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Server Uptime</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-bold font-mono text-zinc-900 mt-2">
            {data?.server?.uptime || 'Active'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Uptime operasional hosting</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Operating System</span>
            <Server className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-zinc-900 mt-2 truncate">
            {data?.server?.os || 'CloudLinux x86_64'}
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">
            cPanel {data?.server?.cpanel_version || 'v124'} &bull; LiteSpeed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Prediksi Tren Resource</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-bold font-mono text-zinc-900 mt-2 flex items-center gap-2">
            <span>{data?.adaptive?.prediction?.trend || 'Stable'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              data?.adaptive?.prediction?.risk === 'High'
                ? 'bg-red-100 text-red-700'
                : data?.adaptive?.prediction?.risk === 'Moderate'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {data?.adaptive?.prediction?.risk || 'Low'} Risk
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">
            Load: {data?.server?.load_average || '0.18, 0.22, 0.26'}
          </div>
        </div>
      </div>

      {/* Main CloudLinux LVE Resource Gauges */}
      <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Alokasi & Kuota CloudLinux LVE Aktual
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Metrik aktual dari UAPI cPanel & CloudLinux LVE. Ambang batas adaptif: Warning 70%, High 80%, Critical 90%, Emergency 95%.
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('resource-usage')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <span>Inspeksi Proses Aktif & Pruning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* CPU Usage */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" /> Utilisasi CPU
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.cpu?.used ?? 0}% / {data?.resources?.cpu?.limit ?? 100}%
              </span>
            </div>
            {(() => {
              const pct = data?.resources?.cpu?.used ?? 0;
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(pct)}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Status: {pct >= 90 ? 'Critical' : pct >= 70 ? 'Elevated' : 'Normal'}</span>
                    <span>Limit CloudLinux: 100%</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Physical RAM */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-600" /> Physical RAM (1 GB)
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.memory?.used_formatted || `${data?.resources?.memory?.used_mb || 0} MB`} /{' '}
                {data?.resources?.memory?.limit_formatted || `${data?.resources?.memory?.limit_mb || 1024} MB`}
              </span>
            </div>
            {(() => {
              const pct = getMetricPercent(
                data?.resources?.memory?.used_mb || 0,
                data?.resources?.memory?.limit_mb || 1024
              );
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Penggunaan: {pct}%</span>
                    <span>Alokasi Maks: 1.00 GB</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Entry Processes (EP) */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Entry Processes (EP)
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.entry_processes?.used ?? data?.resources?.entryProcesses?.used ?? 0} /{' '}
                {data?.resources?.entry_processes?.limit ?? data?.resources?.entryProcesses?.limit ?? 12}
              </span>
            </div>
            {(() => {
              const used = data?.resources?.entry_processes?.used ?? data?.resources?.entryProcesses?.used ?? 0;
              const limit = data?.resources?.entry_processes?.limit ?? data?.resources?.entryProcesses?.limit ?? 12;
              const pct = getMetricPercent(used, limit);
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>{pct >= 75 ? 'Peringatan Preventif!' : 'Koneksi Web/API'}</span>
                    <span>{pct}% terutilisasi</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Number of Processes (nproc) */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" /> Number of Processes (nproc)
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.processes?.used ?? data?.resources?.numberProcesses?.used ?? 0} /{' '}
                {data?.resources?.processes?.limit ?? data?.resources?.numberProcesses?.limit ?? 100}
              </span>
            </div>
            {(() => {
              const used = data?.resources?.processes?.used ?? data?.resources?.numberProcesses?.used ?? 0;
              const limit = data?.resources?.processes?.limit ?? data?.resources?.numberProcesses?.limit ?? 100;
              const pct = getMetricPercent(used, limit);
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getGaugeColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Task/Thread aktif: {used}</span>
                    <span>Batas Pool: {limit}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Disk & MySQL Database */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-600" /> Disk & Database MySQL
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.disk?.used_formatted || '18.8 GB'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>MySQL: {data?.resources?.disk?.database_formatted || '680 MB'}</span>
              <span>Inodes: {data?.resources?.inodes?.used_formatted || '350,891'}</span>
            </div>
          </div>

          {/* I/O Throughput & IOPS */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" /> Kecepatan I/O & IOPS
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.io?.usage_formatted || '0 B/s'} / {data?.resources?.io?.limit_formatted || '1 MB/s'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '5%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>IOPS: {data?.resources?.iops?.used ?? 0} / {data?.resources?.iops?.limit ?? 1024}</span>
              <span>Batas I/O: 1024 KB/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Resource Consumers & Historical Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Processes */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              Konsumen Resource Teratas (Live Inspection)
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('resource-usage')}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
              >
                Lihat Semua &rarr;
              </button>
            )}
          </div>

          <div className="space-y-3">
            {data?.adaptive?.topConsumers?.memory && data.adaptive.topConsumers.memory.length > 0 ? (
              data.adaptive.topConsumers.memory.slice(0, 4).map((proc: any) => (
                <div
                  key={proc.pid}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-zinc-800 bg-zinc-200 px-2 py-0.5 rounded-lg">
                      {proc.pid}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-zinc-900 truncate">
                        {proc.appName || proc.command}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                        {proc.safetyReason || proc.args}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-right font-mono">
                    <div>
                      <div className="font-bold text-zinc-900">{proc.rss_mb || proc.memory} MB</div>
                      <div className="text-[10px] text-zinc-400">{proc.threads || 1} thrd</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        proc.category === 'critical'
                          ? 'bg-purple-100 text-purple-700'
                          : proc.prunable
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {proc.category === 'critical' ? 'Protected' : proc.prunable ? 'Recyclable' : 'Background'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">Memuat konsumen resource...</p>
            )}
          </div>
        </div>

        {/* Adaptive Rules & Guardrails Info */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protokol Perlindungan & Kebijakan Safety
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">CloudLinux LVE Compliant</span>
          </div>

          <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900">Zero Mass Kill -9:</strong> Sistem dilarang keras melakukan kill massal. Sinyal yang digunakan adalah SIGTERM graceful drain dengan verifikasi PID kepemilikan user.
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900">Perlindungan Layanan Utama:</strong> LiteSpeed web server, active request worker, database handler, dan sesi SSH dilindungi whitelist mutlak.
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900">Hysteresis Anti-Oscillation:</strong> Penurunan level dari Emergency/Critical ke Normal diwajibkan melewati cooldown period 180s guna mencegah fluktuasi buka-tutup task.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Optimization Execution Result */}
      {optResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Hasil Optimasi Adaptif</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Mode: {optResult.dryRun ? 'Dry-Run (Simulasi)' : 'Live Execution'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOptResult(null)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-2">
              <p className="text-zinc-500">Ringkasan:</p>
              <p className="font-bold text-zinc-900">{optResult.summary || 'Optimasi selesai.'}</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-zinc-700">Daftar Tindakan:</p>
              {optResult.actionsTaken && optResult.actionsTaken.length > 0 ? (
                optResult.actionsTaken.map((act: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                    <span className="font-semibold text-zinc-800">{act.action}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{act.details || JSON.stringify(act)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic">Tidak ada proses yang perlu dihentikan; kondisi saat ini aman.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setOptResult(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Optimization Audit History Logs */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Riwayat Audit Optimasi Resource</h3>
                  <p className="text-xs text-zinc-400">Semua aksi adaptif otomatis & manual tercatat di database.</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5">
              {loadingLogs ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                  Memuat riwayat log...
                </div>
              ) : optimizationLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">Belum ada catatan log optimasi.</div>
              ) : (
                optimizationLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status_badge === 'emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : log.status_badge === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : log.status_badge === 'high_usage'
                            ? 'bg-orange-100 text-orange-800'
                            : log.status_badge === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.status_badge || 'optimal'}
                        </span>
                        <span className="text-zinc-500">[{log.trigger_type}]</span>
                        {log.dry_run === 1 && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">DRY-RUN</span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-zinc-800 font-semibold">{log.summary}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Database Audit */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Audit Database MySQL & Connection Pool</h3>
                  <p className="text-xs text-zinc-400 font-mono">Database: u1zh8984_oneslabs</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDb ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                Menganalisis status database...
              </div>
            ) : dbAuditData ? (
              <div className="space-y-4 text-xs">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[11px] text-zinc-400 font-mono uppercase">Koneksi Aktif</span>
                    <div className="text-lg font-bold font-mono text-zinc-900 mt-1">
                      {dbAuditData.connections?.threadsConnected || 0}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Pool limit: 6 lean</span>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[11px] text-zinc-400 font-mono uppercase">Max Used Conns</span>
                    <div className="text-lg font-bold font-mono text-zinc-900 mt-1">
                      {dbAuditData.connections?.maxUsedConnections || 0}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Puncak penggunaan</span>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <span className="text-[11px] text-zinc-400 font-mono uppercase">Slow Queries</span>
                    <div className="text-lg font-bold font-mono text-zinc-900 mt-1">
                      {dbAuditData.performance?.slowQueries || 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">Optimal</span>
                  </div>
                </div>

                {/* Largest tables */}
                <div className="space-y-2">
                  <p className="font-bold text-zinc-800">Tabel Terbesar & Alokasi Disk:</p>
                  <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-2xl overflow-hidden font-mono">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-100 text-zinc-500 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Nama Tabel</th>
                          <th className="py-2 px-3">Jumlah Baris</th>
                          <th className="py-2 px-3">Data MB</th>
                          <th className="py-2 px-3">Index MB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {dbAuditData.largestTables?.map((tbl: any) => (
                          <tr key={tbl.tableName} className="hover:bg-zinc-50">
                            <td className="py-2 px-3 font-semibold text-zinc-900">{tbl.tableName}</td>
                            <td className="py-2 px-3 text-zinc-600">{Number(tbl.rowCount).toLocaleString()}</td>
                            <td className="py-2 px-3 text-zinc-700">{tbl.dataMb} MB</td>
                            <td className="py-2 px-3 text-zinc-500">{tbl.indexMb} MB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                  <span className="font-bold text-purple-900">Rekomendasi Optimasi:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                    {dbAuditData.recommendations?.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
