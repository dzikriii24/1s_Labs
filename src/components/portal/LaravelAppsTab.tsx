import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Plus,
  Play,
  Square,
  RefreshCw,
  Upload,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Trash2,
  Terminal,
  FileCode,
  Key,
  Layers,
  Loader2,
  Folder,
  Server,
  Globe,
  X,
  FileText,
  Settings2,
  Database,
  Code,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { api, LaravelApp, DomainRecord, OccupiedEndpoint } from '../../services/api';
import notify from '../../lib/notify';
import { LaravelFileManagerModal } from './LaravelFileManagerModal';

interface LaravelAppsTabProps {
  onNavigateToDomains: () => void;
}

export const LaravelAppsTab: React.FC<LaravelAppsTabProps> = ({ onNavigateToDomains }) => {
  const [apps, setApps] = useState<LaravelApp[]>([]);
  const [userDomains, setUserDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Modals
  const [managingAppFileManager, setManagingAppFileManager] = useState<LaravelApp | null>(null);

  // Create App Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [appUri, setAppUri] = useState('api');
  const [phpVersion, setPhpVersion] = useState('8.2');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Deploy ZIP Modal State
  const [deployingApp, setDeployingApp] = useState<LaravelApp | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string | null>(null);

  // Artisan Console Modal State
  const [artisanApp, setArtisanApp] = useState<LaravelApp | null>(null);
  const [customCommand, setCustomCommand] = useState('migrate --force');
  const [isRunningArtisan, setIsRunningArtisan] = useState(false);
  const [artisanOutput, setArtisanOutput] = useState<string | null>(null);

  // .env Editor Modal State
  const [envApp, setEnvApp] = useState<LaravelApp | null>(null);
  const [envContent, setEnvContent] = useState('');
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Logs Modal State
  const [logsApp, setLogsApp] = useState<LaravelApp | null>(null);
  const [logsContent, setLogsContent] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Health ping state & action state
  const [pingingAppId, setPingingAppId] = useState<number | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Dropdown Action Menu State (for clean UI)
  const [openMenuAppId, setOpenMenuAppId] = useState<number | null>(null);

  // Cross-framework Occupied Endpoints
  const [occupiedEndpoints, setOccupiedEndpoints] = useState<OccupiedEndpoint[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, domRes, occRes] = await Promise.all([
        api.laravel.listApps(),
        api.domains.list(),
        api.laravel.getOccupiedEndpoints().catch(() => ({ success: false, endpoints: [] }))
      ]);

      if (appsRes.success) setApps(appsRes.applications);
      if (domRes.success) {
        setUserDomains(domRes.domains);
        if (domRes.domains.length > 0 && !targetDomain) {
          setTargetDomain(domRes.domains[0].domain);
        }
      }
      if (occRes && occRes.success) {
        setOccupiedEndpoints(occRes.endpoints || []);
      }
    } catch (err: any) {
      notify.error('Gagal memuat data aplikasi Laravel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute collision info for Create Modal
  const cleanUri = (appUri || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  const endpointsOnSelectedDomain = occupiedEndpoints.filter(
    (ep) => ep.domain.toLowerCase() === (targetDomain || '').trim().toLowerCase()
  );
  const collidingEndpoint = endpointsOnSelectedDomain.find(
    (ep) => (ep.app_uri || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase() === cleanUri
  );

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !targetDomain) {
      setCreateError('Nama aplikasi dan domain tujuan wajib diisi.');
      return;
    }

    if (collidingEndpoint) {
      setCreateError(
        `Endpoint '/${cleanUri || ''}' pada domain '${targetDomain}' sudah digunakan oleh aplikasi ${
          collidingEndpoint.platform === 'nodejs' ? 'Node.js' : 'Laravel'
        } '${collidingEndpoint.app_name}'.`
      );
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const env_vars: Record<string, string> = {};
      if (dbName) env_vars.DB_DATABASE = dbName.trim();
      if (dbUser) env_vars.DB_USERNAME = dbUser.trim();
      if (dbPass) env_vars.DB_PASSWORD = dbPass.trim();

      const res = await api.laravel.createApp({
        app_name: appName.trim(),
        domain: targetDomain,
        app_uri: appUri.trim(),
        php_version: phpVersion,
        env_vars
      });

      if (res.success) {
        notify.success(`Aplikasi Laravel '${appName}' berhasil dibuat!`);
        setIsCreateModalOpen(false);
        setAppName('');
        setDbName('');
        setDbUser('');
        setDbPass('');
        fetchData();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat aplikasi Laravel.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeployZip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployingApp || !zipFile) {
      notify.error('Pilih file ZIP aplikasi Laravel terlebih dahulu.');
      return;
    }

    try {
      setIsDeploying(true);
      setDeployLogs('Mengunggah file ZIP dan menjalankan proses deployment di server (unzip, composer install, artisan migrate)...');

      const res = await api.laravel.deployZip(deployingApp.id, zipFile);
      if (res.success) {
        notify.success('Deployment Laravel berhasil!');
        setDeployLogs(res.deployment?.logs || 'Deployment sukses.');
        fetchData();
      }
    } catch (err: any) {
      setDeployLogs(`Gagal deploy: ${err.message}`);
      notify.error(err.message || 'Gagal deploy file ZIP.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAction = async (appId: number, action: 'start' | 'stop' | 'restart') => {
    try {
      setActionInProgressId(appId);
      const res = await api.laravel.action(appId, action);
      if (res.success) {
        notify.success(res.message);
        fetchData();
      }
    } catch (err: any) {
      notify.error(err.message || `Gagal menjalankan ${action} aplikasi.`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRunArtisan = async (cmdToRun?: string) => {
    if (!artisanApp) return;
    const cmd = cmdToRun || customCommand;
    if (!cmd.trim()) return;

    try {
      setIsRunningArtisan(true);
      setArtisanOutput(`$ php artisan ${cmd}\nSedang menjalankan perintah di server...`);

      const res = await api.laravel.runArtisan(artisanApp.id, cmd.trim());
      if (res.success) {
        setArtisanOutput(`$ ${res.command}\n\n${res.output || ''}${res.error ? '\nSTDERR:\n' + res.error : ''}`);
        notify.success(`Perintah 'artisan ${cmd}' selesai.`);
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
        notify.success('Konfigurasi .env berhasil disimpan & cache diperbarui!');
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

  const handleCheckHealth = async (app: LaravelApp) => {
    try {
      setPingingAppId(app.id);
      const res = await api.laravel.checkHealth(app.id);
      if (res.success) {
        if (res.health.healthy) {
          notify.success(`API Sehat! Respon ${res.health.status} (${res.health.responseTimeMs}ms)`);
        } else {
          notify.warn(`API Merespon status ${res.health.status}: ${res.health.statusText}`);
        }
        fetchData();
      }
    } catch (e: any) {
      notify.error('Gagal melakukan health check.');
    } finally {
      setPingingAppId(null);
    }
  };

  const handleDeleteApp = async (app: LaravelApp) => {
    if (!window.confirm(`Yakin ingin menghapus aplikasi Laravel '${app.app_name}'? Tindakan ini akan melepas symlink dan menghapus aplikasi dari sistem.`)) {
      return;
    }
    try {
      const res = await api.laravel.deleteApp(app.id);
      if (res.success) {
        notify.success(res.message);
        fetchData();
      }
    } catch (e: any) {
      notify.error(e.message || 'Gagal menghapus aplikasi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Laravel Application Manager
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-500/10 text-red-500 border border-red-500/20 font-mono">
              PHP 8.2 / 8.3
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Deploy dan kelola backend REST API atau aplikasi berbasis Laravel PHP Anda secara profesional. Dilengkapi integrasi File Manager, eksekusi Artisan, editor .env, dan health check.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Aplikasi Laravel Baru
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Total Aplikasi</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{apps.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Running</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {apps.filter(a => a.status === 'running').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500">API Sehat (Healthy)</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {apps.filter(a => a.health_status === 'healthy').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Engine PHP</span>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">v8.2 (CLI+FPM)</p>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-xs text-gray-500">Memuat konfigurasi aplikasi Laravel...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">
          <Flame className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Belum Ada Aplikasi Laravel</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-6">
            Anda dapat membuat backend Laravel API yang otomatis diarahkan ke subdomain Anda (contoh: <code>nama.1slabs.my.id/api</code>).
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Buat Aplikasi Laravel Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const isActionLoading = actionInProgressId === app.id;
            const isPinging = pingingAppId === app.id;

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 shadow-xs hover:border-red-500/40 transition duration-200 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
                      <Flame className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {app.app_name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                            app.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {app.status === 'running' ? 'Running' : 'Stopped'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                            app.health_status === 'healthy'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : app.health_status === 'error'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Activity className="w-3 h-3" />
                          {app.health_status === 'healthy'
                            ? `Sehat (${app.last_response_time_ms || 18} ms)`
                            : app.health_status === 'error'
                            ? 'Gagal Merespon'
                            : 'Belum Dicek'}
                        </span>
                      </div>

                      <a
                        href={app.app_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        {app.app_url}
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>

                  {/* Clean Operational Controls */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {/* Primary Action: File Manager */}
                    <button
                      onClick={() => setManagingAppFileManager(app)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                      title="Kelola File Kode Laravel"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      <span>File Manager</span>
                    </button>

                    {/* Secondary Action: Deploy ZIP */}
                    <button
                      onClick={() => {
                        setDeployingApp(app);
                        setZipFile(null);
                        setDeployLogs(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                      title="Deploy ZIP kode aplikasi"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Deploy ZIP</span>
                    </button>

                    {/* Start / Stop Toggle */}
                    {app.status === 'running' ? (
                      <button
                        onClick={() => handleAction(app.id, 'stop')}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Hentikan aplikasi Laravel"
                      >
                        <Square className="w-3 h-3 fill-rose-600" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(app.id, 'start')}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Jalankan aplikasi Laravel"
                      >
                        <Play className="w-3 h-3 fill-emerald-600" />
                        <span>Start</span>
                      </button>
                    )}

                    {/* Modern Dropdown for Utility Tools */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuAppId(openMenuAppId === app.id ? null : app.id)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                          openMenuAppId === app.id
                            ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title="Alat & Utilitas Laravel"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuAppId === app.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setOpenMenuAppId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                setArtisanApp(app);
                                setArtisanOutput(null);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 transition"
                            >
                              <Terminal className="w-4 h-4 text-red-500" />
                              <span>Artisan Console CLI</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleOpenEnv(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 transition"
                            >
                              <FileCode className="w-4 h-4 text-amber-500" />
                              <span>Editor .env</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleAction(app.id, 'restart');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 transition"
                            >
                              <RefreshCw className="w-4 h-4 text-blue-500" />
                              <span>Clear Cache & Optimize</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleCheckHealth(app);
                              }}
                              disabled={isPinging}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 transition"
                            >
                              <Activity className={`w-4 h-4 ${isPinging ? 'animate-spin text-zinc-900 dark:text-white' : 'text-emerald-500'}`} />
                              <span>Health Check API</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleOpenLogs(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200 transition"
                            >
                              <FileText className="w-4 h-4 text-indigo-500" />
                              <span>Lihat Server Logs</span>
                            </button>

                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-700/60" />

                            <button
                              onClick={() => {
                                setOpenMenuAppId(null);
                                handleDeleteApp(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Hapus Aplikasi</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* App Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-400 text-[11px]">Versi PHP:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono mt-0.5">
                      PHP {app.php_version}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-400 text-[11px]">Framework / Route:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      Laravel (/{app.app_uri || 'root'})
                    </p>
                  </div>
                  <div
                    onClick={() => setManagingAppFileManager(app)}
                    className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer transition group/spec"
                    title="Buka Application Root di File Manager"
                  >
                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Application Root:</span>
                      <Folder className="w-3 h-3 text-amber-500 opacity-60 group-hover/spec:opacity-100 transition" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono truncate mt-0.5" title={app.app_root}>
                      ~/{app.app_root}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-400 text-[11px]">Deployments:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {app.deployment_count || 0}x Deploy
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
          onAppRestarted={fetchData}
        />
      )}

      {/* MODAL: Deploy Application */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    Buat Aplikasi Laravel Baru
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateApp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Aplikasi (Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="misal: inpartner-backend"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Domain Tujuan
                    </label>
                    <select
                      value={targetDomain}
                      onChange={(e) => setTargetDomain(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {userDomains.map((d) => (
                        <option key={d.id} value={d.domain}>
                          {d.domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      URI Path Prefix
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-red-500">
                      <span className="inline-flex items-center px-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-mono text-xs select-none">
                        /
                      </span>
                      <input
                        type="text"
                        value={appUri}
                        onChange={(e) => setAppUri(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="api (atau kosongkan untuk root)"
                        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Occupied Endpoints Feedback & Collision Alert */}
                {targetDomain && (
                  <div className="space-y-2">
                    {collidingEndpoint ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">⚠️ Endpoint Bertabrakan!</p>
                          <p className="leading-relaxed">
                            Path <code className="font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">/{cleanUri || '(root)'}</code> pada domain <strong>{targetDomain}</strong> sudah aktif digunakan oleh aplikasi <strong>{collidingEndpoint.platform === 'nodejs' ? 'Node.js' : 'Laravel'}</strong> (<code className="font-semibold">{collidingEndpoint.app_name}</code>).
                          </p>
                          <p className="text-[11px] opacity-90">
                            Gunakan URI prefix lain (misal: <span className="underline font-mono cursor-pointer font-bold" onClick={() => setAppUri(cleanUri ? `${cleanUri}-v2` : 'api-v2')}>/{cleanUri ? `${cleanUri}-v2` : 'api-v2'}</span> atau <span className="underline font-mono cursor-pointer font-bold" onClick={() => setAppUri('laravel-api')}>/laravel-api</span>) agar routing web server tidak bentrok.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Endpoint <strong className="font-mono">https://{targetDomain}/{cleanUri}</strong> tersedia dan siap didaftarkan.</span>
                      </div>
                    )}

                    {endpointsOnSelectedDomain.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                          <span className="font-medium">Endpoint backend terpakai di {targetDomain}:</span>
                          <span>{endpointsOnSelectedDomain.length} aktif</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {endpointsOnSelectedDomain.map((ep) => (
                            <span
                              key={`${ep.platform}-${ep.id}`}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1.5 border ${
                                ep.platform === 'nodejs'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <span className="font-bold uppercase tracking-wider text-[9px] opacity-80">
                                {ep.platform === 'nodejs' ? 'Node' : 'Laravel'}
                              </span>
                              <span>/{ep.app_uri || 'root'}</span>
                              <span className="opacity-75 font-sans text-[10px]">({ep.app_name})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Versi PHP
                  </label>
                  <select
                    value={phpVersion}
                    onChange={(e) => setPhpVersion(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="8.2">PHP 8.2 (Direkomendasikan untuk Laravel 11)</option>
                    <option value="8.3">PHP 8.3</option>
                    <option value="8.1">PHP 8.1</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-3">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-red-500" />
                    <span>Konfigurasi Database MySQL (Opsional)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="Nama Database (misal: db_article)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="User DB (misal: user_inpartner)"
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="password"
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                    placeholder="Password Database MySQL"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !appName.trim() || !targetDomain || Boolean(collidingEndpoint)}
                    className="flex items-center space-x-2 px-5 py-2 text-sm rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>{isCreating ? 'Menyiapkan...' : collidingEndpoint ? 'Endpoint Bertabrakan' : 'Buat Aplikasi'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Deploy ZIP */}
      <AnimatePresence>
        {deployingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    Deploy Source Code: {deployingApp.app_name}
                  </h3>
                </div>
                <button
                  onClick={() => setDeployingApp(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDeployZip} className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-2 hover:border-red-500 transition-colors">
                  <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Pilih arsip source code Laravel (.zip)
                  </div>
                  <p className="text-xs text-zinc-500">
                    Tips: Kompres folder backend tanpa menyertakan folder <code>vendor</code> dan <code>.env</code> lokal.
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20 cursor-pointer pt-2"
                  />
                </div>

                {deployLogs && (
                  <div className="p-3 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap border border-zinc-800">
                    {deployLogs}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeployingApp(null)}
                    className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isDeploying || !zipFile}
                    className="flex items-center space-x-2 px-5 py-2 text-sm rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isDeploying ? 'Mendeploy...' : 'Mulai Deploy'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Artisan Console */}
      <AnimatePresence>
        {artisanApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    Artisan Console: {artisanApp.app_name}
                  </h3>
                </div>
                <button
                  onClick={() => setArtisanApp(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-medium text-zinc-500 mr-1">Shortcut:</span>
                {[
                  { label: 'php artisan migrate --force', cmd: 'migrate --force' },
                  { label: 'migrate:status', cmd: 'migrate:status' },
                  { label: 'db:seed --force', cmd: 'db:seed --force' },
                  { label: 'optimize:clear', cmd: 'optimize:clear' },
                  { label: 'config:cache', cmd: 'config:cache' },
                  { label: 'route:cache', cmd: 'route:cache' },
                  { label: 'key:generate', cmd: 'key:generate' }
                ].map((item) => (
                  <button
                    key={item.cmd}
                    onClick={() => {
                      setCustomCommand(item.cmd);
                      handleRunArtisan(item.cmd);
                    }}
                    disabled={isRunningArtisan}
                    className="px-2.5 py-1 text-xs rounded-lg font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Command Input */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-mono text-xs">php artisan</span>
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="misal: migrate --force"
                    className="w-full pl-28 pr-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  onClick={() => handleRunArtisan()}
                  disabled={isRunningArtisan || !customCommand.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isRunningArtisan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Jalankan</span>
                </button>
              </div>

              {/* Terminal Output */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 h-64 overflow-y-auto whitespace-pre-wrap">
                {artisanOutput || '$ php artisan console ready.\nKetik perintah artisan atau klik shortcut di atas untuk menjalankan migration dan optimasi.'}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setArtisanApp(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: .env Editor */}
      <AnimatePresence>
        {envApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    Konfigurasi Environment (.env): {envApp.app_name}
                  </h3>
                </div>
                <button
                  onClick={() => setEnvApp(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingEnv ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500 mb-2" />
                  <span className="text-xs text-zinc-500">Memuat isi file .env...</span>
                </div>
              ) : (
                <textarea
                  rows={14}
                  value={envContent}
                  onChange={(e) => setEnvContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-zinc-500">
                  Perubahan akan otomatis membersihkan cache konfigurasi Laravel (<code>config:clear</code>).
                </span>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setEnvApp(null)}
                    className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEnv}
                    disabled={isSavingEnv}
                    className="flex items-center space-x-1.5 px-5 py-2 text-sm rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEnv ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    <span>{isSavingEnv ? 'Menyimpan...' : 'Simpan .env'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Logs Viewer */}
      <AnimatePresence>
        {logsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    Laravel Log Viewer: {logsApp.app_name}
                  </h3>
                </div>
                <button
                  onClick={() => setLogsApp(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingLogs ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500 mb-2" />
                  <span className="text-xs text-zinc-500">Membaca log dari storage/logs/laravel.log...</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 h-80 overflow-y-auto whitespace-pre-wrap">
                  {logsContent}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setLogsApp(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
