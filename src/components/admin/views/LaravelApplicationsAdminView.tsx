import React, { useState, useEffect } from 'react';
import {
  Flame,
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
  Database
} from 'lucide-react';
import { api, LaravelApp } from '../../../services/api';
import notify from '../../../lib/notify';
import { LaravelFileManagerModal } from '../../portal/LaravelFileManagerModal';

export const LaravelApplicationsAdminView: React.FC = () => {
  const [apps, setApps] = useState<LaravelApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'error' | 'unknown'>('all');
  const [phpFilter, setPhpFilter] = useState<string>('all');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);
  const [pingingAppId, setPingingAppId] = useState<number | null>(null);
  const [openMenuAppId, setOpenMenuAppId] = useState<number | null>(null);
  const [copiedUrlAppId, setCopiedUrlAppId] = useState<number | null>(null);

  // Active Modals
  const [managingAppFileManager, setManagingAppFileManager] = useState<LaravelApp | null>(null);
  const [inspectingApp, setInspectingApp] = useState<LaravelApp | null>(null);

  // Artisan Modal
  const [artisanApp, setArtisanApp] = useState<LaravelApp | null>(null);
  const [artisanCommand, setArtisanCommand] = useState('migrate --force');
  const [isRunningArtisan, setIsRunningArtisan] = useState(false);
  const [artisanOutput, setArtisanOutput] = useState<string | null>(null);

  // .env Editor Modal
  const [envApp, setEnvApp] = useState<LaravelApp | null>(null);
  const [envContent, setEnvContent] = useState('');
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Logs Modal
  const [logsApp, setLogsApp] = useState<LaravelApp | null>(null);
  const [logsContent, setLogsContent] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAdminLaravelApps();
      if (res.success) {
        setApps(res.applications);
      }
    } catch (err: any) {
      console.error('Fetch admin laravel apps error:', err);
      notify.error('Gagal memuat daftar aplikasi Laravel.');
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
      const res = await api.laravel.action(appId, action);
      if (res.success) {
        notify.success(`Aksi ${action} berhasil dieksekusi.`);
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || `Gagal menjalankan aksi ${action}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleCheckHealth = async (app: LaravelApp) => {
    setPingingAppId(app.id);
    try {
      const res = await api.laravel.checkHealth(app.id);
      if (res.success) {
        if (res.health.healthy) {
          notify.success(`API Sehat! Respon ${res.health.status} (${res.health.responseTimeMs}ms)`);
        } else {
          notify.warn(`API Merespon status ${res.health.status}: ${res.health.statusText}`);
        }
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal melakukan health check.');
    } finally {
      setPingingAppId(null);
    }
  };

  const handleDeleteApp = async (app: LaravelApp) => {
    if (
      !window.confirm(
        `[ADMIN] Yakin ingin menghapus aplikasi Laravel '${app.app_name}' milik user #${app.user_id}? Tindakan ini akan menghapus symlink routing dan data aplikasi.`
      )
    ) {
      return;
    }

    try {
      const res = await api.laravel.deleteApp(app.id);
      if (res.success) {
        notify.success(`Aplikasi '${app.app_name}' berhasil dihapus.`);
        await fetchApps();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus aplikasi.');
    }
  };

  const handleRunArtisan = async (cmdToRun?: string) => {
    if (!artisanApp) return;
    const cmd = cmdToRun || artisanCommand;
    if (!cmd.trim()) return;

    try {
      setIsRunningArtisan(true);
      setArtisanOutput(`$ php artisan ${cmd}\nSedang mengeksekusi perintah di server CloudLinux...`);

      const res = await api.laravel.runArtisan(artisanApp.id, cmd.trim());
      if (res.success) {
        setArtisanOutput(`$ ${res.command}\n\n${res.output || ''}${res.error ? '\nSTDERR:\n' + res.error : ''}`);
        notify.success(`Perintah 'artisan ${cmd}' selesai dieksekusi.`);
      }
    } catch (err: any) {
      setArtisanOutput(`$ php artisan ${cmd}\n\nERROR:\n${err.message}`);
      notify.error(err.message || 'Gagal menjalankan perintah artisan.');
    } finally {
      setIsRunningArtisan(false);
    }
  };

  const handleOpenEnv = async (app: LaravelApp) => {
    setEnvApp(app);
    setIsLoadingEnv(true);
    try {
      const res = await api.laravel.getEnv(app.id);
      if (res.success) {
        setEnvContent(res.content);
      }
    } catch (e: any) {
      notify.error('Gagal memuat konfigurasi .env.');
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const handleSaveEnv = async () => {
    if (!envApp) return;
    try {
      setIsSavingEnv(true);
      const res = await api.laravel.updateEnv(envApp.id, envContent);
      if (res.success) {
        notify.success('Konfigurasi .env berhasil disimpan & cache server diperbarui!');
        setEnvApp(null);
      }
    } catch (e: any) {
      notify.error(e.message || 'Gagal menyimpan .env.');
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleOpenLogs = async (app: LaravelApp) => {
    setLogsApp(app);
    setIsLoadingLogs(true);
    try {
      const res = await api.laravel.getLogs(app.id);
      if (res.success) {
        setLogsContent(res.logs);
      }
    } catch (e: any) {
      notify.error('Gagal memuat log Laravel.');
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

  // Filtering
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

    const matchesPhp =
      phpFilter === 'all' ? true : app.php_version === phpFilter;

    return matchesSearch && matchesStatus && matchesHealth && matchesPhp;
  });

  const totalDeployments = apps.reduce((acc, curr) => acc + (curr.deployment_count || 0), 0);
  const healthyApps = apps.filter((a) => a.health_status === 'healthy').length;
  const errorApps = apps.filter((a) => a.health_status === 'error').length;
  const runningApps = apps.filter((a) => a.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 fill-red-500/20" />
            Laravel Infrastructure & Applications
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Monitoring & manajemen terpusat seluruh aplikasi Laravel, Artisan CLI console, dan konfigurasi server pengguna.
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
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Aplikasi Laravel</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-zinc-900">{apps.length}</p>
            <span className="text-xs text-zinc-400 font-medium font-mono">{apps.length} apps</span>
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
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Kondisi API Healthy</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-red-600">{healthyApps}</p>
            <span className="text-xs text-rose-500 font-medium">
              {errorApps > 0 ? `${errorApps} error` : 'Semua sehat'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Deployments</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-amber-600">{totalDeployments}</p>
            <span className="text-xs text-zinc-400 font-medium">rilis server</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 border border-zinc-200 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama aplikasi, domain, route, atau pemilik..."
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

          {/* PHP Version Filter */}
          <select
            value={phpFilter}
            onChange={(e) => setPhpFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
          >
            <option value="all">Semua PHP</option>
            <option value="8.2">PHP 8.2</option>
            <option value="8.3">PHP 8.3</option>
            <option value="8.1">PHP 8.1</option>
          </select>

          {(statusFilter !== 'all' || healthFilter !== 'all' || phpFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setHealthFilter('all');
                setPhpFilter('all');
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
          <p className="text-xs text-zinc-400 font-mono">Memuat daftar aplikasi Laravel di server...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl text-zinc-500 text-xs">
          {apps.length === 0
            ? 'Belum ada aplikasi Laravel yang dibuat oleh pengguna.'
            : 'Tidak ada aplikasi Laravel yang cocok dengan filter pencarian saat ini.'}
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <Flame className="w-4 h-4" />
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
                          ? `${app.last_response_time_ms || 18}ms`
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
                          className="text-red-600 font-semibold hover:underline inline-flex items-center gap-1"
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

                    {/* Quick Artisan */}
                    <button
                      onClick={() => {
                        setArtisanApp(app);
                        setArtisanOutput(null);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Buka Artisan Console"
                    >
                      <Terminal className="w-3.5 h-3.5 text-red-500" />
                      <span>Artisan</span>
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
                                handleOpenEnv(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-700 transition"
                            >
                              <FileCode className="w-3.5 h-3.5 text-amber-500" />
                              <span>Editor .env Server</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleCheckHealth(app);
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
                              <span>Clear Cache & Optimize</span>
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
                    <span className="text-[10px] text-zinc-400 font-medium">Engine & Mode</span>
                    <p className="font-mono font-bold text-zinc-800 text-[11px]">
                      PHP {app.php_version || '8.2'} &bull; <span className="capitalize font-sans font-medium text-zinc-500">{app.app_mode}</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Domain / Prefix</span>
                    <p className="font-mono font-bold text-zinc-800 text-[11px] truncate" title={`${app.domain}/${app.app_uri}`}>
                      /{app.app_uri || 'root'}
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
                    <span className="text-[10px] text-zinc-400 font-medium">Riwayat Deployment</span>
                    <p className="font-bold text-zinc-800 text-[11px]">{app.deployment_count || 0}x Deploy</p>
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
        <LaravelFileManagerModal
          isOpen={Boolean(managingAppFileManager)}
          onClose={() => setManagingAppFileManager(null)}
          app={managingAppFileManager}
          onAppRestarted={fetchApps}
        />
      )}

      {/* MODAL: Artisan Console */}
      {artisanApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Artisan CLI Console &bull; {artisanApp.app_name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ~/{artisanApp.app_root} (PHP {artisanApp.php_version})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setArtisanApp(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Command Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-[11px] text-zinc-400 self-center mr-1">Quick:</span>
              {[
                'migrate --force',
                'optimize:clear',
                'route:list',
                'config:cache',
                'view:clear',
                'about'
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setArtisanCommand(cmd);
                    handleRunArtisan(cmd);
                  }}
                  disabled={isRunningArtisan}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-mono text-[11px] transition cursor-pointer"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex rounded-xl border border-zinc-200 overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
                <span className="px-3 py-2 bg-zinc-100 text-zinc-500 font-mono text-xs select-none">
                  php artisan
                </span>
                <input
                  type="text"
                  value={artisanCommand}
                  onChange={(e) => setArtisanCommand(e.target.value)}
                  placeholder="migrate, cache:clear, route:list..."
                  className="flex-1 px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunArtisan();
                  }}
                />
              </div>
              <button
                onClick={() => handleRunArtisan()}
                disabled={isRunningArtisan || !artisanCommand.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isRunningArtisan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Jalankan</span>
              </button>
            </div>

            {/* Output terminal */}
            <div className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap shadow-inner border border-zinc-900">
              {artisanOutput || '// Hasil eksekusi perintah php artisan akan muncul di sini...'}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: .env Editor */}
      {envApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Editor .env Server &bull; {envApp.app_name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ~/{envApp.app_root}/.env
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnvApp(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEnv ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-400 mt-2 font-mono">Membaca file .env...</p>
              </div>
            ) : (
              <>
                <textarea
                  value={envContent}
                  onChange={(e) => setEnvContent(e.target.value)}
                  className="w-full h-80 bg-zinc-950 text-zinc-200 font-mono text-xs p-4 rounded-2xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner"
                  placeholder="APP_NAME=Laravel&#10;APP_ENV=production..."
                />
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-zinc-400">
                    Menyimpan .env akan otomatis membersihkan cache konfigurasi Laravel.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEnvApp(null)}
                      className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveEnv}
                      disabled={isSavingEnv}
                      className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingEnv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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
                    storage/logs/laravel.log
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenLogs(logsApp)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg border border-zinc-200"
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
                <Flame className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-zinc-900">
                  Detail Sistem Aplikasi &bull; {inspectingApp.app_name}
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
                <span className="text-zinc-400 font-medium">Domain & URI:</span>
                <p className="font-bold text-zinc-900 font-mono">{inspectingApp.domain}/{inspectingApp.app_uri || ''}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Pemilik Akun:</span>
                <p className="font-bold text-zinc-900">
                  {inspectingApp.owner_name || (inspectingApp as any).user_name || 'User #' + inspectingApp.user_id}
                </p>
                <p className="text-[10px] text-zinc-400">{inspectingApp.owner_email || (inspectingApp as any).user_email}</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Versi PHP & Engine:</span>
                <p className="font-bold text-zinc-900 font-mono">PHP {inspectingApp.php_version}</p>
                <p className="text-[10px] text-zinc-400 capitalize">Mode: {inspectingApp.app_mode}</p>
              </div>

              <div className="col-span-2 p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Application Root Folder (CloudLinux):</span>
                <p className="font-bold text-zinc-900 font-mono">~/{inspectingApp.app_root}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Full Path: {inspectingApp.full_app_root || `/home/u1zh8984/${inspectingApp.app_root}`}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Total Rilis / Deployment:</span>
                <p className="font-bold text-zinc-900">{inspectingApp.deployment_count || 0} kali deploy</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                <span className="text-zinc-400 font-medium">Dibuat Pada:</span>
                <p className="font-bold text-zinc-900 font-mono">
                  {new Date(inspectingApp.created_at).toLocaleString('id-ID')}
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

