import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Terminal,
  Cpu,
  Layers,
  FileCode,
  Folder,
  RefreshCw
} from 'lucide-react';
import { api, NodeJsApp } from '../../services/api';

interface EditAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: NodeJsApp;
  availableVersions: string[];
  onConfigSaved: () => void;
}

export const EditAppConfigModal: React.FC<EditAppConfigModalProps> = ({
  isOpen,
  onClose,
  app,
  availableVersions,
  onConfigSaved
}) => {
  const [version, setVersion] = useState(app.nodejs_version || '22.23.4');
  const [mode, setMode] = useState<'production' | 'development'>(app.app_mode || 'production');
  const [startupFile, setStartupFile] = useState(app.startup_file || 'index.js');
  
  // Environment variables key-value list
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string; isSecret?: boolean }[]>([]);
  const [loadingAppDetail, setLoadingAppDetail] = useState(false);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVersion(app.nodejs_version || '22.23.4');
      setMode(app.app_mode || 'production');
      setStartupFile(app.startup_file || 'index.js');
      setErrorMessage(null);
      setSuccessMessage(null);

      // Fetch detailed app info to populate env variables
      const loadDetail = async () => {
        try {
          setLoadingAppDetail(true);
          const res = await api.nodejs.getApp(app.id);
          if (res.success && res.application) {
            const masked = res.application.env_vars_masked || {};
            const pairs = Object.entries(masked).map(([k, v]) => ({
              key: k,
              value: v === '••••••' ? '' : v,
              isSecret: true
            }));
            if (pairs.length === 0) {
              setEnvPairs([
                { key: 'PORT', value: '3000' },
                { key: 'NODE_ENV', value: mode }
              ]);
            } else {
              setEnvPairs(pairs);
            }
          }
        } catch (err) {
          console.error('Failed to load app detail:', err);
          setEnvPairs([
            { key: 'PORT', value: '3000' },
            { key: 'NODE_ENV', value: mode }
          ]);
        } finally {
          setLoadingAppDetail(false);
        }
      };

      loadDetail();
    }
  }, [isOpen, app]);

  const handleAddEnvPair = () => {
    setEnvPairs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveEnvPair = (index: number) => {
    setEnvPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnvKeyChange = (index: number, val: string) => {
    const cleanKey = val.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setEnvPairs(prev => prev.map((p, i) => (i === index ? { ...p, key: cleanKey } : p)));
  };

  const handleEnvValChange = (index: number, val: string) => {
    setEnvPairs(prev => prev.map((p, i) => (i === index ? { ...p, value: val } : p)));
  };

  const toggleShowValue = (index: number) => {
    setShowValues(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupFile.trim()) {
      setErrorMessage('Startup file tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const envMap: Record<string, string> = {};
    envPairs.forEach(p => {
      const cleanK = p.key.trim();
      if (cleanK) {
        envMap[cleanK] = p.value;
      }
    });

    try {
      const res = await api.nodejs.updateConfig(app.id, {
        nodejs_version: version,
        app_mode: mode,
        startup_file: startupFile.trim(),
        env_vars: envMap
      });

      if (res.success) {
        setSuccessMessage('Konfigurasi berhasil disimpan! Server Node.js telah direstart.');
        onConfigSaved();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan konfigurasi aplikasi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Pengaturan Aplikasi: {app.app_name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ubah versi runtime, mode eksekusi, startup file, dan environment variables.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Notifications */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Application Root Info (Read Only) */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-400">Application Root Fisik:</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  ~/{app.app_root}
                </span>
              </div>
              <div className="text-zinc-400 font-mono text-[11px]">
                {app.domain}/{app.app_uri}
              </div>
            </div>

            {/* Version & Mode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Node.js Version */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  Node.js Version
                </label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {availableVersions.map((v) => (
                    <option key={v} value={v}>
                      Node.js v{v} {v === '22.23.4' ? '(Direkomendasikan)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Virtual environment CloudLinux akan beralih ke versi yang dipilih.
                </p>
              </div>

              {/* Application Mode */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  Application Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('production')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                      mode === 'production'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Production
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('development')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                      mode === 'development'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Development
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Mode production mengaktifkan caching dan optimasi Passenger.
                </p>
              </div>
            </div>

            {/* Startup File */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                Startup File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={startupFile}
                  onChange={(e) => setStartupFile(e.target.value)}
                  placeholder="index.js"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-zinc-400">Pilihan cepat:</span>
                {['index.js', 'app.js', 'server.js', 'src/index.js'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStartupFile(preset)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono text-[11px] transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Variables */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Environment Variables (.env)
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Konfigurasi kunci rahasia atau port yang otomatis dimuat ke process.env.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEnvPair}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Variabel
                </button>
              </div>

              {loadingAppDetail ? (
                <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  Memuat variabel lingkungan...
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {envPairs.map((pair, index) => {
                    const isVisible = showValues[index];
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pair.key}
                          onChange={(e) => handleEnvKeyChange(index, e.target.value)}
                          placeholder="KEY_NAME"
                          className="w-1/3 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400 uppercase"
                        />
                        <div className="relative flex-1">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={pair.value}
                            onChange={(e) => handleEnvValChange(index, e.target.value)}
                            placeholder="Nilai variabel"
                            className="w-full px-3 py-2 pr-9 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowValue(index)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnvPair(index)}
                          className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                          title="Hapus variabel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan & Me-restart Server...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan & Restart Server
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

