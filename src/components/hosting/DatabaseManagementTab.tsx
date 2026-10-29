import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Table,
  HardDrive,
  Key,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  X,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  Play,
  Terminal,
  FileCode,
  Code2,
  RefreshCw,
  BookOpen,
  Upload,
  Download,
  FileUp,
  Cloud,
  ShieldCheck,
  RotateCcw,
  Clock,
  Archive,
  History
} from 'lucide-react';
import { api, HostingDatabase, TableItem, DatabaseBackup } from '../../services/api';

interface DatabaseManagementTabProps {
  serviceCode: string;
  databasesCount: number;
}

export const DatabaseManagementTab: React.FC<DatabaseManagementTabProps> = ({
  serviceCode,
  databasesCount
}) => {
  const [databases, setDatabases] = useState<HostingDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameSuffix, setNameSuffix] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  // Table browser modal state
  const [browserModalOpen, setBrowserModalOpen] = useState(false);
  const [selectedDb, setSelectedDb] = useState<HostingDatabase | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Table data viewer state
  const [viewingTable, setViewingTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [tableRecords, setTableRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingRecords, setLoadingRecords] = useState(false);

  // SQL Console & Table Creator state
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlFeedback, setSqlFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export & Import states
  const [exportingDbId, setExportingDbId] = useState<number | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetDb, setImportTargetDb] = useState<HostingDatabase | null>(null);
  const [selectedSqlFile, setSelectedSqlFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sub-tabs: 'databases' | 'backups'
  const [activeSubTab, setActiveSubTab] = useState<'databases' | 'backups'>('databases');

  // Cloud Backups state
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackupDbFilter, setSelectedBackupDbFilter] = useState<string>('all');
  const [manualBackupModalOpen, setManualBackupModalOpen] = useState(false);
  const [targetDbForBackup, setTargetDbForBackup] = useState<number | ''>('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [restoreConfirmBackup, setRestoreConfirmBackup] = useState<DatabaseBackup | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [deletingBackupId, setDeletingBackupId] = useState<number | null>(null);

  const filteredBackups = selectedBackupDbFilter === 'all'
    ? backups
    : backups.filter((b) => String(b.database_id) === selectedBackupDbFilter || b.database_name === selectedBackupDbFilter);

  // Newly created DB details popup
  const [createdInfo, setCreatedInfo] = useState<any | null>(null);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await api.databases.getBackups(serviceCode);
      if (res.success) {
        setBackups(res.backups);
      }
    } catch (err: any) {
      console.warn('Failed to load backups:', err.message);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateManualBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDbForBackup) return;
    try {
      setIsCreatingBackup(true);
      const res = await api.databases.createBackup(serviceCode, Number(targetDbForBackup));
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Cadangan database berhasil dibuat.' });
        setManualBackupModalOpen(false);
        setTargetDbForBackup('');
        loadBackups();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membuat cadangan database.' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backup: DatabaseBackup) => {
    try {
      await api.databases.downloadBackup(serviceCode, backup.id, backup.filename);
      setFeedback({ type: 'success', text: `Mengunduh berkas cadangan '${backup.filename}'.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengunduh file cadangan.' });
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreConfirmBackup) return;
    try {
      setIsRestoringBackup(true);
      const res = await api.databases.restoreBackup(serviceCode, restoreConfirmBackup.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Database berhasil dipulihkan.' });
        setRestoreConfirmBackup(null);
        loadDatabases();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memulihkan database.' });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleDeleteBackup = async (backup: DatabaseBackup) => {
    if (!window.confirm(`Hapus file cadangan '${backup.filename}' dari server?`)) return;
    try {
      setDeletingBackupId(backup.id);
      const res = await api.databases.deleteBackup(serviceCode, backup.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Cadangan berhasil dihapus.' });
        loadBackups();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menghapus cadangan.' });
    } finally {
      setDeletingBackupId(null);
    }
  };

  const handleExportDatabase = async (db: HostingDatabase) => {
    try {
      setExportingDbId(db.id);
      const filename = `${db.db_name}_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      await api.databases.exportDatabase(serviceCode, db.id, filename);
      setFeedback({ type: 'success', text: `Database '${db.db_name}' berhasil diekspor sebagai '${filename}'.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengekspor database.' });
    } finally {
      setExportingDbId(null);
    }
  };

  const handleOpenImportModal = (db: HostingDatabase) => {
    setImportTargetDb(db);
    setSelectedSqlFile(null);
    setImportFeedback(null);
    setImportModalOpen(true);
  };

  const handleExecuteImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTargetDb || !selectedSqlFile) return;

    try {
      setIsImporting(true);
      setImportFeedback(null);
      const formData = new FormData();
      formData.append('sqlFile', selectedSqlFile);

      const res = await api.databases.importDatabase(serviceCode, importTargetDb.id, formData);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'File SQL berhasil diimpor.' });
        setImportModalOpen(false);
        // Refresh databases and current table explorer if opened
        loadDatabases();
        if (selectedDb && selectedDb.id === importTargetDb.id) {
          const tblRes = await api.databases.getTables(serviceCode, selectedDb.id);
          if (tblRes.success) setTables(tblRes.tables);
        }
      }
    } catch (err: any) {
      setImportFeedback({ type: 'error', text: err.message || 'Gagal mengimpor file SQL.' });
    } finally {
      setIsImporting(false);
    }
  };

  const loadDatabases = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.databases.list(serviceCode);
      if (res.success) {
        setDatabases(res.databases);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
    loadBackups();
  }, [serviceCode]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameSuffix.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await api.databases.create(serviceCode, {
        nameSuffix: nameSuffix.trim(),
        customPassword: customPassword.trim() || undefined
      });
      if (res.success) {
        setCreatedInfo(res.database);
        setFeedback({ type: 'success', text: res.message });
        setCreateModalOpen(false);
        setNameSuffix('');
        setCustomPassword('');
        loadDatabases();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membuat database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDatabase = async (db: HostingDatabase) => {
    if (!window.confirm(`PERINGATAN: Anda yakin ingin menghapus database '${db.db_name}' secara permanen? Seluruh tabel dan data akan dihapus.`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.databases.delete(serviceCode, db.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        loadDatabases();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menghapus database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open tables browser
  const handleOpenBrowser = async (db: HostingDatabase) => {
    setSelectedDb(db);
    setBrowserModalOpen(true);
    setViewingTable(null);
    setSqlFeedback(null);
    try {
      setLoadingTables(true);
      const res = await api.databases.getTables(serviceCode, db.id);
      if (res.success) {
        setTables(res.tables);
        if (res.tables.length === 0) {
          setIsSqlConsoleOpen(true);
        } else {
          setIsSqlConsoleOpen(false);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memuat tabel database.' });
    } finally {
      setLoadingTables(false);
    }
  };

  const applyTemplate = (type: 'users' | 'products' | 'posts' | 'messages' | 'insert') => {
    if (type === 'users') {
      setSqlQuery(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    } else if (type === 'products') {
      setSqlQuery(`CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    } else if (type === 'posts') {
      setSqlQuery(`CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  content LONGTEXT,
  status ENUM('draft', 'published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    } else if (type === 'messages') {
      setSqlQuery(`CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
    } else if (type === 'insert') {
      setSqlQuery(`-- Contoh INSERT data ke tabel yang sudah dibuat:
INSERT INTO users (name, email, password)
VALUES ('Admin 1sLabs', 'admin@1slabs.my.id', 'PasswordAman123!');`);
    }
    setSqlFeedback(null);
  };

  const handleExecuteSql = async () => {
    if (!selectedDb || !sqlQuery.trim()) return;
    try {
      setIsExecutingSql(true);
      setSqlFeedback(null);
      const res = await api.databases.executeQuery(serviceCode, selectedDb.id, sqlQuery.trim());
      if (res.success) {
        setSqlFeedback({ type: 'success', text: res.message || 'Kueri SQL berhasil dieksekusi.' });
        // Refresh tables list
        const tblRes = await api.databases.getTables(serviceCode, selectedDb.id);
        if (tblRes.success) {
          setTables(tblRes.tables);
          loadDatabases();
        }
      }
    } catch (err: any) {
      setSqlFeedback({ type: 'error', text: err.message || 'Eksekusi query SQL gagal.' });
    } finally {
      setIsExecutingSql(false);
    }
  };

  // View specific table data
  const handleViewTableRecords = async (tableName: string, page = 1) => {
    if (!selectedDb) return;
    setViewingTable(tableName);
    try {
      setLoadingRecords(true);
      const res = await api.databases.getTableRecords(serviceCode, selectedDb.id, tableName, page);
      if (res.success) {
        setTableColumns(res.columns);
        setTableRecords(res.records);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membaca isi tabel.' });
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub Tab Navigation: Databases & Tables vs Cloud Backup & Restore */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('databases')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'databases'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Daftar Database & Tabel</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'databases'
              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {databases.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('backups');
            loadBackups();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeSubTab === 'backups'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-emerald-500" />
          <span>Cloud Backup & Restore</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'backups'
              ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
          }`}>
            {backups.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: DAFTAR DATABASE & TABEL */}
      {activeSubTab === 'databases' && (
        <div className="space-y-6">
          {/* Database Connection Specs (Hostinger Style) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Manajemen Database MySQL / MariaDB</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Setiap database dikonfigurasi dengan user dan hak akses terisolasi untuk keamanan maksimal aplikasi web Anda.
                </p>
              </div>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Database Baru</span>
              </button>
            </div>

            {/* 4 Database specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 block mb-1">Host Database:</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">localhost</span>
                  <button
                    onClick={() => copyToClipboard('localhost', 'dbhost')}
                    className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {copiedKey === 'dbhost' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 block mb-1">Port MySQL:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">3306</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 block mb-1">Engine & Versi:</span>
                <span className="font-semibold text-gray-900 dark:text-white">MariaDB 10.11 LTS</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 block mb-1">Penggunaan Kuota:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {databases.length} / {databasesCount === -1 ? 'Unlimited' : `${databasesCount} Database`}
                </span>
              </div>
            </div>
          </div>

          {/* Newly Created DB Credentials Dialog */}
          {createdInfo && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kredensial Database Baru Berhasil Dibuat</span>
                </div>
                <button onClick={() => setCreatedInfo(null)} className="text-emerald-700 hover:opacity-75">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300">
                Simpan kredensial ini di file konfigurasi aplikasi Anda (seperti <code className="font-mono font-bold">.env</code> atau <code className="font-mono font-bold">wp-config.php</code>):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 font-mono">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">DB_NAME:</span>
                  <strong className="text-gray-900 dark:text-white">{createdInfo.db_name}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">DB_USER:</span>
                  <strong className="text-gray-900 dark:text-white">{createdInfo.db_user}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">DB_PASS:</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-600 dark:text-emerald-400">{createdInfo.db_password}</strong>
                    <button
                      onClick={() => copyToClipboard(createdInfo.db_password, 'newpass')}
                      className="p-0.5 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {copiedKey === 'newpass' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Databases List Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Daftar Database Terdaftar
              </h4>
              <span className="text-xs text-gray-500 font-mono">
                {databases.length} Database Aktif
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p>Memuat database MySQL...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-rose-500 space-y-2">
                <AlertCircle className="w-5 h-5 mx-auto" />
                <p>{error}</p>
              </div>
            ) : databases.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500 space-y-3">
                <Database className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700" />
                <p>Belum ada database yang dibuat untuk layanan hosting ini.</p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Database Pertama</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-5">Nama Database</th>
                      <th className="py-3 px-5">User Berizin</th>
                      <th className="py-3 px-5">Jumlah Tabel</th>
                      <th className="py-3 px-5">Ukuran</th>
                      <th className="py-3 px-5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                    {databases.map((db) => (
                      <tr key={db.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-2">
                            <strong className="text-gray-900 dark:text-white">{db.db_name}</strong>
                            <button
                              onClick={() => copyToClipboard(db.db_name, `dbname-${db.id}`)}
                              className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              {copiedKey === `dbname-${db.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-gray-500">{db.db_user}</td>
                        <td className="py-4 px-5 text-gray-500 font-sans">{db.tableCount} Tabel</td>
                        <td className="py-4 px-5 text-gray-500">{db.sizeFormatted}</td>
                        <td className="py-4 px-5 text-right font-sans">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenBrowser(db)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                            >
                              <Table className="w-3.5 h-3.5" />
                              <span>Jelajah</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetDbForBackup(db.id);
                                setManualBackupModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Buat snapshot cadangan database ini sekarang"
                            >
                              <Cloud className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Backup</span>
                            </button>
                            <button
                              type="button"
                              disabled={exportingDbId === db.id}
                              onClick={() => handleExportDatabase(db)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Ekspor / Download cadangan .sql database ini"
                            >
                              {exportingDbId === db.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">Ekspor</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenImportModal(db)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Impor file .sql ke database ini"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Impor</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDatabase(db)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Hapus Database"
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

          {/* Guide Card: 3 Cara Membuat & Mengelola Tabel Database */}
          <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-900 dark:to-emerald-950/20 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2.5 text-gray-900 dark:text-white">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">Panduan: 3 Cara Membuat & Mengisi Tabel di Database Anda</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Setelah database dibuat, Anda memiliki kebebasan penuh untuk mendefinisikan skema tabel dan menyimpan data melalui 3 metode fleksibel berikut:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>1. Melalui SQL Console 1sLabs</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Klik tombol <strong>"Jelajah Tabel"</strong> pada database di atas, lalu pilih <strong>"+ Buat Tabel / SQL"</strong>. Anda dapat menggunakan template instan (Users, Products, Posts) atau mengetikkan kueri DDL <code className="font-mono text-emerald-600">CREATE TABLE</code> langsung.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs">
                  <Code2 className="w-4 h-4" />
                  <span>2. Dari Aplikasi (.env / Config)</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Hubungkan database ke framework Anda (Laravel, Node.js, Next.js, WordPress) menggunakan kredensial host <code className="font-mono">localhost</code>, user, dan password. Jalankan migrasi otomatis seperti <code className="font-mono">php artisan migrate</code> atau <code className="font-mono">npx prisma db push</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-purple-600 font-semibold text-xs">
                  <FileCode className="w-4 h-4" />
                  <span>3. Import File Script .SQL</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Punya dump database dari hosting lama atau template CMS? Buka file <code className="font-mono">.sql</code> Anda melalui <strong>File Manager</strong>, salin isinya, dan tempelkan langsung ke <strong>SQL Console</strong> untuk eksekusi batch instan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CLOUD BACKUP & RESTORE HARIAN */}
      {activeSubTab === 'backups' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Cloud Backup & Restore Database Otomatis
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Harian 02:00 WIB</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 max-w-3xl leading-relaxed pt-1">
                  Database Anda dicadangkan secara otomatis setiap hari pada pukul <strong>02:00 WIB</strong> ke penyimpanan cloud aman terisolasi dengan retensi 14 hari. Anda juga dapat membuat snapshot manual kapan saja dan melakukan restore instan dengan 1-klik.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={loadBackups}
                  disabled={loadingBackups}
                  className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Segarkan riwayat cadangan"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetDbForBackup(databases[0]?.id || '');
                    setManualBackupModalOpen(true);
                  }}
                  disabled={databases.length === 0}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Snapshot Manual</span>
                </button>
              </div>
            </div>

            {/* 4 Feature Badges / Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Jadwal Backup Otomatis:</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Setiap Hari 02:00 WIB</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>Retensi Penyimpanan:</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">14 Hari Siklus Aman</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <Archive className="w-3.5 h-3.5 text-purple-500" />
                  <span>Snapshot Tersedia:</span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {backups.length} Berkas Cadangan
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-2 text-gray-500 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Integritas mysqldump:</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Transactional + Triggers</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & List Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Riwayat Snapshot & Cadangan Cloud
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar seluruh file dump SQL yang tersimpan aman di server cloud backup 1sLabs.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <label className="text-gray-500 font-medium">Filter Database:</label>
                <select
                  value={selectedBackupDbFilter}
                  onChange={(e) => setSelectedBackupDbFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="all">Semua Database ({backups.length})</option>
                  {databases.map((db) => (
                    <option key={db.id} value={String(db.id)}>
                      {db.db_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingBackups ? (
              <div className="py-16 text-center text-xs text-gray-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                <p>Memuat daftar cadangan database cloud...</p>
              </div>
            ) : filteredBackups.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500 space-y-3">
                <Cloud className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Belum ada berkas cadangan untuk database yang dipilih.
                </p>
                <p className="text-gray-400 max-w-md mx-auto">
                  Sistem otomatis akan mencadangkan database Anda malam ini pukul 02:00 WIB, atau Anda dapat membuat snapshot pertama Anda sekarang.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTargetDbForBackup(databases[0]?.id || '');
                    setManualBackupModalOpen(true);
                  }}
                  disabled={databases.length === 0}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Snapshot Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-5">Database</th>
                      <th className="py-3 px-5">Nama Berkas Cadangan</th>
                      <th className="py-3 px-5">Jenis Cadangan</th>
                      <th className="py-3 px-5">Ukuran</th>
                      <th className="py-3 px-5">Waktu Pencadangan</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                    {filteredBackups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4 px-5">
                          <strong className="text-gray-900 dark:text-white">
                            {backup.database_name}
                          </strong>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-300 font-mono text-[11px] truncate max-w-[220px]" title={backup.filename}>
                              {backup.filename}
                            </span>
                            <button
                              onClick={() => copyToClipboard(backup.filename, `backup-${backup.id}`)}
                              className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                              title="Salin nama file"
                            >
                              {copiedKey === `backup-${backup.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-sans">
                          {backup.backup_type === 'daily_auto' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Otomatis Harian
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <HardDrive className="w-3 h-3 mr-1" />
                              Snapshot Manual
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-gray-500">
                          {backup.file_size_formatted || `${(backup.file_size / 1024).toFixed(1)} KB`}
                        </td>
                        <td className="py-4 px-5 text-gray-500 font-sans">
                          {new Date(backup.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-4 px-5 font-sans">
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Tersedia
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-sans">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadBackup(backup)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Unduh file .sql ini ke komputer Anda"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Unduh</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRestoreConfirmBackup(backup)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                              title="Pulihkan database ini dari snapshot"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              type="button"
                              disabled={deletingBackupId === backup.id}
                              onClick={() => handleDeleteBackup(backup)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Hapus berkas snapshot ini"
                            >
                              {deletingBackupId === backup.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
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

          {/* Educational info card about 1-click restore */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-blue-50/30 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-7 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Keamanan & Cara Kerja Pemulihan 1-Klik</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Saat Anda menekan tombol <strong>Restore</strong>, server 1sLabs akan membaca file SQL snapshot dan mengeksekusinya secara transaksional langsung ke dalam database MariaDB/MySQL terkait. Seluruh data tabel akan dikembalikan persis seperti saat snapshot dibuat. Sangat berguna untuk rollback instan saat terjadi kesalahan migrasi atau update script aplikasi.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: Table Explorer & Records Browser */}
      {browserModalOpen && selectedDb && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>Database Explorer:</span>
                    <code className="font-mono text-emerald-600 dark:text-emerald-400">{selectedDb.db_name}</code>
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Host: localhost • Port: 3306 • User: {selectedDb.db_user}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={exportingDbId === selectedDb.id}
                  onClick={() => handleExportDatabase(selectedDb)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Ekspor / Download cadangan .sql database ini"
                >
                  {exportingDbId === selectedDb.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Ekspor (.sql)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImportModal(selectedDb)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                  title="Unggah dan impor file .sql ke database ini"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Impor (.sql)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSqlConsoleOpen(!isSqlConsoleOpen);
                    setViewingTable(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs ${
                    isSqlConsoleOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isSqlConsoleOpen ? 'Tutup SQL' : '+ Buat Tabel / SQL'}</span>
                </button>
                <button
                  onClick={() => setBrowserModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view (Tables list on left, SQL/records on right) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Tables List */}
              <div className="w-full md:w-64 border-r border-gray-100 dark:border-gray-800 overflow-y-auto p-4 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Daftar Tabel ({tables.length})
                  </h4>
                  <button
                    onClick={() => {
                      setIsSqlConsoleOpen(true);
                      setViewingTable(null);
                    }}
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-[11px] font-semibold flex items-center space-x-0.5"
                    title="Buat Tabel Baru"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Baru</span>
                  </button>
                </div>

                {loadingTables ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    <span>Memuat tabel...</span>
                  </div>
                ) : tables.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Table className="w-6 h-6 mx-auto text-gray-300 dark:text-gray-700" />
                    <p className="text-xs text-gray-400">Belum ada tabel pada database ini.</p>
                    <button
                      onClick={() => {
                        setIsSqlConsoleOpen(true);
                        setViewingTable(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Buat Tabel Pertama</span>
                    </button>
                  </div>
                ) : (
                  tables.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => {
                        setIsSqlConsoleOpen(false);
                        handleViewTableRecords(t.name, 1);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        !isSqlConsoleOpen && viewingTable === t.name
                          ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Table className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate font-mono">{t.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75 font-mono">{t.rows} baris</span>
                    </button>
                  ))
                )}
              </div>

              {/* Right Column: SQL Console OR Table Records View */}
              <div className="flex-1 overflow-auto p-5">
                {isSqlConsoleOpen ? (
                  /* SQL Console & Table Creator */
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-emerald-600" />
                          <span>SQL Console & Pembuat Tabel</span>
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Jalankan query DDL (CREATE TABLE, ALTER TABLE) atau DML (INSERT, SELECT) langsung ke database.
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 font-mono">MariaDB 10.11</span>
                      </div>
                    </div>

                    {/* Quick Template Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block">
                        Template Cepat:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyTemplate('users')}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + Tabel Users
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplate('products')}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + Tabel Products
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplate('posts')}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + Tabel Posts
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplate('messages')}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + Tabel Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplate('insert')}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + Contoh INSERT
                        </button>
                      </div>
                    </div>

                    {/* SQL Textarea Editor */}
                    <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                      <div className="bg-gray-900 text-gray-400 px-4 py-1.5 text-[10px] font-mono flex items-center justify-between border-b border-gray-800">
                        <span>SQL Query Editor</span>
                        <span>Ctrl + Enter untuk Eksekusi</span>
                      </div>
                      <textarea
                        rows={8}
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleExecuteSql();
                          }
                        }}
                        placeholder="Ketik query SQL di sini (contoh: CREATE TABLE ...)"
                        className="w-full p-4 bg-gray-950 text-emerald-400 font-mono text-xs focus:outline-none resize-y selection:bg-emerald-800"
                        spellCheck={false}
                      />
                    </div>

                    {/* Feedback alert */}
                    {sqlFeedback && (
                      <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                        sqlFeedback.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {sqlFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="font-mono">{sqlFeedback.text}</span>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-gray-400">
                        Database Target: <code className="font-mono text-gray-600 dark:text-gray-300">{selectedDb.db_name}</code>
                      </span>
                      <button
                        type="button"
                        onClick={handleExecuteSql}
                        disabled={isExecutingSql || !sqlQuery.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        {isExecutingSql ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>{isExecutingSql ? 'Mengeksekusi...' : 'Jalankan Query SQL'}</span>
                      </button>
                    </div>
                  </div>
                ) : !viewingTable ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16 space-y-3">
                    <Table className="w-10 h-10 opacity-40" />
                    <p className="text-xs">
                      Pilih salah satu tabel di sebelah kiri untuk melihat data, atau buat tabel baru melalui SQL Console.
                    </p>
                    <button
                      onClick={() => setIsSqlConsoleOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Buka SQL Console / Buat Tabel</span>
                    </button>
                  </div>
                ) : loadingRecords ? (
                  <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p>Memuat data tabel {viewingTable}...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Tabel: <code className="font-mono text-emerald-600">{viewingTable}</code> ({pagination.total} Total Baris)
                      </h4>
                      <span className="text-xs text-gray-500 font-mono">
                        Halaman {pagination.page} dari {pagination.totalPages || 1}
                      </span>
                    </div>

                    {tableRecords.length === 0 ? (
                      <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                        <p>Tabel ini belum memiliki data baris.</p>
                        <button
                          onClick={() => {
                            setIsSqlConsoleOpen(true);
                            setSqlQuery(`INSERT INTO ${viewingTable} (/* kolom */) VALUES (/* nilai */);`);
                          }}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert Baris via SQL</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                              {tableColumns.map((col) => (
                                <th key={col.name} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                                  {col.name}
                                  <span className="text-[10px] text-gray-400 block font-normal">{col.type}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                            {tableRecords.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                {tableColumns.map((col) => (
                                  <td key={col.name} className="py-2.5 px-4 whitespace-nowrap text-gray-800 dark:text-gray-200 max-w-xs truncate">
                                    {row[col.name] !== null && row[col.name] !== undefined
                                      ? String(row[col.name])
                                      : <span className="text-gray-400 italic">NULL</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination buttons */}
                    {pagination.totalPages > 1 && (
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          disabled={pagination.page <= 1}
                          onClick={() => handleViewTableRecords(viewingTable, pagination.page - 1)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 disabled:opacity-50 rounded-lg text-xs font-semibold"
                        >
                          Sebelumnya
                        </button>
                        <button
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => handleViewTableRecords(viewingTable, pagination.page + 1)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 disabled:opacity-50 rounded-lg text-xs font-semibold"
                        >
                          Berikutnya
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import SQL File */}
      {importModalOpen && importTargetDb && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteImport}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Impor Database SQL</h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Target: {importTargetDb.db_name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Pilih file cadangan database berekstensi <code className="font-mono font-bold text-gray-700 dark:text-gray-300">.sql</code> (misalnya hasil export phpMyAdmin atau backup lama). Sistem akan mengeksekusi seluruh skema tabel dan baris data secara otomatis.
            </p>

            {/* Drag & drop or file picker zone */}
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                id="sqlFileInput"
                accept=".sql,text/plain"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedSqlFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label htmlFor="sqlFileInput" className="cursor-pointer block space-y-2">
                <FileUp className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500" />
                {selectedSqlFile ? (
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block font-mono">
                      {selectedSqlFile.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {(selectedSqlFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti file
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
                      Klik untuk memilih file .sql
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Maksimal ukuran file: 50 MB
                    </span>
                  </div>
                )}
              </label>
            </div>

            {/* Warning notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <strong>Peringatan Penting:</strong>
              <p>
                Jika file SQL memuat perintah <code className="font-mono">DROP TABLE</code>, tabel dengan nama yang sama pada database ini akan ditimpa. Pastikan Anda telah mengekspor cadangan sebelumnya jika diperlukan.
              </p>
            </div>

            {/* Error feedback */}
            {importFeedback && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono">{importFeedback.text}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isImporting || !selectedSqlFile}
                className="px-5 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isImporting ? 'Mengimpor File...' : 'Mulai Impor SQL'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create New Database */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDatabase}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Buat Database MySQL Baru</h3>
            <p className="text-xs text-gray-500">
              Sistem akan otomatis mengonfigurasi database terisolasi lengkap dengan user baru dan grant hak akses penuh pada database tersebut.
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Suffix Nama Database:</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700/60 text-gray-500 text-xs rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 font-mono">
                  u1zh8984_
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="blog, db, web"
                  value={nameSuffix}
                  onChange={(e) => setNameSuffix(e.target.value)}
                  className="w-full px-3 py-2 rounded-r-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Maksimal 10 karakter alfanumerik.</span>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                Password User Database (Opsional):
              </label>
              <input
                type="text"
                placeholder="Kosongkan untuk auto-generate password kuat"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Buat Database</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Buat Snapshot Manual */}
      {manualBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateManualBackup}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Buat Snapshot Cadangan Baru
                </h3>
                <p className="text-xs text-gray-500">
                  Simpan kondisi database saat ini ke dalam berkas cadangan cloud.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">
                Pilih Database Target:
              </label>
              <select
                required
                value={targetDbForBackup}
                onChange={(e) => setTargetDbForBackup(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none font-mono"
              >
                <option value="">-- Pilih Database --</option>
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.db_name} ({db.sizeFormatted})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
              <strong>Info Snapshot:</strong>
              <p>
                Sistem akan menjalankan perintah <code className="font-mono">mysqldump --single-transaction</code> tanpa mengunci tabel, sehingga website Anda tetap dapat diakses normal selama proses berlangsung.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setManualBackupModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreatingBackup || !targetDbForBackup}
                className="px-5 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
              >
                {isCreatingBackup ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>{isCreatingBackup ? 'Membuat Snapshot...' : 'Buat Snapshot Sekarang'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Konfirmasi Restore Snapshot */}
      {restoreConfirmBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Konfirmasi Pemulihan Database (Restore)
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Tindakan ini akan menimpa data yang sedang aktif saat ini.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <p>
                Anda akan memulihkan snapshot cadangan berikut ke dalam database:
              </p>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-rose-200 dark:border-rose-950 space-y-1 font-mono text-[11px]">
                <div><span className="text-gray-400">Database Target:</span> <strong>{restoreConfirmBackup.database_name}</strong></div>
                <div><span className="text-gray-400">Nama Berkas:</span> {restoreConfirmBackup.filename}</div>
                <div><span className="text-gray-400">Waktu Cadangan:</span> {new Date(restoreConfirmBackup.created_at).toLocaleString('id-ID')}</div>
              </div>
              <p className="text-[11px] leading-relaxed pt-1">
                Seluruh data baru yang dibuat setelah tanggal pencadangan di atas akan hilang dan digantikan oleh isi dari snapshot ini.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isRestoringBackup}
                onClick={() => setRestoreConfirmBackup(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRestoringBackup}
                onClick={handleExecuteRestore}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
              >
                {isRestoringBackup ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{isRestoringBackup ? 'Memulihkan Database...' : 'Ya, Pulihkan Database Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
