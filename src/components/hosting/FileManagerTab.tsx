import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
  Layers,
  ArrowUpCircle,
  HardDrive,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  ArrowLeft,
  FilePlus,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import { api, FileItem } from '../../services/api';

interface FileManagerTabProps {
  serviceCode: string;
  storageGb: number;
  domain?: string;
}

export const FileManagerTab: React.FC<FileManagerTabProps> = ({ serviceCode, storageGb, domain }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [totalUsageFormatted, setTotalUsageFormatted] = useState('0 B');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeFolder = domain || serviceCode;

  // Modals state
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileTemplate, setNewFileTemplate] = useState<'blank' | 'php' | 'html' | 'css' | 'htaccess'>('blank');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameNewName, setRenameNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Upload Queue Engine state
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [isQueueExpanded, setIsQueueExpanded] = useState(true);
  const isProcessingRef = useRef(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const skipFileRef = useRef(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async (targetPath = currentPath) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.files.list(serviceCode, targetPath);
      if (res.success) {
        setItems(res.items);
        setCurrentPath(res.currentPath);
        setTotalUsageFormatted(res.totalUsageFormatted);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [serviceCode, currentPath]);

  // Navigate folder (clears search query and immediately loads files)
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
    const path = '/' + parts.slice(0, index + 1).join('/');
    setCurrentPath(path);
    loadFiles(path);
  };

  // Open file editor
  const handleOpenFile = async (item: FileItem) => {
    try {
      setLoading(true);
      const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      const res = await api.files.getContent(serviceCode, filePath);
      if (res.success) {
        setEditingFile({
          path: filePath,
          name: item.name,
          content: res.content
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal membuka file.' });
    } finally {
      setLoading(false);
    }
  };

  // Save file editor content
  const handleSaveContent = async () => {
    if (!editingFile) return;
    try {
      setIsSavingContent(true);
      const res = await api.files.saveContent(serviceCode, editingFile.path, editingFile.content);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Perubahan file berhasil disimpan.' });
        setEditingFile(null);
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal menyimpan file.' });
    } finally {
      setIsSavingContent(false);
    }
  };

  // Create new file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let initialContent = '';
    if (newFileTemplate === 'php') {
      initialContent = `<?php\n// File dibuat melalui 1sLabs File Manager\necho "Hello from 1sLabs Hosting!";\nphpinfo();\n`;
    } else if (newFileTemplate === 'html') {
      initialContent = `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Website Baru</title>\n</head>\n<body>\n  <h1>Selamat Datang di Website Saya</h1>\n</body>\n</html>\n`;
    } else if (newFileTemplate === 'css') {
      initialContent = `/* Stylesheet */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\nbody {\n  font-family: sans-serif;\n  background: #f8fafc;\n}\n`;
    } else if (newFileTemplate === 'htaccess') {
      initialContent = `# 1sLabs Apache Web Server Configuration\nRewriteEngine On\n# RewriteBase /\n`;
    }

    try {
      setIsActionLoading(true);
      const res = await api.files.create(serviceCode, currentPath, newFileName.trim(), initialContent);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        const createdName = newFileName.trim();
        const createdPath = currentPath === '/' ? `/${createdName}` : `${currentPath}/${createdName}`;
        setNewFileOpen(false);
        setNewFileName('');
        setNewFileTemplate('blank');
        loadFiles();

        // Immediately open in editor
        setEditingFile({
          path: createdPath,
          name: createdName,
          content: initialContent
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal membuat file baru.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      setIsActionLoading(true);
      const res = await api.files.mkdir(serviceCode, currentPath, newFolderName.trim());
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setNewFolderOpen(false);
        setNewFolderName('');
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal membuat folder.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Rename
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;
    try {
      setIsActionLoading(true);
      const oldPath = currentPath === '/' ? `/${renameTarget.name}` : `${currentPath}/${renameTarget.name}`;
      const res = await api.files.rename(serviceCode, oldPath, renameNewName.trim());
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setRenameTarget(null);
        setRenameNewName('');
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengubah nama.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsActionLoading(true);
      const targetPath = currentPath === '/' ? `/${deleteTarget.name}` : `${currentPath}/${deleteTarget.name}`;
      const res = await api.files.delete(serviceCode, targetPath);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setDeleteTarget(null);
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal menghapus file/folder.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- Upload Queue Engine & Micro-Batching ---
  interface UploadItem {
    file: File;
    relativePath: string;
  }

  interface UploadTask {
    id: string;
    title: string;
    type: 'file' | 'folder';
    targetPath: string;
    items: UploadItem[];
    totalFiles: number;
    completedFiles: number;
    totalBytes: number;
    uploadedBytes: number;
    percent: number;
    status: 'queued' | 'uploading' | 'completed' | 'error' | 'cancelled';
    errorMessage?: string;
    currentFileName?: string;
    currentFileBytes?: number;
    currentFileLoaded?: number;
    currentFilePercent?: number;
    recentLogs: string[];
    speedText?: string;
    etaText?: string;
    createdAt: number;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Recursive reader for FileSystemEntry (WebKit Drag and Drop API)
  const readEntryRecursively = async (entry: any, basePath = ''): Promise<UploadItem[]> => {
    if (!entry) return [];
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file(
          (file: File) => resolve([{ file, relativePath: basePath + file.name }]),
          () => resolve([])
        );
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const allEntries: any[] = [];
      const readBatch = (): Promise<any[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries(
            (entries: any[]) => {
              if (!entries || entries.length === 0) {
                resolve(allEntries);
              } else {
                allEntries.push(...entries);
                readBatch().then(resolve);
              }
            },
            () => resolve(allEntries)
          );
        });
      };

      const entries = await readBatch();
      const results = await Promise.all(
        entries.map((child: any) => readEntryRecursively(child, `${basePath}${entry.name}/`))
      );
      return results.flat();
    }
    return [];
  };

  const extractFilesFromDrop = async (e: React.DragEvent): Promise<UploadItem[]> => {
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) {
      const files = Array.from(e.dataTransfer.files || []);
      return files.map(file => ({ file, relativePath: file.name }));
    }

    const promises: Promise<UploadItem[]>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
        if (entry) {
          promises.push(readEntryRecursively(entry));
        } else {
          const file = item.getAsFile();
          if (file) {
            promises.push(Promise.resolve([{ file, relativePath: file.name }]));
          }
        }
      }
    }

    const results = await Promise.all(promises);
    return results.flat();
  };

  // Conflict resolution state
  interface ConflictModalState {
    rawItems: UploadItem[];
    customTitle?: string;
    conflicts: string[];
  }
  const [conflictModal, setConflictModal] = useState<ConflictModalState | null>(null);

  // Directly enqueues an upload task
  const executeEnqueue = (cleanItems: UploadItem[], customTitle?: string) => {
    if (cleanItems.length === 0) return;
    const totalBytes = cleanItems.reduce((acc, it) => acc + (it.file.size || 0), 0);

    let title = customTitle;
    if (!title) {
      if (cleanItems.length === 1) {
        title = cleanItems[0].relativePath.split('/').pop() || cleanItems[0].relativePath;
      } else {
        const firstParts = cleanItems[0].relativePath.split('/');
        if (firstParts.length > 1) {
          title = `Folder: ${firstParts[0]} (${cleanItems.length} berkas)`;
        } else {
          title = `${cleanItems.length} berkas`;
        }
      }
    }

    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const newTask: UploadTask = {
      id: taskId,
      title,
      type: cleanItems.length > 1 || cleanItems[0].relativePath.includes('/') ? 'folder' : 'file',
      targetPath: currentPath,
      items: cleanItems,
      totalFiles: cleanItems.length,
      completedFiles: 0,
      totalBytes,
      uploadedBytes: 0,
      percent: 0,
      status: 'queued',
      recentLogs: [],
      createdAt: Date.now()
    };

    setUploadQueue(prev => [...prev, newTask]);
    setIsQueueExpanded(true);
  };

  // Enqueue new upload task with conflict detection
  const queueUpload = (rawItems: UploadItem[], customTitle?: string) => {
    if (rawItems.length === 0) return;

    // Filter out OS junk files
    const cleanItems = rawItems.filter(item => {
      const base = item.relativePath.split('/').pop() || '';
      return !['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(base);
    });
    if (cleanItems.length === 0) return;

    // Detect if any items already exist in current folder
    const existingNames = new Set(items.map(it => it.name.toLowerCase()));
    const conflictingNames: string[] = [];
    for (const it of cleanItems) {
      const topName = it.relativePath.split('/')[0];
      if (existingNames.has(topName.toLowerCase()) && !conflictingNames.includes(topName)) {
        conflictingNames.push(topName);
      }
    }

    if (conflictingNames.length > 0) {
      setConflictModal({
        rawItems: cleanItems,
        customTitle,
        conflicts: conflictingNames
      });
      return;
    }

    executeEnqueue(cleanItems, customTitle);
  };

  // Upload Queue Worker Loop
  useEffect(() => {
    if (isProcessingRef.current) return;

    const nextTask = uploadQueue.find(t => t.status === 'queued');
    if (!nextTask) return;

    processTask(nextTask.id);
  }, [uploadQueue]);

  // Micro-batch process execution with auto-retry and resume
  const processTask = async (taskId: string) => {
    const task = uploadQueue.find(t => t.id === taskId);
    if (!task || task.status !== 'queued') return;

    isProcessingRef.current = true;
    const controller = new AbortController();
    abortControllersRef.current.set(taskId, controller);

    setUploadQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));

    const items = task.items;
    const BATCH_SIZE = 5; // upload in chunks of 5 files
    const MAX_BATCH_BYTES = 5 * 1024 * 1024; // max 5MB per chunk

    // Resume from where it left off if retrying
    let completedFiles = task.completedFiles || 0;
    let cumulativeBytes = task.uploadedBytes || 0;
    let recentLogs: string[] = task.recentLogs || [];
    const startTime = Date.now();

    try {
      let i = completedFiles;
      while (i < items.length) {
        if (controller.signal.aborted) {
          throw new Error('Dibatalkan');
        }

        const currentBatch: UploadItem[] = [];
        let batchBytes = 0;

        // If file is large (> 8MB), process it as a dedicated single-file chunk
        if (items[i].file.size > 8 * 1024 * 1024) {
          currentBatch.push(items[i]);
          batchBytes += items[i].file.size;
          i++;
        } else {
          while (
            i < items.length &&
            currentBatch.length < BATCH_SIZE &&
            items[i].file.size <= 8 * 1024 * 1024 &&
            (batchBytes === 0 || batchBytes + items[i].file.size < MAX_BATCH_BYTES)
          ) {
            currentBatch.push(items[i]);
            batchBytes += items[i].file.size;
            i++;
          }
        }

        const currentDisplay = currentBatch.length === 1
          ? currentBatch[0].relativePath
          : `${currentBatch[0].relativePath.split('/').pop()} (+${currentBatch.length - 1} berkas)`;

        setUploadQueue(prev => prev.map(t => t.id === taskId ? {
          ...t,
          currentFileName: currentDisplay
        } : t));

        const formData = new FormData();
        for (const it of currentBatch) {
          formData.append('files', it.file);
          formData.append('paths', it.relativePath);
        }

        // Auto-retry up to 3 times before failing
        let attempt = 0;
        let success = false;
        let lastError: any = null;
        let lastTimestamp = Date.now();
        let lastLoaded = 0;
        let instantSpeed = 0;

        while (attempt < 3 && !success) {
          if (controller.signal.aborted) {
            if (skipFileRef.current) break;
            throw new Error('Dibatalkan');
          }
          try {
            attempt++;
            await api.files.uploadWithProgress(
              serviceCode,
              task.targetPath,
              formData,
              (loaded, total) => {
                const now = Date.now();
                const deltaT = (now - lastTimestamp) / 1000;
                if (deltaT >= 0.3) {
                  const deltaB = loaded - lastLoaded;
                  if (deltaB > 0) {
                    instantSpeed = deltaB / deltaT;
                  }
                  lastTimestamp = now;
                  lastLoaded = loaded;
                }

                const currentTotalBytes = cumulativeBytes + loaded;
                const pct = Math.min(99, Math.round((currentTotalBytes / Math.max(1, task.totalBytes)) * 100));
                const targetBatchBytes = total || batchBytes;
                const filePct = Math.min(100, Math.round((loaded / Math.max(1, targetBatchBytes)) * 100));

                let speedStr = instantSpeed > 0 ? formatBytes(instantSpeed) + '/s' : '';
                let etaStr = '';
                if (instantSpeed > 0 && targetBatchBytes > loaded) {
                  const remainingSec = Math.round((targetBatchBytes - loaded) / instantSpeed);
                  etaStr = remainingSec < 60 ? `~${remainingSec}s lagi` : `~${Math.ceil(remainingSec / 60)}m lagi`;
                }

                setUploadQueue(prev => prev.map(t => t.id === taskId ? {
                  ...t,
                  uploadedBytes: currentTotalBytes,
                  percent: pct,
                  currentFileLoaded: loaded,
                  currentFileBytes: targetBatchBytes,
                  currentFilePercent: filePct,
                  speedText: speedStr,
                  etaText: etaStr
                } : t));
              },
              controller.signal
            );
            success = true;
          } catch (batchErr: any) {
            if (skipFileRef.current) break;
            lastError = batchErr;
            if (controller.signal.aborted || batchErr.message === 'Upload dibatalkan.' || batchErr.message === 'Dibatalkan') {
              throw batchErr;
            }
            if (attempt < 3) {
              setUploadQueue(prev => prev.map(t => t.id === taskId ? {
                ...t,
                speedText: `Mencoba ulang (${attempt}/3)...`
              } : t));
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }

        if (skipFileRef.current) {
          skipFileRef.current = false;
          // Recreate fresh controller for remaining files
          const nextCtrl = new AbortController();
          abortControllersRef.current.set(taskId, nextCtrl);

          cumulativeBytes += batchBytes;
          completedFiles += currentBatch.length;
          recentLogs = [`⚠ ${currentDisplay} (Dilewati)`, ...recentLogs].slice(0, 5);
          continue;
        }

        if (!success) {
          throw lastError || new Error('Gagal mengunggah batch berkas.');
        }

        cumulativeBytes += batchBytes;
        completedFiles += currentBatch.length;

        for (const it of currentBatch) {
          recentLogs = [`✓ ${it.relativePath} (${formatBytes(it.file.size)})`, ...recentLogs].slice(0, 5);
        }

        const overallPercent = Math.min(100, Math.round((completedFiles / items.length) * 100));
        setUploadQueue(prev => prev.map(t => t.id === taskId ? {
          ...t,
          completedFiles,
          uploadedBytes: cumulativeBytes,
          percent: overallPercent,
          recentLogs
        } : t));

        if (task.targetPath === currentPath) {
          loadFiles(currentPath);
        }
      }

      setUploadQueue(prev => prev.map(t => t.id === taskId ? {
        ...t,
        status: 'completed',
        percent: 100,
        completedFiles: items.length,
        uploadedBytes: task.totalBytes,
        currentFileName: undefined,
        currentFileBytes: undefined,
        currentFileLoaded: undefined,
        currentFilePercent: undefined,
        speedText: undefined,
        etaText: undefined
      } : t));

      loadFiles(currentPath);
    } catch (err: any) {
      const isCancelled = controller.signal.aborted || err.message === 'Dibatalkan' || err.message === 'Upload dibatalkan.';
      setUploadQueue(prev => prev.map(t => t.id === taskId ? {
        ...t,
        status: isCancelled ? 'cancelled' : 'error',
        errorMessage: isCancelled ? 'Upload dibatalkan.' : (err.message || 'Gagal mengunggah.'),
        completedFiles,
        uploadedBytes: cumulativeBytes,
        currentFileName: undefined,
        currentFileBytes: undefined,
        currentFileLoaded: undefined,
        currentFilePercent: undefined
      } : t));
    } finally {
      abortControllersRef.current.delete(taskId);
      isProcessingRef.current = false;
      setTimeout(() => {
        setUploadQueue(prev => [...prev]);
      }, 50);
    }
  };

  const cancelTask = (taskId: string) => {
    const ctrl = abortControllersRef.current.get(taskId);
    if (ctrl) {
      ctrl.abort();
    }
    setUploadQueue(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: 'cancelled',
      errorMessage: 'Dibatalkan oleh pengguna.'
    } : t));
  };

  const skipCurrentFile = (taskId: string) => {
    skipFileRef.current = true;
    const ctrl = abortControllersRef.current.get(taskId);
    if (ctrl) {
      ctrl.abort();
    }
  };

  const retryTask = (taskId: string) => {
    setUploadQueue(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: 'queued',
      errorMessage: undefined
    } : t));
  };

  const clearCompletedTasks = () => {
    setUploadQueue(prev => prev.filter(t => t.status === 'uploading' || t.status === 'queued'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadItems: UploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      uploadItems.push({ file: files[i], relativePath: files[i].name });
    }
    const title = files.length === 1 ? files[0].name : `${files.length} berkas`;
    queueUpload(uploadItems, title);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploadItems: UploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rel = (file as any).webkitRelativePath || file.name;
      uploadItems.push({ file, relativePath: rel });
    }
    let folderName = 'Folder Proyek';
    if (files[0] && (files[0] as any).webkitRelativePath) {
      folderName = (files[0] as any).webkitRelativePath.split('/')[0] || folderName;
    }
    queueUpload(uploadItems, `Folder: ${folderName} (${uploadItems.length} berkas)`);
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // Drag & drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setIsDraggingOver(false);
        return 0;
      }
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDragCounter(0);

    const items = await extractFilesFromDrop(e);
    if (items.length > 0) {
      let title = '';
      if (items.length === 1) {
        title = items[0].relativePath.split('/').pop() || items[0].relativePath;
      } else {
        const firstParts = items[0].relativePath.split('/');
        if (firstParts.length > 1) {
          title = `Folder: ${firstParts[0]} (${items.length} berkas)`;
        } else {
          title = `${items.length} berkas`;
        }
      }
      queueUpload(items, title);
    }
  };

  // Extract archive (ZIP / TAR)
  const handleExtractArchive = async (item: FileItem) => {
    const targetPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    if (!window.confirm(`Ekstrak berkas arsip '${item.name}' ke dalam folder saat ini?`)) {
      return;
    }
    try {
      setIsActionLoading(true);
      const res = await api.files.extract(serviceCode, targetPath);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengekstrak berkas arsip.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Helper for file icons
  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    }
    const ext = item.extension;
    if (['html', 'htm'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-orange-500" />;
    }
    if (['css', 'scss'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-blue-500" />;
    }
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-yellow-500" />;
    }
    if (['php'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-purple-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-pink-500" />;
    }
    if (['zip', 'tar', 'gz', 'rar'].includes(ext || '')) {
      return <Archive className="w-5 h-5 text-emerald-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const breadcrumbParts = currentPath.split('/').filter(Boolean);
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active upload queue stats
  const activeTask = uploadQueue.find(t => t.status === 'uploading');
  const queuedCount = uploadQueue.filter(t => t.status === 'queued').length;
  const completedCount = uploadQueue.filter(t => t.status === 'completed').length;
  const isUploading = Boolean(activeTask || queuedCount > 0);
  const totalQueueTasks = uploadQueue.length;

  return (
    <div className="space-y-6">
      {/* Alert Notice */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File Manager Top Toolbar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto py-1">
          <button
            onClick={() => handleBreadcrumbClick(-1, [])}
            className="flex items-center space-x-1 font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>public_html/{activeFolder}</span>
          </button>

          {breadcrumbParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(idx, breadcrumbParts)}
                className={`p-1.5 rounded-lg transition-colors font-mono ${
                  idx === breadcrumbParts.length - 1
                    ? 'font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />

          {/* Hidden Folder Input */}
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
            className="hidden"
          />

          <button
            onClick={() => setNewFileOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>File Baru</span>
          </button>

          <button
            onClick={() => setNewFolderOpen(true)}
            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Folder Baru</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Unggah berkas tunggal atau banyak sekaligus (dapat ditumpuk/stack antrean)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah File</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Unggah seluruh folder proyek beserta subdirektori (dapat ditumpuk/stack antrean)"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Unggah Folder</span>
          </button>

          {totalQueueTasks > 0 && (
            <button
              onClick={() => setIsQueueExpanded(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs ${
                activeTask
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Buka panel antrean upload"
            >
              <Layers className={`w-3.5 h-3.5 ${activeTask ? 'animate-pulse' : ''}`} />
              <span>
                {activeTask
                  ? `Antrean: ${activeTask.percent}% (${completedCount}/${totalQueueTasks})`
                  : `Antrean Selesai (${completedCount}/${totalQueueTasks})`}
              </span>
              {isQueueExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            onClick={() => loadFiles(currentPath)}
            disabled={loading}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs transition-colors"
            title="Refresh File List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Deploy Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/30 dark:via-gray-900 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0 mt-0.5 sm:mt-0">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Deploy Cepat (Drag & Drop Folder & File)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold">
                Queue & Stack System
              </span>
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-0.5">
              Anda dapat langsung menyeret (<em>drag & drop</em>) folder atau berkas tanpa menunggu upload sebelumnya selesai — sistem otomatis menyusun <strong>antrean (stack)</strong> secara berurutan dan real-time.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3 h-3 text-gray-500" />
            <span>Pilih File</span>
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <FolderUp className="w-3 h-3" />
            <span>Pilih Folder</span>
          </button>
        </div>
      </div>

      {/* Realtime Upload Progress Banner */}
      {activeTask && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-gray-900 border border-blue-300/80 dark:border-blue-800/80 text-gray-900 dark:text-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="font-bold text-xs truncate">{activeTask.title}</h5>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-600 text-white font-bold">
                    {activeTask.percent}%
                  </span>
                  {activeTask.speedText && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                      ({activeTask.speedText})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  Tujuan: <code className="font-mono text-blue-600 dark:text-blue-400">{activeTask.targetPath}</code> •{' '}
                  {activeTask.completedFiles} dari {activeTask.totalFiles} berkas ({formatBytes(activeTask.uploadedBytes)} / {formatBytes(activeTask.totalBytes)})
                  {queuedCount > 0 && (
                    <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                      • +{queuedCount} antrean berikutnya
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => cancelTask(activeTask.id)}
                className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-semibold flex items-center space-x-1"
                title="Batalkan proses upload saat ini"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Batalkan</span>
              </button>
              <button
                onClick={() => setIsQueueExpanded(true)}
                className="px-2.5 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-semibold flex items-center space-x-1"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Rincian</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-2 rounded-full transition-all duration-300 ease-out shadow-xs"
              style={{ width: `${Math.max(2, activeTask.percent)}%` }}
            />
          </div>

          {/* Live file status ticker & progress */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-300 font-mono text-[10px] truncate max-w-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block flex-shrink-0" />
                <span className="truncate">
                  {activeTask.currentFileName ? (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">Sedang:</span>{' '}
                      <strong className="text-blue-600 dark:text-blue-400">{activeTask.currentFileName}</strong>
                      {activeTask.currentFileBytes ? (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-semibold text-[10px]">
                          {formatBytes(activeTask.currentFileLoaded || 0)} / {formatBytes(activeTask.currentFileBytes)} ({activeTask.currentFilePercent || 0}%)
                        </span>
                      ) : null}
                    </>
                  ) : 'Menyiapkan berkas...'}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-mono">
                {activeTask.etaText && (
                  <span className="text-gray-500 dark:text-gray-400">
                    ETA: {activeTask.etaText}
                  </span>
                )}
                {activeTask.currentFileBytes && activeTask.currentFileBytes > 3 * 1024 * 1024 && (
                  <button
                    type="button"
                    onClick={() => skipCurrentFile(activeTask.id)}
                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 rounded transition-colors font-medium flex items-center space-x-1"
                    title="Lewati berkas besar ini dan lanjutkan berkas lainnya dalam antrean"
                  >
                    <span>Lewati Berkas Ini</span>
                  </button>
                )}
                {activeTask.recentLogs && activeTask.recentLogs.length > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[220px]">
                    {activeTask.recentLogs[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Sub progress bar for current active file if > 1MB */}
            {activeTask.currentFileBytes && activeTask.currentFileBytes > 1024 * 1024 && (
              <div className="w-full bg-blue-100 dark:bg-blue-950/60 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${Math.max(2, activeTask.currentFilePercent || 0)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Recovery Banner with Resume Button */}
      {!activeTask && uploadQueue.some(t => t.status === 'error') && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">
                Ada proses upload yang terhenti sebelum selesai.
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                Koneksi sempat terputus pada berkas tertentu. Anda dapat langsung melanjutkan upload dari posisi berkas yang tersisa tanpa harus mulai dari awal.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {uploadQueue.filter(t => t.status === 'error').map(errTask => (
              <button
                key={errTask.id}
                type="button"
                onClick={() => retryTask(errTask.id)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Lanjutkan Upload ({errTask.completedFiles}/{errTask.totalFiles})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Storage and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3 text-gray-500">
          <span>Kapasitas Digunakan: <strong className="text-gray-900 dark:text-white font-mono">{totalUsageFormatted}</strong> / {storageGb === -1 ? 'Unlimited' : `${storageGb} GB`}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari file dalam direktori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>
      </div>

      {/* File Explorer Table with Drag & Drop Container */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white dark:bg-gray-900 border rounded-3xl overflow-hidden shadow-xs transition-all ${
          isDraggingOver
            ? 'border-blue-500 ring-4 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* Drag Overlay Backdrop */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-blue-600/10 dark:bg-blue-500/20 backdrop-blur-xs border-2 border-dashed border-blue-500 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-pulse pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-lg">
              <FolderUp className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">Lepaskan File atau Folder di Sini</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-sm">
              File atau seluruh folder proyek Anda akan otomatis diunggah dan mempertahankan struktur direktori secara instan.
            </p>
          </div>
        )}
        {loading && items.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p>Memuat direktori berkas...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-rose-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p>{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 space-y-2">
            <Folder className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700" />
            <p>Direktori ini kosong atau tidak ada berkas yang sesuai pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Nama Berkas / Folder</th>
                  <th className="py-3 px-5">Ukuran</th>
                  <th className="py-3 px-5">Hak Akses</th>
                  <th className="py-3 px-5">Terakhir Diubah</th>
                  <th className="py-3 px-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                {/* Back to parent directory row if not in root */}
                {currentPath !== '/' && (
                  <tr
                    onClick={() => {
                      const parent = '/' + breadcrumbParts.slice(0, -1).join('/');
                      setCurrentPath(parent === '' ? '/' : parent);
                    }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    <td colSpan={5} className="py-3 px-5 text-gray-500 font-sans flex items-center space-x-2">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>.. (Kembali ke folder sebelumnya)</span>
                    </td>
                  </tr>
                )}

                {filteredItems.map((item) => (
                  <tr
                    key={item.name}
                    onClick={() => {
                      if (item.isDirectory) {
                        handleNavigate(item.name);
                      }
                    }}
                    onDoubleClick={() => {
                      if (item.isDirectory) {
                        handleNavigate(item.name);
                      } else {
                        handleOpenFile(item);
                      }
                    }}
                    className={`transition-colors group ${
                      item.isDirectory
                        ? 'cursor-pointer hover:bg-blue-50/70 dark:hover:bg-blue-950/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-5 font-sans">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="flex-shrink-0 cursor-pointer"
                          onClick={(e) => {
                            if (item.isDirectory) {
                              e.stopPropagation();
                              handleNavigate(item.name);
                            }
                          }}
                        >
                          {getFileIcon(item)}
                        </div>
                        {item.isDirectory ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(item.name);
                            }}
                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors flex items-center space-x-1"
                          >
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(item);
                            }}
                            className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors"
                          >
                            {item.name}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500">{item.sizeFormatted}</td>
                    <td className="py-3.5 px-5 text-gray-400">{item.mode}</td>
                    <td className="py-3.5 px-5 text-gray-500 font-sans">
                      {item.mtime ? item.mtime.slice(0, 16).replace('T', ' ') : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.isDirectory ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(item.name);
                            }}
                            className="px-2.5 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold"
                            title="Buka Folder Ini"
                          >
                            <span>Buka</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <>
                            {/* Extract archive button */}
                            {['zip', 'tar', 'gz', 'tgz', 'rar'].includes(item.extension || '') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExtractArchive(item);
                                }}
                                title="Ekstrak Berkas Arsip ke Direktori Ini"
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(item);
                              }}
                              title="Edit Kode/Teks"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/api/services/${serviceCode}/files/download?path=${encodeURIComponent(
                                currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`
                              )}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Unduh Berkas"
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget(item);
                            setRenameNewName(item.name);
                          }}
                          title="Ubah Nama"
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(item);
                          }}
                          title="Hapus"
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Code/Text File Editor */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-neutral-100">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-semibold">{editingFile.path}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveContent}
                  disabled={isSavingContent}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  {isSavingContent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingContent ? 'Menyimpan...' : 'Simpan Berkas'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-4 flex-1 overflow-auto bg-neutral-950 font-mono text-xs">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                rows={22}
                className="w-full h-full bg-transparent border-0 text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex justify-between items-center px-5">
              <span>Baris Kode: {editingFile.content.split('\n').length}</span>
              <span>Encoding: UTF-8</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New File */}
      {newFileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFile}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                  <FilePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Buat File Baru</h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Lokasi: public_html/{activeFolder}{currentPath !== '/' ? currentPath : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                Nama File (beserta ekstensi):
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="contoh: index.php, style.css, script.js, .htaccess"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Mendukung file teks, skrip PHP, HTML, CSS, JavaScript, konfigurasi, dll.
              </span>
            </div>

            {/* Template options */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Pilih Template Konten Awal:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNewFileTemplate('blank');
                    if (!newFileName) setNewFileName('file.txt');
                  }}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    newFileTemplate === 'blank'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="block font-semibold">File Kosong</span>
                  <span className="text-[10px] opacity-75">Tanpa konten awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewFileTemplate('php');
                    if (!newFileName || newFileName === 'file.txt') setNewFileName('index.php');
                  }}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    newFileTemplate === 'php'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="block font-semibold">Skrip PHP</span>
                  <span className="text-[10px] opacity-75">Template dasar PHP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewFileTemplate('html');
                    if (!newFileName || newFileName === 'file.txt') setNewFileName('index.html');
                  }}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    newFileTemplate === 'html'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="block font-semibold">HTML5 Template</span>
                  <span className="text-[10px] opacity-75">Struktur HTML standar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewFileTemplate('htaccess');
                    if (!newFileName || newFileName === 'file.txt') setNewFileName('.htaccess');
                  }}
                  className={`p-2 rounded-xl text-left border transition-colors ${
                    newFileTemplate === 'htaccess'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="block font-semibold">.htaccess</span>
                  <span className="text-[10px] opacity-75">Konfigurasi web server</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isActionLoading || !newFileName.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Buat File & Buka Editor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: New Folder */}
      {newFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Buat Folder Baru</h3>
            <p className="text-xs text-gray-500">
              Folder akan dibuat di direktori: <code className="font-mono text-gray-900 dark:text-white">{currentPath}</code>
            </p>
            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Nama Folder:</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="contoh: css, images, api"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Buat Folder</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Rename */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRename}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Ubah Nama Berkas/Folder</h3>
            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Nama Baru:</label>
              <input
                type="text"
                required
                autoFocus
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <span>Konfirmasi Hapus</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus {deleteTarget.isDirectory ? 'folder' : 'file'}{' '}
              <strong className="font-mono text-gray-900 dark:text-white">{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Upload Queue Manager Widget */}
      {uploadQueue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          {!isQueueExpanded ? (
            /* Minimized Pill Widget */
            <button
              onClick={() => setIsQueueExpanded(true)}
              className="flex items-center space-x-3 px-4 py-3 bg-neutral-900/95 dark:bg-gray-900/95 text-white rounded-2xl shadow-2xl border border-gray-800 dark:border-gray-700 backdrop-blur-md hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="relative">
                {activeTask ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {queuedCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold">
                  {activeTask
                    ? `Mengunggah (${activeTask.percent}%)`
                    : `Upload Selesai (${completedCount}/${totalQueueTasks})`}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {activeTask
                    ? `${activeTask.completedFiles}/${activeTask.totalFiles} berkas • ${activeTask.speedText || 'Aktif'}`
                    : 'Semua berkas siap'}
                </p>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          ) : (
            /* Expanded Floating Drawer Widget */
            <div className="w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 flex flex-col">
              {/* Header */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Antrean Upload
                    </h4>
                    <span className="text-[10px] text-gray-500">
                      {completedCount} dari {totalQueueTasks} tugas selesai
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {completedCount > 0 && (
                    <button
                      onClick={clearCompletedTasks}
                      className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                      title="Bersihkan riwayat tugas yang sudah selesai"
                    >
                      Bersihkan
                    </button>
                  )}
                  <button
                    onClick={() => setIsQueueExpanded(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Kecilkan jendela"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 p-2 space-y-2">
                {uploadQueue.map(task => {
                  const isTaskActive = task.status === 'uploading';
                  const isTaskQueued = task.status === 'queued';
                  const isTaskDone = task.status === 'completed';
                  const isTaskFailed = task.status === 'error' || task.status === 'cancelled';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl text-xs space-y-2 transition-colors ${
                        isTaskActive
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60'
                          : 'bg-gray-50/50 dark:bg-gray-800/40 border border-transparent'
                      }`}
                    >
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          {task.type === 'folder' ? (
                            <FolderUp className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <File className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate text-[11px]">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              Ke: {task.targetPath}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {isTaskActive && (
                            <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400">
                              {task.percent}%
                            </span>
                          )}
                          {isTaskQueued && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center space-x-0.5">
                              <Clock className="w-3 h-3" />
                              <span>Antrean</span>
                            </span>
                          )}
                          {isTaskDone && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selesai</span>
                            </span>
                          )}
                          {isTaskFailed && (
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-rose-500 font-medium flex items-center space-x-0.5" title={task.errorMessage}>
                                <XCircle className="w-3 h-3" />
                                <span>{task.status === 'cancelled' ? 'Batal' : 'Gagal'}</span>
                              </span>
                              {task.status === 'error' && (
                                <button
                                  type="button"
                                  onClick={() => retryTask(task.id)}
                                  className="px-1.5 py-0.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 rounded transition-colors flex items-center space-x-0.5 font-semibold"
                                  title="Lanjutkan / Coba Lagi Upload dari berkas yang tersisa"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  <span>Coba Lagi</span>
                                </button>
                              )}
                            </div>
                          )}

                          {(isTaskActive || isTaskQueued) && (
                            <button
                              type="button"
                              onClick={() => cancelTask(task.id)}
                              className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                              title="Batalkan tugas ini"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(isTaskActive || isTaskDone || isTaskQueued || isTaskFailed) && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isTaskDone
                                ? 'bg-emerald-500'
                                : isTaskFailed
                                ? 'bg-rose-500'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                            style={{ width: `${isTaskDone ? 100 : Math.max(3, task.percent)}%` }}
                          />
                        </div>
                      )}

                      {/* Info & Micro Stats */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                        <span>
                          {task.completedFiles}/{task.totalFiles} berkas ({formatBytes(task.uploadedBytes)} / {formatBytes(task.totalBytes)})
                        </span>
                        {task.speedText && isTaskActive && (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {task.speedText}
                          </span>
                        )}
                      </div>

                      {/* Error Message notice if failed */}
                      {isTaskFailed && task.errorMessage && (
                        <p className="text-[10px] text-rose-500 font-mono truncate bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          Error: {task.errorMessage}
                        </p>
                      )}

                      {/* Live Ticker Current File */}
                      {isTaskActive && task.currentFileName && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-blue-700 dark:text-blue-300 font-medium truncate max-w-[190px]" title={task.currentFileName}>
                              {task.currentFileName}
                            </span>
                            {task.currentFileBytes ? (
                              <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                                {task.currentFilePercent || 0}%
                              </span>
                            ) : null}
                          </div>
                          {task.currentFileBytes && task.currentFileBytes > 1024 * 1024 && (
                            <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-150"
                                style={{ width: `${Math.max(2, task.currentFilePercent || 0)}%` }}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                            <span>
                              {task.currentFileBytes
                                ? `${formatBytes(task.currentFileLoaded || 0)} / ${formatBytes(task.currentFileBytes)}`
                                : 'Mengirim...'}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {task.etaText && <span>ETA {task.etaText}</span>}
                              {task.currentFileBytes && task.currentFileBytes > 3 * 1024 * 1024 && (
                                <button
                                  type="button"
                                  onClick={() => skipCurrentFile(task.id)}
                                  className="text-amber-600 hover:text-amber-700 font-medium underline"
                                  title="Lewati berkas besar ini"
                                >
                                  Lewati
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recent Success Logs */}
                      {task.recentLogs && task.recentLogs.length > 0 && (
                        <div className="space-y-0.5 pt-0.5">
                          {task.recentLogs.slice(0, 2).map((log, logIdx) => (
                            <p key={logIdx} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                              {log}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Help */}
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
                <span>Dapat drag & drop berkas/folder baru kapan saja.</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Auto Chunk 5-File</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Conflict Resolution (Replace All / Skip Existing / Cancel) */}
      {conflictModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-500">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  File atau Folder Sudah Ada
                </h3>
                <p className="text-xs text-gray-500">
                  Konfirmasi penimpaan berkas di direktori saat ini
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                Terdapat <strong>{conflictModal.conflicts.length}</strong> file atau folder dengan nama yang sama di folder{' '}
                <code className="font-mono text-gray-900 dark:text-white font-semibold">{currentPath}</code>:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {conflictModal.conflicts.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Pilih apakah Anda ingin menimpa berkas lama (<em>Replace All</em>), hanya mengunggah berkas baru yang belum ada, atau membatalkan upload.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictModal(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  const conflictSet = new Set(conflictModal.conflicts.map(c => c.toLowerCase()));
                  const filtered = conflictModal.rawItems.filter(it => !conflictSet.has(it.relativePath.split('/')[0].toLowerCase()));
                  const customTitle = conflictModal.customTitle;
                  setConflictModal(null);
                  if (filtered.length > 0) {
                    executeEnqueue(filtered, customTitle);
                  } else {
                    setActionMessage({ type: 'success', text: 'Semua berkas dilewati karena sudah ada di direktori.' });
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Lewati yang Ada
              </button>

              <button
                type="button"
                onClick={() => {
                  const itemsToUpload = conflictModal.rawItems;
                  const customTitle = conflictModal.customTitle;
                  setConflictModal(null);
                  executeEnqueue(itemsToUpload, customTitle);
                }}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                Timpa Semua (Replace All)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
