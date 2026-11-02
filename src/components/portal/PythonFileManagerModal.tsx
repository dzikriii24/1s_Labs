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
  Layers,
  Package,
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { api, PythonApp, FileItem } from '../../services/api';

interface PythonFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: PythonApp;
  onAppRestarted?: () => void;
}

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const PythonFileManagerModal: React.FC<PythonFileManagerModalProps> = ({
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
  const [newFileTemplate, setNewFileTemplate] = useState<'blank' | 'fastapi' | 'flask' | 'wsgi' | 'requirements' | 'env'>('blank');

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  // In-browser Code Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [saveAndRestart, setSaveAndRestart] = useState(false);

  // Pip install terminal modal state
  const [pipModalOpen, setPipModalOpen] = useState(false);
  const [pipRunning, setPipRunning] = useState(false);
  const [pipOutput, setPipOutput] = useState('');
  const [reqFile, setReqFile] = useState('requirements.txt');

  // Quick App Restart state
  const [isRestartingApp, setIsRestartingApp] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const res = await api.python.files.list(app.app_name, targetPath);
      if (res.success) {
        setItems(res.items);
        setCurrentPath(res.currentPath);
        setTotalUsageFormatted(res.totalUsageFormatted);
      }
    } catch (err: any) {
      notify('error', err.message || 'Gagal memuat daftar file aplikasi Python.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles('/');
      setNotification(null);
    }
  }, [isOpen, app.app_name]);

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
      const res = await api.python.files.getContent(app.app_name, filePath);
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
      await api.python.files.saveContent(app.app_name, editingFile.path, editingFile.content, shouldRestart);
      notify('success', shouldRestart ? 'File berhasil disimpan & server direstart!' : 'File berhasil disimpan!');
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
    if (newFileTemplate === 'fastapi') {
      starterCode = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${app.app_name}", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "${app.app_name}",
        "message": "FastAPI is running successfully on 1sLabs Cloud!"
    }

@app.get("/health")
def health_check():
    return {"healthy": True, "app": "${app.app_name}"}
`;
    } else if (newFileTemplate === 'flask') {
      starterCode = `from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return jsonify({
        "status": "online",
        "service": "${app.app_name}",
        "framework": "Flask",
        "provider": "1sLabs Cloud"
    })

@app.route("/health")
def health():
    return jsonify({"healthy": True})

if __name__ == "__main__":
    app.run()
`;
    } else if (newFileTemplate === 'wsgi') {
      starterCode = `# Passenger WSGI Configuration for 1sLabs Cloud
import sys
import os

app_dir = os.path.dirname(__file__)
sys.path.insert(0, app_dir)

# For WSGI applications (Flask, Django, etc.):
def application(environ, start_response):
    status = '200 OK'
    headers = [('Content-type', 'application/json; charset=utf-8')]
    start_response(status, headers)
    py_ver = sys.version.split()[0]
    return [b'{"status": "online", "message": "1sLabs Python Application is running!", "python": "' + py_ver.encode() + b'"}']
`;
    } else if (newFileTemplate === 'requirements') {
      starterCode = `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.0.0
requests>=2.31.0
python-dotenv>=1.0.0
`;
    } else if (newFileTemplate === 'env') {
      starterCode = `APP_NAME="${app.app_name}"
APP_ENV=production
DEBUG=false
APP_URL="${app.app_url || ''}"
`;
    }

    try {
      await api.python.files.createFile(app.app_name, currentPath, newFileName.trim(), starterCode);
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
      await api.python.files.createFolder(app.app_name, currentPath, newFolderName.trim());
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
      await api.python.files.rename(app.app_name, oldPath, newPath);
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
      await api.python.files.delete(app.app_name, targetPath);
      notify('success', `Item '${deleteTarget.name}' berhasil dihapus.`);
      setDeleteTarget(null);
      loadFiles(currentPath);
    } catch (err: any) {
      notify('error', err.message || 'Gagal menghapus item.');
    }
  };

  const handleRestartAppQuick = async () => {
    try {
      setIsRestartingApp(true);
      await api.python.restartApp(app.app_name);
      notify('success', 'Server Python berhasil di-restart!');
      if (onAppRestarted) onAppRestarted();
    } catch (err: any) {
      notify('error', err.message || 'Gagal me-restart server.');
    } finally {
      setIsRestartingApp(false);
    }
  };

  const handleRunPipInstall = async () => {
    try {
      setPipRunning(true);
      setPipOutput(`$ pip install -r ${reqFile}\nSedang mengunduh dan mengompilasi modul Python di virtualenv...`);
      const res = await api.python.installModules(app.app_name, reqFile);
      setPipOutput(`$ pip install -r ${reqFile}\n\n${typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)}\n\nInstalasi selesai!`);
      notify('success', 'Modul Python berhasil diinstal.');
      if (onAppRestarted) onAppRestarted();
    } catch (err: any) {
      setPipOutput(prev => prev + `\n\nERROR:\n${err.message}`);
      notify('error', err.message || 'Gagal menginstal dependensi pip.');
    } finally {
      setPipRunning(false);
    }
  };

  // Upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const formData = new FormData();
    fileArray.forEach(f => formData.append('files', f));

    const tasks: UploadTask[] = fileArray.map(f => ({
      id: Math.random().toString(),
      name: f.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploadTasks(tasks);
    setIsUploading(true);

    try {
      await api.python.files.uploadWithProgress(
        app.app_name,
        currentPath,
        formData,
        (loaded, total) => {
          const pct = Math.round((loaded / total) * 100);
          setUploadTasks(prev => prev.map(t => ({ ...t, progress: pct })));
        }
      );
      notify('success', `${fileArray.length} file berhasil diunggah.`);
      loadFiles(currentPath);
      setTimeout(() => {
        setIsUploading(false);
        setUploadTasks([]);
      }, 1000);
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengunggah file.');
      setIsUploading(false);
    }
  };

  // Drag and drop events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    }
    const ext = (item.extension || '').toLowerCase();
    if (ext === 'py' || ext === 'pyw') {
      return <FileCode className="w-5 h-5 text-blue-500" />;
    }
    if (['json', 'yaml', 'yml', 'toml', 'ini', 'cfg'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-emerald-500" />;
    }
    if (['txt', 'md', 'log'].includes(ext) || item.name === 'requirements.txt') {
      return <FileText className="w-5 h-5 text-amber-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    if (['zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'whl'].includes(ext)) {
      return <Archive className="w-5 h-5 text-rose-500" />;
    }
    return <File className="w-5 h-5 text-zinc-400" />;
  };

  const isEditable = (item: FileItem) => {
    if (item.isDirectory) return false;
    const ext = (item.extension || '').toLowerCase();
    return [
      'py', 'pyw', 'txt', 'json', 'yaml', 'yml', 'toml', 'env', 'ini', 'cfg',
      'md', 'html', 'css', 'js', 'sql', 'sh', 'log', 'wsgi'
    ].includes(ext) || item.name.startsWith('.env') || item.name === 'requirements.txt' || item.name === 'passenger_wsgi.py';
  };

  const pathSegments = currentPath.split('/').filter(Boolean);

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="relative w-full max-w-6xl h-[88vh] bg-white dark:bg-[#0c0c0e] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* DRAG AND DROP OVERLAY */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 dark:bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-3xl flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs">
            <Upload className="w-16 h-16 text-blue-500 animate-bounce mb-3" />
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              Lepaskan file di sini untuk mengunggah
            </p>
            <p className="text-xs text-zinc-500 mt-1">Ke direktori: {currentPath}</p>
          </div>
        )}

        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileCode className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                  File Manager &bull; {app.app_name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                  Python {app.version || '3.11'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  {totalUsageFormatted}
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                Root: ~/{app.app_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRestartAppQuick}
              disabled={isRestartingApp}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Restart server Python"
            >
              <RotateCw className={`w-3.5 h-3.5 text-blue-500 ${isRestartingApp ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Restart</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-[#0c0c0e] shrink-0 flex-wrap">
          {/* Breadcrumb Path Navigation */}
          <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => handleNavigateToBreadcrumb(-1, [])}
              className={`px-2 py-1 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer ${
                currentPath === '/' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' : ''
              }`}
            >
              root
            </button>
            {pathSegments.map((seg, idx) => (
              <React.Fragment key={idx}>
                <span className="text-zinc-400">/</span>
                <button
                  onClick={() => handleNavigateToBreadcrumb(idx, pathSegments)}
                  className={`px-2 py-1 rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer ${
                    idx === pathSegments.length - 1
                      ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10'
                      : ''
                  }`}
                >
                  {seg}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentPath !== '/' && (
              <button
                onClick={() => {
                  const parent = '/' + pathSegments.slice(0, -1).join('/');
                  loadFiles(parent === '//' ? '/' : parent);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="Kembali ke folder atas"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Naik</span>
              </button>
            )}

            <button
              onClick={() => setNewFileOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File Baru</span>
            </button>

            <button
              onClick={() => setNewFolderOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Folder Baru</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-blue-200 dark:border-blue-500/30"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <button
              onClick={() => setPipModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-amber-200 dark:border-amber-500/30"
              title="Jalankan Pip Install"
            >
              <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pip Install</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 w-36 sm:w-44 transition outline-none"
              />
            </div>

            <button
              onClick={() => loadFiles(currentPath)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Refresh daftar file"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div
            className={`px-5 py-2 text-xs font-medium flex items-center justify-between transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-b border-rose-200 dark:border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="cursor-pointer opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* UPLOADING PROGRESS OVERLAY BAR */}
        {isUploading && (
          <div className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
              <span>Mengunggah berkas...</span>
              <span>{uploadTasks[0]?.progress || 0}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${uploadTasks[0]?.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* MAIN FILE TABLE AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-2 py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-zinc-400 font-mono">Memuat berkas dari direktori server...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Folder className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {searchQuery ? 'Tidak ada file yang cocok dengan pencarian.' : 'Direktori ini kosong.'}
              </p>
              <p className="text-xs text-zinc-400 max-w-sm">
                Unggah file kode atau buat file baru seperti <code>app.py</code> atau <code>requirements.txt</code>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredItems.map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition duration-100 gap-3"
                >
                  {/* Left: Icon & Name */}
                  <div
                    onClick={() => {
                      if (item.isDirectory) handleNavigate(item.name);
                      else if (isEditable(item)) handleOpenFileEditor(item);
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="shrink-0">{getFileIcon(item)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                        <span>{item.sizeFormatted}</span>
                        <span>&bull;</span>
                        <span>{new Date(item.mtime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditable(item) && (
                      <button
                        onClick={() => handleOpenFileEditor(item)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit file"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!item.isDirectory && (
                      <a
                        href={api.python.files.getDownloadUrl(app.app_name, currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`)}
                        download={item.name}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setRenameTarget(item);
                        setRenameNewName(item.name);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Ubah nama"
                    >
                      <Edit3 className="w-3.5 h-3.5 opacity-60" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL: CODE EDITOR */}
        {editingFile && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-[#0c0c0e] flex flex-col animate-in fade-in duration-100">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                  {editingFile.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono truncate">
                  ({editingFile.path})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAndRestart}
                    onChange={(e) => setSaveAndRestart(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Restart server saat menyimpan</span>
                </label>

                <button
                  onClick={() => handleSaveFileContent(saveAndRestart)}
                  disabled={isSavingContent}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingContent ? 'Menyimpan...' : 'Simpan'}</span>
                </button>

                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 relative overflow-hidden bg-zinc-950">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full h-full p-4 font-mono text-xs bg-zinc-950 text-emerald-400 border-none outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* MODAL: NEW FILE */}
        {newFileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <span>Buat File Python Baru</span>
                </h4>
                <button onClick={() => setNewFileOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFile} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama File
                  </label>
                  <input
                    type="text"
                    placeholder="misal: app.py, main.py, requirements.txt"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pilih Template Starter
                  </label>
                  <select
                    value={newFileTemplate}
                    onChange={(e: any) => setNewFileTemplate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="blank">Kosong (Blank File)</option>
                    <option value="fastapi">FastAPI Starter (main.py)</option>
                    <option value="flask">Flask App Starter (app.py)</option>
                    <option value="wsgi">Passenger WSGI (passenger_wsgi.py)</option>
                    <option value="requirements">Pip Requirements (requirements.txt)</option>
                    <option value="env">Environment Config (.env)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewFileOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
                  >
                    Buat File
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: NEW FOLDER */}
        {newFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>Buat Folder Baru</span>
                </h4>
                <button onClick={() => setNewFolderOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Folder
                  </label>
                  <input
                    type="text"
                    placeholder="misal: controllers, routers, models, static"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition cursor-pointer shadow-xs"
                  >
                    Buat Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RENAME */}
        {renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  <span>Ubah Nama Item</span>
                </h4>
                <button onClick={() => setRenameTarget(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRename} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Baru
                  </label>
                  <input
                    type="text"
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenameTarget(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Hapus {deleteTarget.isDirectory ? 'Folder' : 'File'}?
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Item <strong>{deleteTarget.name}</strong> akan dihapus permanen dari server.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-xs"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PIP INSTALL CONSOLE */}
        {pipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Pip Module Installer
                  </h4>
                </div>
                <button onClick={() => setPipModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    File Dependensi Pip (requirements.txt)
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
      </div>
    </div>
  );
};

