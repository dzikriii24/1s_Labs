import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  Plus,
  Play,
  Square,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Terminal,
  Globe,
  X,
  Server,
  Layers,
  Loader2,
  Package,
  Folder,
  Settings2,
  Copy,
  Check,
  MoreVertical,
  RotateCw,
  Code
} from 'lucide-react';
import { api, PythonApp, DomainRecord, OccupiedEndpoint } from '../../services/api';
import notify from '../../lib/notify';
import { PythonFileManagerModal } from './PythonFileManagerModal';

interface PythonAppsTabProps {
  onNavigateToDomains?: () => void;
}

export const PythonAppsTab: React.FC<PythonAppsTabProps> = ({ onNavigateToDomains }) => {
  const [apps, setApps] = useState<PythonApp[]>([]);
  const [versions, setVersions] = useState<string[]>(['3.11.17', '3.9.23', '3.8.20']);
  const [userDomains, setUserDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [actionLoadingApp, setActionLoadingApp] = useState<string | null>(null);
  const [pingingAppName, setPingingAppName] = useState<string | null>(null);
  const [openMenuAppName, setOpenMenuAppName] = useState<string | null>(null);
  const [copiedUrlApp, setCopiedUrlApp] = useState<string | null>(null);

  // Active Modals
  const [managingAppFileManager, setManagingAppFileManager] = useState<PythonApp | null>(null);
  const [inspectingApp, setInspectingApp] = useState<PythonApp | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [appUri, setAppUri] = useState('api');
  const [pythonVersion, setPythonVersion] = useState('3.11.17');
  const [startupFile, setStartupFile] = useState('passenger_wsgi.py');
  const [entryPoint, setEntryPoint] = useState('application');
  const [creating, setCreating] = useState(false);

  // .env Editor Modal State
  const [envApp, setEnvApp] = useState<PythonApp | null>(null);
  const [envContent, setEnvContent] = useState('');
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Logs Modal State
  const [logsApp, setLogsApp] = useState<PythonApp | null>(null);
  const [logsContent, setLogsContent] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Pip Modal State
  const [pipApp, setPipApp] = useState<PythonApp | null>(null);
  const [reqFile, setReqFile] = useState('requirements.txt');
  const [pipRunning, setPipRunning] = useState(false);
  const [pipOutput, setPipOutput] = useState('');

  // Cross-framework Occupied Endpoints
  const [occupiedEndpoints, setOccupiedEndpoints] = useState<OccupiedEndpoint[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, verRes, domRes, occRes] = await Promise.all([
        api.python.getApps().catch((err) => {
          console.error('[PythonAppsTab] getApps failed:', err);
          return { success: false, apps: [], message: err.message };
        }),
        api.python.getVersions().catch(() => ({ success: false, versions: ['3.11.17', '3.9.23', '3.8.20'], default: '3.11.17' })),
        api.domains.list().catch(() => ({ success: false, domains: [] })),
        api.python.getOccupiedEndpoints().catch(() => ({ success: false, endpoints: [] }))
      ]);

      if (appsRes?.success && appsRes.apps) {
        setApps(appsRes.apps);
      } else if (appsRes && !appsRes.success && (appsRes as any).message) {
        console.warn('[PythonAppsTab] apps warning:', (appsRes as any).message);
      }
      if (verRes?.success && verRes.versions) {
        setVersions(verRes.versions);
        if (verRes.default) setPythonVersion(verRes.default);
      }
      if (domRes?.success && domRes.domains) {
        setUserDomains(domRes.domains);
        if (domRes.domains.length > 0 && !targetDomain) {
          setTargetDomain(domRes.domains[0].domain);
        }
      }
      if (occRes?.success && occRes.endpoints) {
        setOccupiedEndpoints(occRes.endpoints);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat data aplikasi Python.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (app: PythonApp, action: 'start' | 'stop' | 'restart') => {
    const key = app.app_name;
    try {
      setActionLoadingApp(key);
      await api.python.action(app.app_name, action);
      notify.success(`Aksi ${action} pada aplikasi ${app.app_name} berhasil.`);
      await loadData();
    } catch (err: any) {
      notify.error(err.message || `Gagal mengeksekusi ${action} aplikasi.`);
    } finally {
      setActionLoadingApp(null);
    }
  };

  const handleHealthCheck = async (app: PythonApp) => {
    try {
      setPingingAppName(app.app_name);
      const res = await api.python.checkHealth(app.app_name);
      if (res.success) {
        if (res.health.healthy) {
          notify.success(`API Sehat! Respon ${res.health.status} (${res.health.responseTimeMs}ms)`);
        } else {
          notify.warn(`API Merespon status ${res.health.status}: ${res.health.statusText}`);
        }
        await loadData();
      }
    } catch (err: any) {
      notify.error('Gagal melakukan health check.');
    } finally {
      setPingingAppName(null);
    }
  };

  const handleOpenEnv = async (app: PythonApp) => {
    setEnvApp(app);
    setIsLoadingEnv(true);
    try {
      const res = await api.python.getEnv(app.app_name);
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
      const res = await api.python.updateEnv(envApp.app_name, envContent);
      if (res.success) {
        notify.success('Konfigurasi .env berhasil disimpan & server direstart!');
        setEnvApp(null);
        await loadData();
      }
    } catch (e: any) {
      notify.error(e.message || 'Gagal menyimpan .env.');
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleOpenLogs = async (app: PythonApp) => {
    setLogsApp(app);
    setIsLoadingLogs(true);
    try {
      const res = await api.python.getLogs(app.app_name);
      if (res.success) {
        setLogsContent(res.logs);
      }
    } catch (e: any) {
      notify.error('Gagal memuat log server Python.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleDelete = async (app: PythonApp) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus aplikasi Python "${app.app_name}"? Tindakan ini akan melepas konfigurasi CloudLinux Selector.`)) {
      return;
    }
    const key = app.app_name;
    try {
      setActionLoadingApp(key);
      await api.python.destroyApp(app.app_name);
      notify.success(`Aplikasi ${app.app_name} berhasil dihapus.`);
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus aplikasi.');
    } finally {
      setActionLoadingApp(null);
    }
  };

  const handleRunPipInstall = async () => {
    if (!pipApp) return;
    try {
      setPipRunning(true);
      setPipOutput(`$ pip install -r ${reqFile}\nSedang mengunduh modul di virtualenv server...`);
      const res = await api.python.installModules(pipApp.app_name, reqFile);
      setPipOutput(`$ pip install -r ${reqFile}\n\n${typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)}\n\nInstalasi selesai!`);
      notify.success(`Instalasi dependensi untuk ${pipApp.app_name} selesai.`);
      await loadData();
    } catch (err: any) {
      setPipOutput(prev => prev + `\n\nERROR:\n${err.message}`);
      notify.error(err.message || 'Gagal menginstal dependensi pip.');
    } finally {
      setPipRunning(false);
    }
  };

  const handleCopyUrl = (appName: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlApp(appName);
    notify.success('URL disalin ke clipboard');
    setTimeout(() => setCopiedUrlApp(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !targetDomain) {
      notify.error('Mohon lengkapi nama aplikasi dan domain tujuan.');
      return;
    }

    const cleanUri = appUri.trim().replace(/^\/+/, '');
    const isConflict = occupiedEndpoints.some(
      ep => ep.domain.toLowerCase() === targetDomain.toLowerCase() && ep.app_uri.replace(/^\/+/, '') === cleanUri
    );

    if (isConflict) {
      if (!window.confirm(`Peringatan: Endpoint /${cleanUri} sudah digunakan oleh aplikasi lain di domain ${targetDomain}. Tetap lanjutkan?`)) {
        return;
      }
    }

    try {
      setCreating(true);
      await api.python.createApp({
        appName,
        targetDomain,
        appUri: cleanUri,
        pythonVersion,
        startupFile,
        entryPoint
      });
      notify.success('Aplikasi Python berhasil dibuat!');
      setIsCreateModalOpen(false);
      setAppName('');
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal membuat aplikasi Python.');
    } finally {
      setCreating(false);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.domain && app.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.app_uri && app.app_uri.toLowerCase().includes(searchQuery.toLowerCase()));

    const isRunning = app.app_status === 'started' || app.status === 'running';
    if (statusFilter === 'running') return matchesSearch && isRunning;
    if (statusFilter === 'stopped') return matchesSearch && !isRunning;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* TOP BANNER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileCode className="w-5 h-5 text-amber-500" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Python Application Manager
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
              FastAPI &bull; Flask &bull; Django
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Deploy dan kelola aplikasi Python Anda dengan CloudLinux Passenger WSGI dan isolasi virtualenv mandiri. Dilengkapi File Manager interaktif, live code editor, pip installer, dan endpoint collision detector.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl font-semibold text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Aplikasi Python Baru
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Total Aplikasi</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{apps.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Status Running</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {apps.filter(a => a.app_status === 'started' || a.status === 'running').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Virtualenv Aktif</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {apps.filter(a => a.virtualenv?.activate_path).length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-zinc-500">Default Runtime</span>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mt-1">Python 3.11</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama aplikasi, domain, atau URI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FileCode className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="running">Berjalan (Running)</option>
            <option value="stopped">Berhenti (Stopped)</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-medium transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* APPLICATIONS CARD LIST (2-BARIS PER APLIKASI, NO HORIZONTAL SCROLL) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-500 font-mono">Memuat konfigurasi aplikasi Python di server CloudLinux...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileCode className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {apps.length === 0 ? 'Belum Ada Aplikasi Python' : 'Tidak Ada Aplikasi yang Cocok'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-6">
            Deploy API Python modern (FastAPI / Flask) dengan satu klik. Terintegrasi penuh dengan WSGI daemon dan subpath routing.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Buat Aplikasi Python Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredApps.map((app) => {
            const isRunning = app.app_status === 'started' || app.status === 'running';
            const isActionBusy = actionLoadingApp === app.app_name;
            const isPinging = pingingAppName === app.app_name;
            const fullUrl = app.app_url || (app.domain ? `https://${app.domain}${app.app_uri ? `/${app.app_uri.replace(/^\/+/, '')}` : ''}` : null);

            return (
              <div
                key={app.app_name}
                className={`relative bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150 space-y-3 ${
                  openMenuAppName === app.app_name ? 'z-20' : 'z-auto'
                }`}
              >
                {/* BARIS 1: Header (Identitas Utama, Status, URL, dan Aksi Cepat) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Sisi Kiri: Icon + Nama + Badge Status + URL */}
                  <div className="flex items-start sm:items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <FileCode className="w-5 h-5 text-amber-300" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                        {app.app_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
                        Python {app.version || '3.11'}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                          isRunning
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        {isRunning ? 'Running' : 'Stopped'}
                      </span>

                      {/* Health Ping Badge */}
                      {fullUrl && (
                        <button
                          onClick={() => handleHealthCheck(app)}
                          disabled={isPinging}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                          title="Klik untuk ping endpoint API"
                        >
                          <Activity className={`w-2.5 h-2.5 ${isPinging ? 'animate-spin text-blue-500' : 'text-emerald-500'}`} />
                          <span>{isPinging ? 'Pinging...' : 'Ping API'}</span>
                        </button>
                      )}

                      {/* App URL */}
                      {fullUrl ? (
                        <div className="flex items-center gap-1 text-xs">
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>{fullUrl}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                          <button
                            onClick={() => handleCopyUrl(app.app_name, fullUrl)}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer p-0.5"
                            title="Salin URL"
                          >
                            {copiedUrlApp === app.app_name ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Domain belum dihubungkan</span>
                      )}
                    </div>
                  </div>

                  {/* Sisi Kanan: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* File Manager Button */}
                    <button
                      onClick={() => setManagingAppFileManager(app)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      title="Buka File Manager Python"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      <span>Files</span>
                    </button>

                    {/* Quick Pip Install */}
                    <button
                      onClick={() => {
                        setPipApp(app);
                        setPipOutput('');
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Instal dependensi pip"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Pip</span>
                    </button>

                    {/* Start / Stop Toggle */}
                    {isRunning ? (
                      <button
                        onClick={() => handleAction(app, 'stop')}
                        disabled={isActionBusy}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Hentikan Aplikasi"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(app, 'start')}
                        disabled={isActionBusy}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Jalankan Aplikasi"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    )}

                    {/* Titik Tiga Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuAppName(openMenuAppName === app.app_name ? null : app.app_name);
                        }}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          openMenuAppName === app.app_name
                            ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title="Peralatan Lainnya"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuAppName === app.app_name && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuAppName(null);
                            }}
                          />
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-40 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                setInspectingApp(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <Code className="w-3.5 h-3.5 text-blue-500" />
                              <span>Detail Spesifikasi & Path</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                setManagingAppFileManager(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <Folder className="w-3.5 h-3.5 text-amber-500" />
                              <span>Kelola File & Upload (Manager)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                handleOpenEnv(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Editor .env Server</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                handleHealthCheck(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <Activity className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Health Check (Ping Endpoint)</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                handleAction(app, 'restart');
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                              <span>Restart WSGI Passenger</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                handleOpenLogs(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition"
                            >
                              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Lihat Log Server (stderr.log)</span>
                            </button>

                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                            <button
                              onClick={() => {
                                setOpenMenuAppName(null);
                                handleDelete(app);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Aplikasi Python</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* BARIS 2: Grid 5-Kolom Spesifikasi Teknis */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Versi Python</span>
                    <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                      v{app.version || '3.11'} &bull; <span className="capitalize font-sans font-medium text-zinc-500">WSGI</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Domain & URI</span>
                    <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px] truncate" title={`${app.domain}/${app.app_uri}`}>
                      {app.domain ? `${app.domain}/${app.app_uri || 'api'}` : '-'}
                    </p>
                  </div>

                  <div
                    onClick={() => setManagingAppFileManager(app)}
                    className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition group"
                    title="Klik untuk membuka File Manager"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span>App Root</span>
                      <Folder className="w-2.5 h-2.5 text-amber-500 opacity-60 group-hover:opacity-100" />
                    </div>
                    <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px] truncate" title={app.app_name}>
                      ~/{app.app_name}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Startup & Entry</span>
                    <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px] truncate">
                      {app.startup_file || 'passenger_wsgi.py'} ({app.entry_point || 'application'})
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Virtualenv</span>
                    <p className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px] truncate" title={app.virtualenv?.activate_path || 'Isolated'}>
                      {app.virtualenv?.activate_path ? 'Aktif (Isolasi)' : 'Default'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: PYTHON FILE MANAGER */}
      {managingAppFileManager && (
        <PythonFileManagerModal
          isOpen={Boolean(managingAppFileManager)}
          onClose={() => setManagingAppFileManager(null)}
          app={managingAppFileManager}
          onAppRestarted={loadData}
        />
      )}

      {/* MODAL: CREATE PYTHON APP */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Buat Aplikasi Python Baru
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Konfigurasi daemon WSGI CloudLinux untuk FastAPI, Flask, atau Django
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Aplikasi (Slug) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="misal: my-fastapi, ai-agent"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Hanya huruf kecil, angka, dan tanda hubung (-).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Domain / Subdomain Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">Pilih Domain...</option>
                    {userDomains.map((d) => (
                      <option key={d.id || d.domain} value={d.domain}>
                        {d.domain}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Application URI / Endpoint
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-700">
                      /
                    </span>
                    <input
                      type="text"
                      placeholder="api (kosongkan jika root domain)"
                      value={appUri}
                      onChange={(e) => setAppUri(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\/]/g, ''))}
                      className="w-full px-3 py-2 rounded-r-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    URL: {targetDomain ? `https://${targetDomain}/${appUri ? appUri.replace(/^\/+/, '') : ''}` : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Versi Python
                  </label>
                  <select
                    value={pythonVersion}
                    onChange={(e) => setPythonVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    {versions.map((ver) => (
                      <option key={ver} value={ver}>
                        Python {ver}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ENDPOINT COLLISION WARNING */}
              {targetDomain && appUri && (
                (() => {
                  const cleanUri = appUri.trim().replace(/^\/+/, '');
                  const conflict = occupiedEndpoints.find(
                    ep => ep.domain.toLowerCase() === targetDomain.toLowerCase() && ep.app_uri.replace(/^\/+/, '') === cleanUri
                  );
                  if (conflict) {
                    return (
                      <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">Perhatian: Endpoint Sudah Digunakan</p>
                          <p className="text-[11px] mt-0.5">
                            Endpoint <code>/{cleanUri}</code> pada domain ini sudah dipakai oleh aplikasi <strong>{conflict.app_name}</strong> ({conflict.platform.toUpperCase()}). Harap ubah URI agar tidak saling menabrak.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? 'Mendaftarkan ke CloudLinux...' : 'Buat Aplikasi Python'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: .ENV EDITOR */}
      {envApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Editor .env &bull; {envApp.app_name}
                </h3>
              </div>
              <button onClick={() => setEnvApp(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEnv ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-xs text-zinc-400 font-mono">Membaca file .env...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  Perubahan variabel lingkungan akan langsung disimpan ke file <code>.env</code> dan server akan otomatis me-reload konfigurasi.
                </p>
                <textarea
                  value={envContent}
                  onChange={(e) => setEnvContent(e.target.value)}
                  className="w-full h-72 p-4 font-mono text-xs bg-zinc-950 text-emerald-400 rounded-2xl border border-zinc-900 outline-none resize-none leading-relaxed"
                  placeholder="KEY=VALUE"
                  spellCheck={false}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEnvApp(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEnv}
                    disabled={isSavingEnv}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSavingEnv ? 'Menyimpan & Restarting...' : 'Simpan Konfigurasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SERVER LOGS */}
      {logsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Log Server Python &bull; {logsApp.app_name}
                </h3>
              </div>
              <button onClick={() => setLogsApp(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-xs text-zinc-400 font-mono">Mengambil berkas log server...</p>
              </div>
            ) : (
              <div className="bg-zinc-950 text-zinc-300 font-mono text-xs p-4 rounded-2xl h-80 overflow-y-auto whitespace-pre-wrap shadow-inner border border-zinc-900">
                {logsContent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PIP INSTALLER */}
      {pipApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Pip Package Manager &bull; {pipApp.app_name}
                </h3>
              </div>
              <button onClick={() => setPipApp(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  File Dependensi (relatif dari root aplikasi)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reqFile}
                    onChange={(e) => setReqFile(e.target.value)}
                    placeholder="requirements.txt"
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleRunPipInstall}
                    disabled={pipRunning}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{pipRunning ? 'Menginstal...' : 'Jalankan Pip'}</span>
                  </button>
                </div>
              </div>

              {pipOutput && (
                <div className="bg-zinc-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap shadow-inner border border-zinc-900">
                  {pipOutput}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL SPESIFIKASI */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Spesifikasi & Konfigurasi &bull; {inspectingApp.app_name}
                </h3>
              </div>
              <button onClick={() => setInspectingApp(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Nama Aplikasi</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{inspectingApp.app_name}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Versi Python</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{inspectingApp.version || '3.11'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Domain</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inspectingApp.domain || '-'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">URI Prefix</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">/{inspectingApp.app_uri || 'api'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Startup File</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{inspectingApp.startup_file || 'passenger_wsgi.py'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Entry Point</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{inspectingApp.entry_point || 'application'}</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Virtualenv Path</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-xs">{inspectingApp.virtualenv?.activate_path || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 cursor-pointer"
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
