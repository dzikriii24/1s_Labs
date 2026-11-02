import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Search,
  Activity,
  ExternalLink,
  Play,
  Square,
  Server,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Folder,
  Settings2,
  Terminal,
  FileCode,
  Trash2,
  Eye,
  Copy,
  Check,
  Filter,
  X,
  MoreVertical,
  User,
  Globe,
  Clock,
  Layers,
  Edit3
} from 'lucide-react';
import { api, NodeJsApp } from '../../../services/api';
import notify from '../../../lib/notify';
import { NodeFileManagerModal } from '../../portal/NodeFileManagerModal';
import { EditAppConfigModal } from '../../portal/EditAppConfigModal';

export const NodeJsApplicationsAdminView: React.FC = () => {
  const [apps, setApps] = useState<NodeJsApp[]>([]);
  const [versions, setVersions] = useState<string[]>(['22.23.4', '20.20.2', '24.22.1']);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'error' | 'unknown'>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);
  const [pingingAppId, setPingingAppId] = useState<number | null>(null);
  const [openMenuAppId, setOpenMenuAppId] = useState<number | null>(null);
  const [copiedUrlAppId, setCopiedUrlAppId] = useState<number | null>(null);

  // Active Modals
  const [managingAppFileManager, setManagingAppFileManager] = useState<NodeJsApp | null>(null);
  const [editingAppConfig, setEditingAppConfig] = useState<NodeJsApp | null>(null);
  const [inspectingApp, setInspectingApp] = useState<NodeJsApp | null>(null);

  // Logs Modal
  const [logsApp, setLogsApp] = useState<NodeJsApp | null>(null);
  const [logsContent, setLogsContent] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const [res, verRes] = await Promise.all([
        api.admin.getAdminNodeJsApps(),
        api.nodejs.getVersions().catch(() => ({ success: false, versions: ['22.23.4', '20.20.2', '24.22.1'], default: '22.23.4' }))
      ]);

      if (res.success) {
        setApps(res.applications);
      }
      if (verRes && verRes.success) {
        setVersions(verRes.versions);
      }
    } catch (err: any) {
      console.error('Fetch admin nodejs apps error:', err);
      notify.error('Gagal memuat daftar aplikasi Node.js.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleAction = async (appId: number, action: 'start' | 'stop' | 'restart') => {
    setActionInProgressId(appId);
    try {
      const res = await api.nodejs.action(appId, action);
      if (res.success) {
        notify.success(`Aksi ${action} berhasil dieksekusi.`);
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || `Gagal mengeksekusi ${action}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleHealthCheck = async (appId: number) => {
    setPingingAppId(appId);
    try {
      const res = await api.nodejs.checkHealth(appId);
      if (res.success) {
        if (res.health?.healthy) {
          notify.success(`API Sehat! Respon ${res.health.status} (${res.health.responseTimeMs}ms)`);
        } else {
          notify.warn(`API Merespon status ${res.health?.status || 'Unknown'}`);
        }
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal melakukan health check.');
    } finally {
      setPingingAppId(null);
    }
  };

  const handleDeleteApp = async (app: NodeJsApp) => {
    if (
      !window.confirm(
        `[ADMIN] Yakin ingin menghapus aplikasi Node.js '${app.app_name}' milik user #${app.user_id}? Tindakan ini akan melepas konfigurasi CloudLinux Passenger daemon.`
      )
    ) {
      return;
    }

    try {
      const res = await api.nodejs.deleteApp(app.id);
      if (res.success) {
        notify.success(`Aplikasi Node.js '${app.app_name}' berhasil dihapus.`);
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus aplikasi.');
    }
  };

  const handleOpenLogs = async (app: NodeJsApp) => {
    setLogsApp(app);
    setIsLoadingLogs(true);
    try {
      const res = await api.nodejs.getLogs(app.id);
      if (res.success) {
        setLogsContent(res.logs);
      }
    } catch (e: any) {
      notify.error('Gagal memuat log server Node.js.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCopyUrl = (appId: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlAppId(appId);
    notify.success('URL disalin ke clipboard');
    setTimeout(() => setCopiedUrlAppId(null), 2000);
  };

  // Filter calculation
  const filtered = apps.filter((app) => {
    const ownerName = app.owner_name || (app as any).user_name || '';
    const ownerEmail = app.owner_email || (app as any).user_email || '';
    const matchesSearch =
      app.app_name.toLowerCase().includes(search.toLowerCase()) ||
      app.domain.toLowerCase().includes(search.toLowerCase()) ||
      (app.app_uri && app.app_uri.toLowerCase().includes(search.toLowerCase())) ||
      app.app_root.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : app.status === statusFilter;

    const matchesHealth =
      healthFilter === 'all'
        ? true
        : healthFilter === 'unknown'
        ? !app.health_status || app.health_status === 'unknown'
        : app.health_status === healthFilter;

    const matchesVersion =
      versionFilter === 'all' ? true : app.nodejs_version === versionFilter;

    return matchesSearch && matchesStatus && matchesHealth && matchesVersion;
  });

  const healthyApps = apps.filter((a) => a.health_status === 'healthy').length;
  const errorApps = apps.filter((a) => a.health_status === 'error').length;
  const runningApps = apps.filter((a) => a.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Node.js Infrastructure & Applications
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Monitoring & manajemen terpusat seluruh aplikasi backend Node.js yang berjalan di bawah CloudLinux Passenger daemon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApps}
            className="p-2 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Segarkan data aplikasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Aplikasi Node.js</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-zinc-900">{apps.length}</p>
            <span className="text-xs text-zinc-400 font-medium font-mono">{apps.length} daemons</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Status Running</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-emerald-600">{runningApps}</p>
            <span className="text-xs text-zinc-400 font-medium">
              {apps.length > 0 ? Math.round((runningApps / apps.length) * 100) : 0}% aktif
            </span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">API Healthy</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-indigo-600">{healthyApps}</p>
            <span className="text-xs text-rose-500 font-medium">
              {errorApps > 0 ? `${errorApps} error` : 'Semua sehat'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Degraded / Error</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-rose-600">{errorApps}</p>
            <span className="text-xs text-zinc-400 font-medium">perlu tindakan</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 border border-zinc-200 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aplikasi, domain, atau pemilik..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="running">Status: Running</option>
            <option value="stopped">Status: Stopped</option>
          </select>

          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
          >
            <option value="all">Semua Kondisi API</option>
            <option value="healthy">Sehat (Healthy)</option>
            <option value="error">Gagal / Error</option>
            <option value="unknown">Belum Dicek</option>
          </select>

          {/* Version Filter */}
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
          >
            <option value="all">Semua Versi Node</option>
            {versions.map((v) => (
              <option key={v} value={v}>Node v{v}</option>
            ))}
          </select>

          {(statusFilter !== 'all' || healthFilter !== 'all' || versionFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setHealthFilter('all');
                setVersionFilter('all');
                setSearch('');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Card List (2 Baris per Aplikasi, No Horizontal Scroll) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2 bg-white border border-zinc-200 rounded-2xl">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Memuat daftar aplikasi Node.js di server...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl text-zinc-500 text-xs">
          {apps.length === 0
            ? 'Belum ada aplikasi Node.js yang dibuat oleh pengguna.'
            : 'Tidak ada aplikasi Node.js yang cocok dengan filter pencarian saat ini.'}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((app) => {
            const isActionLoading = actionInProgressId === app.id;
            const isPinging = pingingAppId === app.id;
            const ownerName = app.owner_name || (app as any).user_name || 'User #' + app.user_id;
            const ownerEmail = app.owner_email || (app as any).user_email || '-';

            return (
              <div
                key={app.id}
                className={`relative bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm transition duration-150 space-y-3 ${
                  openMenuAppId === app.id ? 'z-20' : 'z-auto'
                }`}
              >
                {/* BARIS 1: Header (Identitas Utama, Status, Domain, dan Tombol Aksi) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Sisi Kiri: Icon + Nama + Badge Status + Link URL + Pemilik */}
                  <div className="flex items-start sm:items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <Cpu className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 tracking-tight">
                        {app.app_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                        #{app.id}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                          app.status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        {app.status}
                      </span>

                      {/* Health Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                          app.health_status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : app.health_status === 'error'
                            ? 'bg-rose-500/10 text-rose-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        <Activity className="w-2.5 h-2.5" />
                        {app.health_status === 'healthy'
                          ? `${app.last_response_time_ms || 12}ms`
                          : app.health_status === 'error'
                          ? 'Gagal'
                          : 'Belum Dicek'}
                      </span>

                      {/* URL */}
                      <div className="flex items-center gap-1 text-xs">
                        <a
                          href={app.app_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{app.app_url}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                        <button
                          onClick={() => handleCopyUrl(app.id, app.app_url)}
                          className="text-zinc-400 hover:text-zinc-700 transition cursor-pointer p-0.5"
                          title="Salin URL"
                        >
                          {copiedUrlAppId === app.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Owner info */}
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 bg-zinc-100/70 px-2 py-0.5 rounded-md">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span className="font-medium text-zinc-700">{ownerName}</span>
                        <span className="text-zinc-400 font-mono text-[10px]">({ownerEmail})</span>
                      </span>
                    </div>
                  </div>

                  {/* Sisi Kanan: Action Center & Titik Tiga Dropdown */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Quick Files */}
                    <button
                      onClick={() => setManagingAppFileManager(app)}
                      className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      title="Buka File Manager"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      <span>Files</span>
                    </button>

                    {/* Quick Config */}
                    <button
                      onClick={() => setEditingAppConfig(app)}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Pengaturan Node.js"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Config</span>
                    </button>

                    {/* Start / Stop Toggle */}
                    {app.status === 'running' ? (
                      <button
                        onClick={() => handleAction(app.id, 'stop')}
                        disabled={isActionLoading}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Hentikan Aplikasi"
                      >
                        <Square className="w-3 h-3 fill-rose-600" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(app.id, 'start')}
                        disabled={isActionLoading}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Jalankan Aplikasi"
                      >
                        <Play className="w-3 h-3 fill-emerald-600" />
                        <span>Start</span>
                      </button>
                    )}

                    {/* Titik Tiga Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuAppId(openMenuAppId === app.id ? null : app.id);
                        }}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          openMenuAppId === app.id
                            ? 'bg-zinc-200 border-zinc-300 text-zinc-900'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                        title="Peralatan Lainnya"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuAppId === app.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuAppId(null);
                            }}
                          />
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl py-1.5 z-40 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                setInspectingApp(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Detail Spesifikasi & Path</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                setEditingAppConfig(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Pengaturan Node.js (Config)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleHealthCheck(app.id);
                              }}
                              disabled={isPinging}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : 'text-emerald-500'}`} />
                              <span>Health Check (Ping Endpoint)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleAction(app.id, 'restart');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                              <span>Restart Passenger Service</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleOpenLogs(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Lihat Log Server</span>
                            </button>

                            <div className="my-1 border-t border-zinc-100" />

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleDeleteApp(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Aplikasi (Admin Delete)</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* BARIS 2: Spesifikasi & Informasi Teknis (Multi-Kolom Ringkas, No Horizontal Scroll) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-2.5 border-t border-zinc-100 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Node & Mode</span>
                    <p className="font-mono font-bold text-zinc-800 text-[11px]">
                      v{app.nodejs_version} &bull; <span className="capitalize font-sans font-medium text-zinc-500">{app.app_mode}</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Domain / Prefix</span>
                    <p className="font-mono font-bold text-zinc-800 text-[11px] truncate" title={`${app.domain}/${app.app_uri}`}>
                      /{app.app_uri || 'api'}
                    </p>
                  </div>

                  <div
                    onClick={() => setManagingAppFileManager(app)}
                    className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5 hover:bg-zinc-100 cursor-pointer transition group"
                    title="Klik untuk membuka File Manager"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span>App Root</span>
                      <Folder className="w-2.5 h-2.5 text-amber-500 opacity-60 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-zinc-800 text-[11px] truncate" title={app.app_root}>
                      ~/{app.app_root}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Startup File</span>
                    <p className="font-mono font-bold text-zinc-800 text-[11px] truncate">{app.startup_file || 'index.js'}</p>
                  </div>

                  <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Waktu Dibuat</span>
                    <p className="font-mono text-zinc-600 text-[11px] truncate">
                      {new Date(app.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Integrated File Manager */}
      {managingAppFileManager && (
        <NodeFileManagerModal
          isOpen={Boolean(managingAppFileManager)}
          onClose={() => setManagingAppFileManager(null)}
          app={managingAppFileManager}
          onAppRestarted={fetchApps}
        />
      )}

      {/* MODAL: Edit App Config */}
      {editingAppConfig && (
        <EditAppConfigModal
          isOpen={Boolean(editingAppConfig)}
          onClose={() => setEditingAppConfig(null)}
          app={editingAppConfig}
          availableVersions={versions}
          onConfigSaved={() => {
            setEditingAppConfig(null);
            fetchApps();
          }}
        />
      )}

      {/* MODAL: Server Logs */}
      {logsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Server Logs &bull; {logsApp.app_name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ~/{logsApp.app_root}/passenger.log
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenLogs(logsApp)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg border border-zinc-200 cursor-pointer"
                  title="Segarkan Log"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setLogsApp(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 text-zinc-300 font-mono text-xs p-4 rounded-2xl h-80 overflow-y-auto whitespace-pre-wrap shadow-inner border border-zinc-900">
              {isLoadingLogs
                ? 'Memuat log server...'
                : logsContent || 'Belum ada log error atau log kosong.'}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: App Detail Inspection */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">
                  Detail Sistem Node.js &bull; {inspectingApp.app_name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingApp(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">App Identifier:</span>
                <p className="font-bold text-zinc-900 font-mono">{inspectingApp.app_name}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Target URL:</span>
                <p className="font-bold text-zinc-900 font-mono">{inspectingApp.app_url}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Pemilik Akun:</span>
                <p className="font-bold text-zinc-900">
                  {inspectingApp.owner_name || (inspectingApp as any).user_name || 'User #' + inspectingApp.user_id}
                </p>
                <p className="text-[10px] text-zinc-400">{inspectingApp.owner_email || (inspectingApp as any).user_email}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Versi Node.js & Startup:</span>
                <p className="font-bold text-zinc-900 font-mono">Node v{inspectingApp.nodejs_version}</p>
                <p className="text-[10px] text-zinc-400">File: {inspectingApp.startup_file} ({inspectingApp.app_mode})</p>
              </div>

              <div className="col-span-2 p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">App Root Path (CloudLinux):</span>
                <p className="font-bold text-zinc-900 font-mono">~/{inspectingApp.app_root}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Full Path: {inspectingApp.full_app_root || `/home/u1zh8984/${inspectingApp.app_root}`}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Dibuat Pada:</span>
                <p className="font-bold text-zinc-900 font-mono">
                  {new Date(inspectingApp.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Terakhir Restart:</span>
                <p className="font-bold text-zinc-900 font-mono">
                  {inspectingApp.last_restart_at ? new Date(inspectingApp.last_restart_at).toLocaleString('id-ID') : 'Belum pernah'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingApp(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
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
