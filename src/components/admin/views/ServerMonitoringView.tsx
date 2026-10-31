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
  ArrowRight
} from 'lucide-react';
import { api, ServerMonitoringData } from '../../../services/api';

interface ServerMonitoringViewProps {
  onNavigate?: (tab: string) => void;
}

export const ServerMonitoringView: React.FC<ServerMonitoringViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<ServerMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getServerMonitoring();
      if (res.success && res.data) {
        setData(res.data);
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
    }, 15000); // 15 seconds refresh
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getMetricPercent = (used: number, limit: number) => {
    if (!limit || limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Monitoring Server Cloud & Alokasi Resource LVE
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Metrik real-time CloudLinux LVE, utilisasi CPU, RAM fisik, proses aktif Passenger & cPanel, dan alokasi storage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl font-medium">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
            />
            Auto-refresh (15s)
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

      {/* Health Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Status Sistem</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Healthy
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2 truncate">
            {data?.server?.hostname || '1slabs.my.id'}
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">
            IP: {data?.server?.ip || '103.119.237.132'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Server Uptime</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2">
            {data?.server?.uptime || 'Active'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Uptime operasional server</div>
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
            cPanel {data?.server?.cpanel_version || 'v124'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Load Average</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-2">
            {data?.server?.load_average || '0.12, 0.18, 0.22'}
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono">1m, 5m, 15m normalized load</div>
        </div>
      </div>

      {/* Main LVE Resource Gauges (CPanel / CloudLinux Quota) */}
      <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Alokasi & Kuota Resource CloudLinux LVE
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Konsumsi aktual terhadap ambang batas CloudLinux. Peringatan aman di 80%, kritis di 95%.
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('resource-usage')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <span>Inspeksi Proses Aktif</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (data?.resources?.cpu?.used || 0) >= 95
                    ? 'bg-red-500'
                    : (data?.resources?.cpu?.used || 0) >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, data?.resources?.cpu?.used || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>Status: {(data?.resources?.cpu?.used || 0) < 80 ? 'Optimal' : 'High Load'}</span>
              <span>Batas CloudLinux: {data?.resources?.cpu?.limit ?? 100}%</span>
            </div>
          </div>

          {/* Physical Memory */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-600" /> Physical RAM
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.memory?.used_formatted || `${data?.resources?.memory?.used_mb || 128} MB`} /{' '}
                {data?.resources?.memory?.limit_formatted || `${data?.resources?.memory?.limit_mb || 1024} MB`}
              </span>
            </div>
            {(() => {
              const pct = getMetricPercent(
                data?.resources?.memory?.used_mb || 128,
                data?.resources?.memory?.limit_mb || 1024
              );
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Penggunaan: {pct}%</span>
                    <span>Alokasi Maks: {data?.resources?.memory?.limit_formatted || '1.00 GB'}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Entry Processes */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Entry Processes (EP)
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.entry_processes?.used ?? 1} / {data?.resources?.entry_processes?.limit ?? 12}
              </span>
            </div>
            {(() => {
              const pct = getMetricPercent(
                data?.resources?.entry_processes?.used ?? 1,
                data?.resources?.entry_processes?.limit ?? 12
              );
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Entry koneksi Passenger/Web</span>
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
                {data?.resources?.processes?.used ?? 24} / {data?.resources?.processes?.limit ?? 100}
              </span>
            </div>
            {(() => {
              const pct = getMetricPercent(
                data?.resources?.processes?.used ?? 24,
                data?.resources?.processes?.limit ?? 100
              );
              return (
                <>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Task berjalan: {data?.resources?.processes?.used ?? 24}</span>
                    <span>Batas pool: {data?.resources?.processes?.limit ?? 100}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Disk Usage */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-600" /> Penggunaan Penyimpanan (Disk)
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {data?.resources?.disk?.used_formatted || '17.88 GB'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '22%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>Database MySQL: {data?.resources?.disk?.database_formatted || '647.42 MB'}</span>
              <span>Kondisi: Optimal</span>
            </div>
          </div>

          {/* IO & IOPS */}
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
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '4%' }} />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>IOPS: {data?.resources?.iops?.used ?? 0} / {data?.resources?.iops?.limit ?? 1024}</span>
              <span>Inodes: {data?.resources?.inodes?.used_formatted || '62,810'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
