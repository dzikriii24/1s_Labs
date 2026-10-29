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
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  Download,
  ChevronRight,
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

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Navigate folder
  const handleNavigate = (folderName: string) => {
    const nextPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    setCurrentPath(nextPath);
  };

  const handleBreadcrumbClick = (index: number, parts: string[]) => {
    if (index === -1) {
      setCurrentPath('/');
      return;
    }
    const path = '/' + parts.slice(0, index + 1).join('/');
    setCurrentPath(path);
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

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setIsUploading(true);
      const res = await api.files.upload(serviceCode, currentPath, formData);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        loadFiles();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengunggah file.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            disabled={isUploading}
            className="px-3.5 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Mengunggah...' : 'Unggah File'}</span>
          </button>

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

      {/* File Explorer Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-5 font-sans">
                      <div className="flex items-center space-x-2.5">
                        {getFileIcon(item)}
                        {item.isDirectory ? (
                          <button
                            onClick={() => handleNavigate(item.name)}
                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenFile(item)}
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
                        {!item.isDirectory && (
                          <>
                            <button
                              onClick={() => handleOpenFile(item)}
                              title="Edit Kode/Teks"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/api/services/${serviceCode}/files/download?path=${encodeURIComponent(
                                currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`
                              )}`}
                              title="Unduh Berkas"
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setRenameTarget(item);
                            setRenameNewName(item.name);
                          }}
                          title="Ubah Nama"
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
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
    </div>
  );
};
