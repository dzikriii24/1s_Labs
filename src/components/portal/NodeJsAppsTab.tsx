import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Plus,
  Play,
  Square,
  RefreshCw,
  Upload,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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
  Edit3,
  Code
} from 'lucide-react';
import { api, NodeJsApp, DomainRecord } from '../../services/api';
import notify from '../../lib/notify';
import { EditAppConfigModal } from './EditAppConfigModal';
import { NodeFileManagerModal } from './NodeFileManagerModal';

interface NodeJsAppsTabProps {
  onNavigateToDomains: () => void;
}

export const NodeJsAppsTab: React.FC<NodeJsAppsTabProps> = ({ onNavigateToDomains }) => {
  const [apps, setApps] = useState<NodeJsApp[]>([]);
  const [versions, setVersions] = useState<string[]>(['22.23.4', '20.20.2', '24.22.1']);
  const [userDomains, setUserDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreePlanUser, setIsFreePlanUser] = useState(false);

  // Active Modals
  const [managingAppFileManager, setManagingAppFileManager] = useState<NodeJsApp | null>(null);
  const [editingAppConfig, setEditingAppConfig] = useState<NodeJsApp | null>(null);

  // Create App Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [appUri, setAppUri] = useState('api');
  const [nodeVersion, setNodeVersion] = useState('22.23.4');
  const [appMode, setAppMode] = useState<'production' | 'development'>('production');
  const [startupFile, setStartupFile] = useState('index.js');
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([
    { key: 'PORT', value: '3000' },
    { key: 'NODE_ENV', value: 'production' }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Deploy ZIP Modal State
  const [deployingApp, setDeployingApp] = useState<NodeJsApp | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);

  // Logs Modal State
  const [viewingLogsApp, setViewingLogsApp] = useState<NodeJsApp | null>(null);
  const [logsContent, setLogsContent] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Health Check trigger state
  const [pingingAppId, setPingingAppId] = useState<number | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, verRes, domRes, freePlanRes] = await Promise.all([
        api.nodejs.listApps(),
        api.nodejs.getVersions(),
        api.domains.list(),
        api.freePlan.getStatus().catch(() => ({ success: false, alreadyClaimed: false, claim: null }))
      ]);

      if (appsRes.success) setApps(appsRes.applications);
      if (verRes.success) {
        setVersions(verRes.versions);
        if (verRes.default) setNodeVersion(verRes.default);
      }
      if (domRes.success) {
        setUserDomains(domRes.domains);
        if (domRes.domains.length > 0 && !targetDomain) {
          setTargetDomain(domRes.domains[0].domain);
        }
      }
      if (freePlanRes && (freePlanRes.alreadyClaimed || freePlanRes.claim)) {
        setIsFreePlanUser(true);
      }
    } catch (err: any) {
      console.error('Fetch Node.js data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !targetDomain) return;

    setIsCreating(true);
    setCreateError(null);

    const envMap: Record<string, string> = {};
    envPairs.forEach(p => {
      if (p.key.trim()) envMap[p.key.trim()] = p.value;
    });

    try {
      await api.nodejs.createApp({
        app_name: appName.trim(),
        domain: targetDomain,
        app_uri: appUri.trim(),
        nodejs_version: nodeVersion,
        app_mode: appMode,
        startup_file: startupFile.trim(),
        env_vars: envMap
      });

      setIsCreateModalOpen(false);
      setAppName('');
      await fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat aplikasi Node.js.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAction = async (appId: number, action: 'start' | 'stop' | 'restart') => {
    setActionInProgressId(appId);
    try {
      await api.nodejs.action(appId, action);
      notify.success(`Aksi ${action} berhasil dieksekusi.`);
      await fetchData();
    } catch (err: any) {
      notify.error(err.message || `Gagal menjalankan ${action}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleHealthCheck = async (appId: number) => {
    setPingingAppId(appId);
    try {
      const res = await api.nodejs.checkHealth(appId);
      notify.success(res.message || 'Pemeriksaan status aplikasi berhasil.');
      await fetchData();
    } catch (err: any) {
      notify.error('Health check error: ' + (err.message || 'Tidak ada respons'));
    } finally {
      setPingingAppId(null);
    }
  };

  const handleOpenLogs = async (app: NodeJsApp) => {
    setViewingLogsApp(app);
    setLoadingLogs(true);
    try {
      const res = await api.nodejs.getLogs(app.id);
      setLogsContent(res.logs || 'Tidak ada log yang tercatat.');
    } catch (err: any) {
      setLogsContent('Gagal memuat log: ' + err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeployZip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployingApp || !zipFile) return;

    setIsDeploying(true);
    setDeployError(null);
    setDeploySuccess(null);

    try {
      const res = await api.nodejs.deployZip(deployingApp.id, zipFile);
      setDeploySuccess(`Deployment #${res.deployment_number} berhasil! Aplikasi telah direstart.`);
      setZipFile(null);
      await fetchData();
      setTimeout(() => {
        setDeployingApp(null);
        setDeploySuccess(null);
      }, 2000);
    } catch (err: any) {
      setDeployError(err.message || 'Gagal mengunggah dan mendepoloy ZIP.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeleteApp = async (app: NodeJsApp) => {
    const ok = await notify.confirm({
      title: 'Hapus Aplikasi Node.js',
      text: `Hapus aplikasi Node.js '${app.app_name}' (${app.app_url})? Direktori fisik dan konfigurasi cPanel akan dibersihkan.`,
      confirmButtonText: 'Ya, Hapus Aplikasi',
      isDanger: true
    });
    if (!ok) return;

    try {
      await api.nodejs.deleteApp(app.id);
      notify.success('Aplikasi Node.js berhasil dihapus.');
      await fetchData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus aplikasi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New App Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-zinc-900 dark:text-white" />
            Node.js Application Manager
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deploy, otak-atik kode via File Manager, dan konfigurasi runtime API Node.js secara langsung tanpa perlu cPanel.
          </p>
        </div>

        {isFreePlanUser && apps.length >= 1 ? (
          <button
            onClick={() => notify.info('Akun Anda menggunakan program Free Plan (kuota 1 aplikasi Node.js). Silakan upgrade ke paket Cloud Hosting untuk menambah aplikasi baru.')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold text-xs transition cursor-not-allowed opacity-90 shadow-sm"
            title="Batas kuota Free Plan telah tercapai (1/1)"
          >
            <Plus className="w-4 h-4 text-zinc-400" />
            <span>Maks. 1 App (Free Plan)</span>
          </button>
        ) : (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl font-semibold text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Aplikasi Node.js Baru
          </button>
        )}
      </div>

      {/* Free Plan 1-App Limit Banner */}
      {isFreePlanUser && apps.length >= 1 && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 shrink-0">
              <Cpu className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">Program Free Plan: Kuota 1/1 Aplikasi Node.js Aktif</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Anda dapat mengotak-atik kode file via File Manager, mengubah versi Node.js, mode, dan startup file pada aplikasi ini. Untuk menambah aplikasi baru, beralihlah ke Cloud Hosting.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToDomains}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 transition whitespace-nowrap self-start sm:self-auto"
          >
            Upgrade Cloud Hosting
          </button>
        </div>
      )}

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
          <span className="text-xs font-medium text-gray-500">Versi Tersedia</span>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{versions.length}</p>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-gray-500">Memuat konfigurasi Node.js aplikasi...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">
          <Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Belum Ada Aplikasi Node.js</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-6">
            Anda dapat membuat backend API berbasis Express atau Fastify yang otomatis diarahkan ke subdomain Anda (contoh: <code>nama.1slabs.my.id/api</code>).
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Buat Node.js API Sekarang
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
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:border-indigo-500/40 transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {app.app_name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        app.status === 'running'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {app.status === 'running' ? 'Running' : 'Stopped'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        app.health_status === 'healthy'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : app.health_status === 'error'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {app.health_status === 'healthy'
                          ? `Sehat (${app.last_response_time_ms || 12} ms)`
                          : app.health_status === 'error'
                          ? 'Gagal Merespon'
                          : 'Belum Dicek'}
                      </span>
                    </div>

                    <a
                      href={app.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      {app.app_url}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Operational Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setManagingAppFileManager(app)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      File Manager
                    </button>

                    <button
                      onClick={() => setEditingAppConfig(app)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition"
                      title="Edit Versi Node.js, Mode, Startup File, dan Env Vars"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Pengaturan
                    </button>

                    <button
                      onClick={() => handleHealthCheck(app.id)}
                      disabled={isPinging}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition"
                      title="Ping live API endpoint"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-zinc-900 dark:text-white' : 'text-emerald-500'}`} />
                      Health Check
                    </button>

                    {app.status === 'running' ? (
                      <button
                        onClick={() => handleAction(app.id, 'stop')}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center gap-1.5 transition"
                      >
                        <Square className="w-3.5 h-3.5" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(app.id, 'start')}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(app.id, 'restart')}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                      Restart
                    </button>

                    <button
                      onClick={() => setDeployingApp(app)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Deploy ZIP
                    </button>

                    <button
                      onClick={() => handleOpenLogs(app)}
                      className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Lihat Log Server"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteApp(app)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                      title="Hapus Aplikasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specs metadata strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                  <div
                    onClick={() => setEditingAppConfig(app)}
                    className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/40 cursor-pointer transition group/spec"
                    title="Klik untuk mengubah versi Node.js"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Node.js Version:</span>
                      <Edit3 className="w-3 h-3 opacity-0 group-hover/spec:opacity-100 transition" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono mt-0.5">v{app.nodejs_version}</p>
                  </div>

                  <div
                    onClick={() => setEditingAppConfig(app)}
                    className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/40 cursor-pointer transition group/spec"
                    title="Klik untuk mengubah Mode aplikasi"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Mode:</span>
                      <Edit3 className="w-3 h-3 opacity-0 group-hover/spec:opacity-100 transition" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize mt-0.5">{app.app_mode}</p>
                  </div>

                  <div
                    onClick={() => setEditingAppConfig(app)}
                    className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/40 cursor-pointer transition group/spec"
                    title="Klik untuk mengubah startup file"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Startup File:</span>
                      <Edit3 className="w-3 h-3 opacity-0 group-hover/spec:opacity-100 transition" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono mt-0.5">{app.startup_file}</p>
                  </div>

                  <div
                    onClick={() => setManagingAppFileManager(app)}
                    className="p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/40 cursor-pointer transition group/spec"
                    title="Buka Application Root di File Manager"
                  >
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Application Root:</span>
                      <Folder className="w-3 h-3 text-amber-500 opacity-0 group-hover/spec:opacity-100 transition" />
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono truncate mt-0.5" title={app.app_root}>
                      ~/{app.app_root}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Buat Aplikasi Node.js Baru */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Buat Aplikasi Node.js Baru
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApp} className="space-y-4">
                {/* App Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="contoh: api-toko, auth-service, inventory-be"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Target Domain & URI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                      Pilih Domain
                    </label>
                    <select
                      value={targetDomain}
                      onChange={(e) => setTargetDomain(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {userDomains.map(d => (
                        <option key={d.id} value={d.domain}>{d.domain}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                      Application URI
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                      <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-700 text-gray-500 font-mono text-xs select-none">
                        /
                      </span>
                      <input
                        type="text"
                        value={appUri}
                        onChange={(e) => setAppUri(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="api"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview URL */}
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                  Target Endpoint: <strong>https://{targetDomain || 'domainanda.com'}/{appUri || 'api'}</strong>
                </div>

                {/* Node.js Version & Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                      Node.js Version
                    </label>
                    <select
                      value={nodeVersion}
                      onChange={(e) => setNodeVersion(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    >
                      {versions.map(v => (
                        <option key={v} value={v}>Node.js v{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                      Application Mode
                    </label>
                    <select
                      value={appMode}
                      onChange={(e) => setAppMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    >
                      <option value="production">Production</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                      Startup File
                    </label>
                    <input
                      type="text"
                      value={startupFile}
                      onChange={(e) => setStartupFile(e.target.value.trim())}
                      placeholder="index.js"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-mono font-semibold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {createError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {createError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!appName || !targetDomain || isCreating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {isCreating ? 'Mendaftarkan di CloudLinux...' : 'Buat Aplikasi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Deploy Source Code ZIP */}
      <AnimatePresence>
        {deployingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Deploy Source Code ZIP
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Aplikasi: <strong>{deployingApp.app_name}</strong> &bull; Ekstrak otomatis & npm install.
                </p>
              </div>

              <form onSubmit={handleDeployZip} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-indigo-500 transition">
                  <FileCode className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <span>{zipFile ? zipFile.name : 'Pilih file arsip .zip project'}</span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">Maksimum ukuran 50 MB</p>
                </div>

                {deployError && (
                  <p className="text-xs text-rose-600 font-medium">{deployError}</p>
                )}

                {deploySuccess && (
                  <p className="text-xs text-emerald-600 font-bold">{deploySuccess}</p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeployingApp(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!zipFile || isDeploying}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {isDeploying ? 'Mengunggah & Mengekstrak...' : 'Mulai Deploy'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: View Application Logs */}
      <AnimatePresence>
        {viewingLogsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Server Logs: {viewingLogsApp.app_name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingLogsApp(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-950 text-gray-200 p-4 rounded-xl font-mono text-xs max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all border border-gray-800">
                {loadingLogs ? 'Memuat log stderr...' : logsContent}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingLogsApp(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Integrated File Manager */}
      {managingAppFileManager && (
        <NodeFileManagerModal
          isOpen={Boolean(managingAppFileManager)}
          onClose={() => setManagingAppFileManager(null)}
          app={managingAppFileManager}
          onAppRestarted={fetchData}
        />
      )}

      {/* MODAL: Edit App Configuration */}
      {editingAppConfig && (
        <EditAppConfigModal
          isOpen={Boolean(editingAppConfig)}
          onClose={() => setEditingAppConfig(null)}
          app={editingAppConfig}
          availableVersions={versions}
          onConfigSaved={fetchData}
        />
      )}
    </div>
  );
};

