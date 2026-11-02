import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  File,
  FileCode,
  FileText,
  Image as ImageIcon,
  Archive,
  Upload,
  FolderPlus,
  FolderUp,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  HardDrive,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Plus,
  Terminal,
  Play,
  RotateCw,
  Flame,
  Layers,
  Package,
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { api, LaravelApp, FileItem } from '../../services/api';

interface LaravelFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: LaravelApp;
  onAppRestarted?: () => void;
}

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const LaravelFileManagerModal: React.FC<LaravelFileManagerModalProps> = ({
  isOpen,
  onClose,
  app,
  onAppRestarted
}) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [totalUsageFormatted, setTotalUsageFormatted] = useState('0 B');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileTemplate, setNewFileTemplate] = useState<'blank' | 'controller' | 'route' | 'blade' | 'env'>('blank');

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  // In-browser Code Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [saveAndRestart, setSaveAndRestart] = useState(false);

  // Composer install terminal modal state
  const [composerModalOpen, setComposerModalOpen] = useState(false);
  const [composerRunning, setComposerRunning] = useState(false);
  const [composerOutput, setComposerOutput] = useState('');

  // Artisan modal state
  const [artisanModalOpen, setArtisanModalOpen] = useState(false);
  const [artisanCmd, setArtisanCmd] = useState('optimize:clear');
  const [artisanRunning, setArtisanRunning] = useState(false);
  const [artisanOutput, setArtisanOutput] = useState('');

  // Quick App Restart state (cache clear)
  const [isRestartingApp, setIsRestartingApp] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadFiles = async (targetPath = currentPath) => {
    try {
      setLoading(true);
      const res = await api.laravel.files.list(app.id, targetPath);
      if (res.success) {
        setItems(res.items);
        setCurrentPath(res.currentPath);
        setTotalUsageFormatted(res.totalUsageFormatted);
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal memuat daftar file aplikasi Laravel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles('/');
      setNotification(null);
    }
  }, [isOpen, app.id]);

  const handleNavigate = (folderName: string) => {
    const nextPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    loadFiles(nextPath);
  };

  const handleNavigateToBreadcrumb = (index: number, segments: string[]) => {
    if (index === -1) {
      loadFiles('/');
      return;
    }
    const target = '/' + segments.slice(0, index + 1).join('/');
    loadFiles(target);
  };

  const handleOpenFileEditor = async (item: FileItem) => {
    try {
      setLoading(true);
      const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      const res = await api.laravel.files.getContent(app.id, filePath);
      if (res.success) {
        setEditingFile({
          path: res.path,
          name: res.name,
          content: res.content
        });
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuka file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFileContent = async (shouldRestart = false) => {
    if (!editingFile) return;
    try {
      setIsSavingContent(true);
      await api.laravel.files.saveContent(app.id, editingFile.path, editingFile.content, shouldRestart);
      notify('success', shouldRestart ? 'File berhasil disimpan & cache Laravel dibersihkan!' : 'File berhasil disimpan!');
      if (shouldRestart && onAppRestarted) {
        onAppRestarted();
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal menyimpan file.');
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let starterCode = '';
    if (newFileTemplate === 'controller') {
      const className = newFileName.replace(/\.php$/i, '');
      starterCode = `<?php\n\nnamespace App\\Http\\Controllers;\n\nuse Illuminate\\Http\\Request;\n\nclass ${className} extends Controller\n{\n    public function index()\n    {\n        return response()->json([\n            'success' => true,\n            'message' => 'API Controller ${className} is active on 1sLabs Cloud'\n        ]);\n    }\n}\n`;
    } else if (newFileTemplate === 'blade') {
      starterCode = `<!DOCTYPE html>\n<html lang="id">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>{{ config('app.name', 'Laravel') }}</title>\n</head>\n<body style="font-family: system-ui, sans-serif; padding: 2rem; background: #09090b; color: #fff;">\n    <h1>Laravel 1sLabs Cloud</h1>\n    <p>View template berhasil dirender.</p>\n</body>\n</html>\n`;
    } else if (newFileTemplate === 'route') {
      starterCode = `<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::get('/', function () {\n    return response()->json([\n        'status' => 'online',\n        'framework' => 'Laravel ' . app()->version(),\n        'php' => PHP_VERSION\n    ]);\n});\n`;
    } else if (newFileTemplate === 'env') {
      starterCode = `APP_NAME="${app.app_name}"\nAPP_ENV=production\nAPP_KEY=\nAPP_DEBUG=false\nAPP_URL="${app.app_url}"\n\nDB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\n`;
    }

    try {
      await api.laravel.files.createFile(app.id, currentPath, newFileName.trim(), starterCode);
      notify('success', `File '${newFileName}' berhasil dibuat.`);
      setNewFileOpen(false);
      setNewFileName('');
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuat file.');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.laravel.files.createFolder(app.id, currentPath, newFolderName.trim());
      notify('success', `Folder '${newFolderName}' berhasil dibuat.`);
      setNewFolderOpen(false);
      setNewFolderName('');
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuat folder.');
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim() || renameNewName === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    const oldPath = currentPath === '/' ? `/${renameTarget.name}` : `${currentPath}/${renameTarget.name}`;
    const newPath = currentPath === '/' ? `/${renameNewName.trim()}` : `${currentPath}/${renameNewName.trim()}`;
    try {
      await api.laravel.files.rename(app.id, oldPath, newPath);
      notify('success', 'Item berhasil diubah namanya.');
      setRenameTarget(null);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengubah nama item.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetPath = currentPath === '/' ? `/${deleteTarget.name}` : `${currentPath}/${deleteTarget.name}`;
    try {
      await api.laravel.files.delete(app.id, targetPath);
      notify('success', `Item '${deleteTarget.name}' berhasil dihapus.`);
      setDeleteTarget(null);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal menghapus item.');
    }
  };

  const handleQuickRestart = async () => {
    try {
      setIsRestartingApp(true);
      await api.laravel.action(app.id, 'restart');
      notify('success', 'Cache Laravel (optimize, config, view, route) berhasil dibersihkan!');
      if (onAppRestarted) onAppRestarted();
    } catch (err: any) {
      notify('error', err.message || 'Gagal membersihkan cache aplikasi.');
    } finally {
      setIsRestartingApp(false);
    }
  };

  const handleRunComposer = async () => {
    try {
      setComposerRunning(true);
      setComposerOutput('Menjalankan composer install di direktori Laravel...\n\n');
      const res = await api.laravel.runComposerInstall(app.id);
      setComposerOutput(res.output || 'Composer install selesai.');
      notify('success', 'Composer install selesai dan dependency up to date.');
      loadFiles(currentPath);
    } catch (err: any) {
      setComposerOutput(`Error:\n${err.message}`);
      notify('error', err.message || 'Gagal menjalankan composer install.');
    } finally {
      setComposerRunning(false);
    }
  };

  const handleRunArtisan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!artisanCmd.trim()) return;
    try {
      setArtisanRunning(true);
      setArtisanOutput(`$ php artisan ${artisanCmd.trim()}\nMenjalankan perintah di server...\n`);
      const res = await api.laravel.runArtisan(app.id, artisanCmd.trim());
      setArtisanOutput(`$ ${res.command}\n\n${res.output || ''}${res.error ? '\nSTDERR:\n' + res.error : ''}`);
      notify('success', `Artisan ${artisanCmd.trim()} selesai.`);
      loadFiles(currentPath);
    } catch (err: any) {
      setArtisanOutput(`$ php artisan ${artisanCmd}\n\nERROR:\n${err.message}`);
      notify('error', err.message || 'Gagal menjalankan artisan.');
    } finally {
      setArtisanRunning(false);
    }
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    try {
      await api.laravel.files.uploadWithProgress(app.id, currentPath, formData);
      notify('success', `${files.length} file berhasil diunggah.`);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengunggah file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredItems = items.filter(it =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-6xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  File Manager — {app.app_name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-red-500/10 text-red-500 border border-red-500/20 font-semibold">
                  Laravel (PHP {app.php_version})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {totalUsageFormatted}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate max-w-md sm:max-w-xl">
                ~/{app.app_root}{currentPath !== '/' ? currentPath : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleQuickRestart}
              disabled={isRestartingApp}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Bersihkan cache optimize, config, dan route Laravel"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRestartingApp ? 'animate-spin text-red-500' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">Clear Cache</span>
            </button>

            <button
              onClick={() => {
                setArtisanModalOpen(true);
                setArtisanOutput('');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>Artisan Console</span>
            </button>

            <button
              onClick={() => {
                setComposerModalOpen(true);
                setComposerOutput('');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Composer</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 shrink-0">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-1.5 text-xs font-mono overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => handleNavigateToBreadcrumb(-1, [])}
              className={`px-2 py-1 rounded-lg transition flex items-center space-x-1 ${
                currentPath === '/'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>root</span>
            </button>

            {breadcrumbs.map((segment, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                <button
                  onClick={() => handleNavigateToBreadcrumb(idx, breadcrumbs)}
                  className={`px-2 py-1 rounded-lg transition truncate max-w-[120px] ${
                    idx === breadcrumbs.length - 1
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Buttons: New File, New Folder, Upload, Search */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari file..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-red-500 w-36 sm:w-44"
              />
            </div>

            <button
              onClick={() => {
                setNewFileName('');
                setNewFileTemplate('blank');
                setNewFileOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>File Baru</span>
            </button>

            <button
              onClick={() => {
                setNewFolderName('');
                setNewFolderOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1 transition cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Folder Baru</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 transition shadow-xs cursor-pointer"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Mengunggah...' : 'Unggah File'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleUploadFiles(e.target.files)}
            />

            <button
              onClick={() => loadFiles(currentPath)}
              disabled={loading}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* In-app Notification Banner */}
        {notification && (
          <div
            className={`px-6 py-2 text-xs flex items-center space-x-2 shrink-0 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b border-rose-500/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:opacity-75">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Main Content Area: File Explorer OR In-browser Code Editor */}
        {editingFile ? (
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-zinc-100">
            {/* Editor Toolbar */}
            <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900">
              <div className="flex items-center space-x-3">
                <FileCode className="w-4 h-4 text-red-400" />
                <span className="font-mono text-xs font-bold text-white truncate max-w-sm">
                  {editingFile.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">({editingFile.path})</span>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAndRestart}
                    onChange={e => setSaveAndRestart(e.target.checked)}
                    className="rounded-sm border-zinc-700 text-red-600 focus:ring-red-500"
                  />
                  <span>Clear cache saat simpan</span>
                </label>

                <button
                  onClick={() => handleSaveFileContent(saveAndRestart)}
                  disabled={isSavingContent}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingContent ? 'animate-spin' : ''}`} />
                  <span>{isSavingContent ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>

                <button
                  onClick={() => setEditingFile(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                >
                  Tutup Editor
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-1 relative overflow-hidden flex">
              <textarea
                value={editingFile.content}
                onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full h-full p-6 bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed resize-none focus:outline-hidden border-0 selection:bg-red-900/50"
                placeholder="Ketik kode di sini..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" />
                <p className="text-xs text-zinc-500 font-mono">Memuat struktur file Laravel...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <Folder className="w-12 h-12 mx-auto mb-2 text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
                <p className="text-sm font-semibold">Direktori Kosong</p>
                <p className="text-xs text-zinc-500 mt-1">Belum ada file di folder ini. Unggah file atau buat file baru.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-6">Nama File / Folder</th>
                    <th className="py-2.5 px-4 w-28">Ukuran</th>
                    <th className="py-2.5 px-4 w-44">Dimodifikasi</th>
                    <th className="py-2.5 px-6 w-36 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  {filteredItems.map(item => {
                    const isDir = item.isDirectory;
                    return (
                      <tr
                        key={item.name}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                      >
                        <td className="py-2.5 px-6">
                          <div
                            onClick={() => {
                              if (isDir) handleNavigate(item.name);
                              else handleOpenFileEditor(item);
                            }}
                            className="flex items-center space-x-2.5 cursor-pointer font-sans"
                          >
                            {isDir ? (
                              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : item.extension === 'php' ? (
                              <FileCode className="w-4 h-4 text-red-500 shrink-0" />
                            ) : item.extension === 'json' || item.extension === 'lock' ? (
                              <Code className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : item.extension === 'env' ? (
                              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <File className="w-4 h-4 text-zinc-400 shrink-0" />
                            )}
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition truncate max-w-md">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-500">{item.sizeFormatted}</td>
                        <td className="py-2.5 px-4 text-zinc-400 text-[11px]">
                          {new Date(item.mtime).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2.5 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-70 group-hover:opacity-100 transition">
                            {!isDir && (
                              <button
                                onClick={() => handleOpenFileEditor(item)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Edit File"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isDir && (
                              <a
                                href={api.laravel.files.getDownloadUrl(app.id, currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`)}
                                download={item.name}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                title="Unduh File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => {
                                setRenameTarget(item);
                                setRenameNewName(item.name);
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                              title="Ganti Nama"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* MODAL: New File */}
        {newFileOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Buat File Baru</h4>
              <form onSubmit={handleCreateFile} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Nama File (dengan ekstensi):</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    placeholder="contoh: ApiController.php atau api.php"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-red-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 block mb-1.5">Template Starter:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'blank', label: 'Kosong (PHP)' },
                      { id: 'controller', label: 'Laravel Controller' },
                      { id: 'route', label: 'Laravel Route' },
                      { id: 'blade', label: 'Blade Template' },
                      { id: 'env', label: '.env Template' }
                    ].map(tpl => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setNewFileTemplate(tpl.id as any)}
                        className={`p-2 rounded-xl text-left border transition ${
                          newFileTemplate === tpl.id
                            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewFileOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                  >
                    Buat File
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: New Folder */}
        {newFolderOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Buat Folder Baru</h4>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Nama Folder:</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="contoh: Services atau Models"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-red-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                  >
                    Buat Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Rename */}
        {renameTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm shadow-xl space-y-4">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Ganti Nama</h4>
              <form onSubmit={handleRename} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Nama Baru:</label>
                  <input
                    type="text"
                    value={renameNewName}
                    onChange={e => setRenameNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-red-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenameTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Delete Confirm */}
        {deleteTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm shadow-xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-500">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Konfirmasi Hapus</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Yakin ingin menghapus <b className="text-zinc-900 dark:text-white">{deleteTarget.name}</b>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Artisan Terminal */}
        {artisanModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white">Artisan Console CLI</span>
                </div>
                <button onClick={() => setArtisanModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <form onSubmit={handleRunArtisan} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-red-400 select-none">
                      php artisan
                    </span>
                    <input
                      type="text"
                      value={artisanCmd}
                      onChange={e => setArtisanCmd(e.target.value)}
                      placeholder="migrate --force atau route:list"
                      className="w-full pl-24 pr-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-100 focus:outline-hidden focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={artisanRunning}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {artisanRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Jalankan</span>
                  </button>
                </form>

                {/* Quick Shortcuts */}
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {[
                    'optimize:clear',
                    'migrate --force',
                    'route:list',
                    'config:cache',
                    'key:generate'
                  ].map(cmd => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => {
                        setArtisanCmd(cmd);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-300 h-56 overflow-y-auto whitespace-pre-wrap">
                  {artisanOutput || 'Ketik perintah artisan dan klik "Jalankan".'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Composer Install Terminal */}
        {composerModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Composer Dependencies Manager</span>
                </div>
                <button onClick={() => setComposerModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    Menjalankan <code className="text-indigo-400 font-mono">composer install --no-dev --optimize-autoloader</code> di server.
                  </p>
                  <button
                    onClick={handleRunComposer}
                    disabled={composerRunning}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {composerRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Jalankan Composer Install</span>
                  </button>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-300 h-56 overflow-y-auto whitespace-pre-wrap">
                  {composerOutput || 'Klik "Jalankan Composer Install" untuk memperbarui dependensi vendor.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
