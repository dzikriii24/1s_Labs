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
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { api, NodeJsApp, FileItem } from '../../services/api';

interface NodeFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: NodeJsApp;
  onAppRestarted?: () => void;
}

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const NodeFileManagerModal: React.FC<NodeFileManagerModalProps> = ({
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
  const [newFileTemplate, setNewFileTemplate] = useState<'blank' | 'express' | 'env' | 'json'>('blank');

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  // In-browser Code Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [saveAndRestart, setSaveAndRestart] = useState(false);

  // NPM install terminal modal state
  const [npmModalOpen, setNpmModalOpen] = useState(false);
  const [npmRunning, setNpmRunning] = useState(false);
  const [npmOutput, setNpmOutput] = useState('');

  // Quick App Restart state
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
      const res = await api.nodejs.files.list(app.id, targetPath);
      if (res.success) {
        setItems(res.items);
        setCurrentPath(res.currentPath);
        setTotalUsageFormatted(res.totalUsageFormatted);
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal memuat daftar file aplikasi.');
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
    setSearchQuery('');
    const cleanCurrent = currentPath === '/' ? '' : currentPath.replace(/\/+$/, '');
    const cleanFolder = folderName.replace(/^\/+|\/+$/g, '');
    const nextPath = cleanCurrent + '/' + cleanFolder;
    const target = nextPath === '' ? '/' : nextPath;
    setCurrentPath(target);
    loadFiles(target);
  };

  const handleBreadcrumbClick = (index: number, parts: string[]) => {
    setSearchQuery('');
    if (index === -1) {
      setCurrentPath('/');
      loadFiles('/');
      return;
    }
    const target = '/' + parts.slice(0, index + 1).join('/');
    setCurrentPath(target);
    loadFiles(target);
  };

  // Open file in code editor
  const handleOpenFile = async (item: FileItem) => {
    try {
      setLoading(true);
      const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      const res = await api.nodejs.files.getContent(app.id, filePath);
      if (res.success) {
        setEditingFile({
          path: filePath,
          name: item.name,
          content: res.content
        });
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuka file.');
    } finally {
      setLoading(false);
    }
  };

  // Save edited code
  const handleSaveFile = async (shouldRestart = false) => {
    if (!editingFile) return;
    try {
      setIsSavingContent(true);
      await api.nodejs.files.saveContent(app.id, editingFile.path, editingFile.content, shouldRestart);
      notify('success', shouldRestart ? 'File berhasil disimpan dan server direstart!' : 'File berhasil disimpan!');
      if (shouldRestart && onAppRestarted) {
        onAppRestarted();
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal menyimpan file.');
    } finally {
      setIsSavingContent(false);
    }
  };

  // Create new file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let starterCode = '';
    if (newFileTemplate === 'express') {
      starterCode = `// Route Handler\nconst express = require('express');\nconst router = express.Router();\n\nrouter.get('/', (req, res) => {\n  res.json({ message: 'Hello from ${newFileName}' });\n});\n\nmodule.exports = router;\n`;
    } else if (newFileTemplate === 'env') {
      starterCode = `PORT=3000\nNODE_ENV=production\n`;
    } else if (newFileTemplate === 'json') {
      starterCode = `{\n  "name": "config",\n  "version": "1.0.0"\n}\n`;
    }

    try {
      await api.nodejs.files.createFile(app.id, currentPath, newFileName.trim(), starterCode);
      notify('success', `File '${newFileName}' berhasil dibuat.`);
      setNewFileOpen(false);
      setNewFileName('');
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuat file.');
    }
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.nodejs.files.createFolder(app.id, currentPath, newFolderName.trim());
      notify('success', `Folder '${newFolderName}' berhasil dibuat.`);
      setNewFolderOpen(false);
      setNewFolderName('');
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal membuat folder.');
    }
  };

  // Rename item
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;

    const cleanCurrent = currentPath === '/' ? '' : currentPath;
    const oldPath = `${cleanCurrent}/${renameTarget.name}`;
    const newPath = `${cleanCurrent}/${renameNewName.trim()}`;

    try {
      await api.nodejs.files.rename(app.id, oldPath, newPath);
      notify('success', 'Item berhasil diubah namanya.');
      setRenameTarget(null);
      setRenameNewName('');
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengubah nama item.');
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;

    const cleanCurrent = currentPath === '/' ? '' : currentPath;
    const targetPath = `${cleanCurrent}/${deleteTarget.name}`;

    try {
      await api.nodejs.files.delete(app.id, targetPath);
      notify('success', `Item '${deleteTarget.name}' berhasil dihapus.`);
      setDeleteTarget(null);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal menghapus item.');
    }
  };

  // Trigger quick restart
  const handleQuickRestart = async () => {
    try {
      setIsRestartingApp(true);
      await api.nodejs.action(app.id, 'restart');
      notify('success', 'Server Node.js berhasil direstart!');
      if (onAppRestarted) onAppRestarted();
    } catch (err: any) {
      notify('error', err.message || 'Gagal me-restart server.');
    } finally {
      setIsRestartingApp(false);
    }
  };

  // Run NPM Install
  const handleRunNpmInstall = async () => {
    try {
      setNpmModalOpen(true);
      setNpmRunning(true);
      setNpmOutput('Menjalankan npm install di virtualenv Node.js...\n\n');
      const res = await api.nodejs.runNpmInstall(app.id);
      setNpmOutput(res.output || 'NPM install selesai.');
      notify('success', 'NPM install selesai dan aplikasi telah direstart.');
      if (onAppRestarted) onAppRestarted();
    } catch (err: any) {
      setNpmOutput(prev => prev + '\n[ERROR]: ' + (err.message || 'Gagal menjalankan npm install.'));
      notify('error', err.message || 'Gagal menjalankan npm install.');
    } finally {
      setNpmRunning(false);
      loadFiles(currentPath);
    }
  };

  // Handle file uploads (with single or multiple files)
  const uploadFilesList = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      await api.nodejs.files.uploadWithProgress(app.id, currentPath, formData);
      notify('success', `${files.length} file berhasil diunggah.`);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFilesList(Array.from(e.target.files));
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFilesList(Array.from(e.dataTransfer.files));
    }
  };

  // Breadcrumbs parts
  const pathParts = currentPath.split('/').filter(Boolean);

  // Filter items
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) return <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
    const ext = item.extension?.toLowerCase();
    if (['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-emerald-500" />;
    }
    if (['json', 'yaml', 'yml'].includes(ext || '')) {
      return <Code className="w-4 h-4 text-amber-400" />;
    }
    if (item.name.startsWith('.env')) {
      return <FileText className="w-4 h-4 text-purple-400" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-sky-400" />;
    }
    if (['zip', 'tar', 'gz', 'rar'].includes(ext || '')) {
      return <Archive className="w-4 h-4 text-rose-400" />;
    }
    return <FileText className="w-4 h-4 text-zinc-400" />;
  };

  const isEditable = (item: FileItem) => {
    if (item.isDirectory) return false;
    const ext = item.extension?.toLowerCase();
    return [
      'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'json', 'env', 'html', 'css',
      'txt', 'md', 'sql', 'yml', 'yaml', 'xml', 'log'
    ].includes(ext || '') || item.name.startsWith('.env');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
        >
          {/* Top Bar Header */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                <Folder className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base truncate">
                    File Manager: {app.app_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    v{app.nodejs_version}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  <span>~/{app.app_root}</span>
                  <span>•</span>
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1 text-zinc-600 dark:text-zinc-300"
                  >
                    {app.domain}/{app.app_uri}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRunNpmInstall}
                disabled={npmRunning}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition"
                title="Jalankan npm install di direktori aplikasi"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">npm install</span>
              </button>

              <button
                onClick={handleQuickRestart}
                disabled={isRestartingApp}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition"
                title="Restart Node.js process"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestartingApp ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Restart Server</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Tutup File Manager"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation & Storage Strip */}
          <div className="px-5 py-2.5 bg-zinc-100/50 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button
                onClick={() => handleBreadcrumbClick(-1, [])}
                className={`font-semibold hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 ${
                  currentPath === '/' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>app_root</span>
              </button>

              {pathParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <button
                    onClick={() => handleBreadcrumbClick(idx, pathParts)}
                    className={`font-semibold hover:text-zinc-900 dark:hover:text-white transition truncate max-w-[120px] ${
                      idx === pathParts.length - 1 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Total Ukuran: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalUsageFormatted}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari file..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setNewFileTemplate('blank');
                  setNewFileName('');
                  setNewFileOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                File Baru
              </button>

              <button
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Folder Baru
              </button>

              {/* Upload File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </>
                )}
              </button>

              <button
                onClick={() => loadFiles(currentPath)}
                disabled={loading}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Segarkan daftar file"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`px-5 py-2 text-xs flex items-center justify-between ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b border-rose-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main File Table Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                <p className="text-xs text-zinc-500">Memuat direktori aplikasi...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <Folder className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-2" />
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {searchQuery ? 'Tidak ada file yang cocok' : 'Direktori Kosong'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `Tidak ditemukan file dengan kata kunci '${searchQuery}'.`
                    : 'Seret dan lepas file ke sini atau klik "Upload File" untuk menambahkan file backend.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-semibold sticky top-0">
                    <th className="py-2.5 px-5">Nama Berkas / Folder</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Ukuran</th>
                    <th className="py-2.5 px-4 hidden md:table-cell">Terakhir Diubah</th>
                    <th className="py-2.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {filteredItems.map((item) => {
                    const editable = isEditable(item);
                    return (
                      <tr
                        key={item.name}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition group"
                      >
                        {/* Name and Icon */}
                        <td className="py-2.5 px-5">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{getFileIcon(item)}</span>
                            {item.isDirectory ? (
                              <button
                                onClick={() => handleNavigate(item.name)}
                                className="font-semibold text-zinc-800 dark:text-zinc-200 hover:underline text-left truncate max-w-xs sm:max-w-md"
                              >
                                {item.name}
                              </button>
                            ) : editable ? (
                              <button
                                onClick={() => handleOpenFile(item)}
                                className="font-mono text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:underline text-left truncate max-w-xs sm:max-w-md"
                              >
                                {item.name}
                              </button>
                            ) : (
                              <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-xs sm:max-w-md">
                                {item.name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-2.5 px-4 font-mono text-zinc-500 hidden sm:table-cell">
                          {item.sizeFormatted}
                        </td>

                        {/* Modified Date */}
                        <td className="py-2.5 px-4 text-zinc-500 hidden md:table-cell">
                          {new Date(item.mtime).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                            {editable && (
                              <button
                                onClick={() => handleOpenFile(item)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title="Edit Kode"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!item.isDirectory && (
                              <a
                                href={api.nodejs.files.getDownloadUrl(app.id, currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`)}
                                download={item.name}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
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
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              title="Ubah Nama"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
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

          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm border-2 border-dashed border-zinc-400 flex flex-col items-center justify-center pointer-events-none space-y-3">
              <Upload className="w-12 h-12 text-white animate-bounce" />
              <p className="text-base font-bold text-white">Lepaskan file di sini untuk mengunggah</p>
              <p className="text-xs text-zinc-400">File akan diunggah langsung ke {currentPath}</p>
            </div>
          )}

          {/* MODAL: Code Editor */}
          {editingFile && (
            <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col text-zinc-100">
              {/* Editor Header */}
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-mono font-bold">{editingFile.name}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">{editingFile.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 hidden sm:inline mr-2">
                    Gunakan <code>Ctrl+S</code> untuk menyimpan
                  </span>

                  <button
                    onClick={() => handleSaveFile(false)}
                    disabled={isSavingContent}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
                  >
                    {isSavingContent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan
                  </button>

                  <button
                    onClick={() => handleSaveFile(true)}
                    disabled={isSavingContent}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 flex items-center gap-1.5 transition font-bold shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSavingContent ? 'animate-spin' : ''}`} />
                    Simpan & Restart
                  </button>

                  <button
                    onClick={() => setEditingFile(null)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Textarea Code Editor */}
              <div className="flex-1 relative bg-zinc-950 font-mono text-xs flex">
                <textarea
                  value={editingFile.content}
                  onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                      e.preventDefault();
                      handleSaveFile(false);
                    }
                  }}
                  className="flex-1 p-5 bg-transparent text-zinc-200 resize-none focus:outline-none leading-relaxed font-mono selection:bg-zinc-700"
                  spellCheck={false}
                  placeholder="Tulis kode di sini..."
                />
              </div>
            </div>
          )}

          {/* MODAL: New File */}
          {newFileOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-zinc-500" />
                    Buat File Baru di {currentPath}
                  </h4>
                  <button onClick={() => setNewFileOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateFile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Nama File (beserta ekstensi)
                    </label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="contoh: routes.js, .env, controllers.js"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Template Awal
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'blank', label: 'Kosong (Blank)' },
                        { id: 'express', label: 'Express Router' },
                        { id: 'env', label: '.env Template' },
                        { id: 'json', label: 'JSON Config' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewFileTemplate(t.id as any)}
                          className={`p-2 rounded-xl border text-left transition ${
                            newFileTemplate === t.id
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewFileOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
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
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-zinc-500" />
                    Buat Folder Baru di {currentPath}
                  </h4>
                  <button onClick={() => setNewFolderOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateFolder} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Nama Folder
                    </label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="contoh: routes, controllers, middleware"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewFolderOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
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
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-zinc-500" />
                    Ubah Nama: {renameTarget.name}
                  </h4>
                  <button onClick={() => setRenameTarget(null)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleRename} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Nama Baru
                    </label>
                    <input
                      type="text"
                      value={renameNewName}
                      onChange={(e) => setRenameNewName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRenameTarget(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
                    >
                      Simpan Nama Baru
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Delete Target */}
          {deleteTarget && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Hapus {deleteTarget.isDirectory ? 'Folder' : 'Berkas'}?</h4>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{deleteTarget.name}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Tindakan ini permanen. {deleteTarget.isDirectory ? 'Semua berkas dan subfolder di dalamnya akan dihapus dari server.' : 'Berkas akan langsung dihapus dari disk server.'}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  >
                    Ya, Hapus Permanen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: NPM Install Terminal Viewer */}
          {npmModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[80vh] text-zinc-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold font-mono">Terminal: npm install</h4>
                      <p className="text-[11px] text-zinc-400 font-mono">apps/{app.app_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNpmModalOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-300">
                  {npmOutput}
                  {npmRunning && (
                    <div className="flex items-center gap-2 mt-4 text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunduh dan mengekstrak paket dependency...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setNpmModalOpen(false)}
                    disabled={npmRunning}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    Tutup Terminal
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

