import React, { useEffect, useState } from 'react';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Key,
  HardDrive,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Server,
  Sparkles,
  Info
} from 'lucide-react';
import { api, EmailLogItem, CompanyEmailAccount } from '../../../services/api';
import notify from '../../../lib/notify';
import { useAuth } from '../../../contexts/AuthContext';

interface EmailManagementViewProps {
  onNavigate?: (tab: string) => void;
}

export const EmailManagementView: React.FC<EmailManagementViewProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'company-emails' | 'smtp-logs'>('company-emails');

  // ==========================================
  // COMPANY EMAILS STATE (@1slabs.my.id via cPanel)
  // ==========================================
  const [companyEmails, setCompanyEmails] = useState<CompanyEmailAccount[]>([]);
  const [loadingCompanyEmails, setLoadingCompanyEmails] = useState(true);
  const [companyEmailSearch, setCompanyEmailSearch] = useState('');
  const [webmailUrl, setWebmailUrl] = useState('https://1slabs.my.id:2096');

  // Modals for Company Emails
  const [createEmailModalOpen, setCreateEmailModalOpen] = useState(false);
  const [changePasswordTarget, setChangePasswordTarget] = useState<CompanyEmailAccount | null>(null);
  const [changeQuotaTarget, setChangeQuotaTarget] = useState<CompanyEmailAccount | null>(null);
  const [deleteEmailTarget, setDeleteEmailTarget] = useState<CompanyEmailAccount | null>(null);

  // Create Form State
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [newEmailPassword, setNewEmailPassword] = useState('');
  const [newEmailQuota, setNewEmailQuota] = useState<number>(500);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submittingCreateEmail, setSubmittingCreateEmail] = useState(false);

  // Change Password State
  const [updatedPassword, setUpdatedPassword] = useState('');
  const [showUpdatedPassword, setShowUpdatedPassword] = useState(false);
  const [submittingChangePassword, setSubmittingChangePassword] = useState(false);

  // Change Quota State
  const [updatedQuota, setUpdatedQuota] = useState<number>(500);
  const [submittingChangeQuota, setSubmittingChangeQuota] = useState(false);

  // ==========================================
  // SMTP DELIVERY LOGS STATE
  // ==========================================
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchLogs, setSearchLogs] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  // Fetch Company Emails
  const fetchCompanyEmails = async () => {
    setLoadingCompanyEmails(true);
    try {
      const res = await api.companyEmails.list();
      if (res.success) {
        setCompanyEmails(res.accounts || []);
        if (res.webmailUrl) setWebmailUrl(res.webmailUrl);
      }
    } catch (err: any) {
      console.error('Failed to load company emails from cPanel', err);
      notify.error(err.message || 'Gagal memuat akun email company dari cPanel.');
    } finally {
      setLoadingCompanyEmails(false);
    }
  };

  // Fetch SMTP Delivery Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.admin.getEmailLogs({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load email delivery logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchCompanyEmails();
  }, []);

  useEffect(() => {
    if (activeTab === 'smtp-logs') {
      fetchLogs();
    }
  }, [activeTab, statusFilter]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Duplicate check for new email prefix
  const cleanPrefix = newEmailPrefix.trim().toLowerCase().replace(/@.*$/, '');
  const isDuplicate = companyEmails.some(
    (a) => (a.user || '').toLowerCase() === cleanPrefix
  );

  const handleOpenCreateModal = () => {
    setNewEmailPrefix('');
    setNewEmailPassword(generateRandomPassword());
    setNewEmailQuota(500);
    setShowNewPassword(true);
    setCreateEmailModalOpen(true);
  };

  const handleCreateCompanyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPrefix || !newEmailPassword.trim()) {
      notify.warning('Username email dan kata sandi wajib diisi.');
      return;
    }
    if (cleanPrefix.length < 2) {
      notify.warning('Username email minimal 2 karakter.');
      return;
    }
    if (isDuplicate) {
      notify.error(`Email ${cleanPrefix}@1slabs.my.id sudah terdaftar di cPanel!`);
      return;
    }
    if (newEmailPassword.length < 8) {
      notify.warning('Kata sandi email minimal harus 8 karakter.');
      return;
    }

    setSubmittingCreateEmail(true);
    try {
      const res = await api.companyEmails.create({
        username: cleanPrefix,
        password: newEmailPassword.trim(),
        quota: newEmailQuota
      });
      if (res.success) {
        notify.success(res.message, 'Email Company Dibuat');
        setCreateEmailModalOpen(false);
        fetchCompanyEmails();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal membuat akun email company.');
    } finally {
      setSubmittingCreateEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordTarget || !updatedPassword.trim()) return;
    if (updatedPassword.length < 8) {
      notify.warning('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    setSubmittingChangePassword(true);
    try {
      const res = await api.companyEmails.changePassword(
        changePasswordTarget.user,
        updatedPassword.trim()
      );
      if (res.success) {
        notify.success(res.message, 'Kata Sandi Diperbarui');
        setChangePasswordTarget(null);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui kata sandi email.');
    } finally {
      setSubmittingChangePassword(false);
    }
  };

  const handleChangeQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeQuotaTarget) return;

    setSubmittingChangeQuota(true);
    try {
      const res = await api.companyEmails.changeQuota(
        changeQuotaTarget.user,
        updatedQuota
      );
      if (res.success) {
        notify.success(res.message, 'Kuota Diperbarui');
        setChangeQuotaTarget(null);
        fetchCompanyEmails();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengubah kuota email.');
    } finally {
      setSubmittingChangeQuota(false);
    }
  };

  const handleDeleteCompanyEmail = async () => {
    if (!deleteEmailTarget) return;
    try {
      const res = await api.companyEmails.delete(deleteEmailTarget.user);
      if (res.success) {
        notify.success(res.message, 'Email Dihapus');
        setDeleteEmailTarget(null);
        fetchCompanyEmails();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus akun email.');
    }
  };

  // Filtered Company Emails
  const filteredCompanyEmails = companyEmails.filter((acc) => {
    if (!companyEmailSearch) return true;
    const q = companyEmailSearch.toLowerCase();
    return (
      acc.email.toLowerCase().includes(q) ||
      acc.user.toLowerCase().includes(q)
    );
  });

  // Filtered SMTP Logs
  const filteredLogs = logs.filter((log) => {
    if (!searchLogs) return true;
    const q = searchLogs.toLowerCase();
    const recipient = log.recipient || (log as any).recipient_email || '';
    const subject = log.subject || '';
    const templateName = log.template_name || log.email_type || '';
    return (
      recipient.toLowerCase().includes(q) ||
      subject.toLowerCase().includes(q) ||
      templateName.toLowerCase().includes(q)
    );
  });

  const totalEmails = logs.length;
  const sentEmails = logs.filter((l) => l.status === 'sent').length;
  const failedEmails = logs.filter((l) => l.status === 'failed').length;
  const successRate = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                Pusat Pengelolaan Email & Server cPanel
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Kelola akun email resmi <strong>@1slabs.my.id</strong> langsung tersinkronisasi dengan cPanel Webmail, serta audit log pengiriman SMTP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'company-emails' ? (
            <>
              <a
                href={webmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Buka Webmail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Email Company Baru</span>
              </button>
            </>
          ) : (
            onNavigate && (
              <button
                onClick={() => onNavigate('email-templates')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-950 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Editor Template Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          <button
            onClick={activeTab === 'company-emails' ? fetchCompanyEmails : fetchLogs}
            disabled={loadingCompanyEmails || loadingLogs}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                (activeTab === 'company-emails' ? loadingCompanyEmails : loadingLogs)
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
        <button
          type="button"
          onClick={() => setActiveTab('company-emails')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'company-emails'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Akun Email Company (@1slabs.my.id)</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {companyEmails.length} Akun
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smtp-logs')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'smtp-logs'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Log Pengiriman & Audit SMTP</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AKUN EMAIL COMPANY (@1slabs.my.id via cPanel)      */}
      {/* ========================================================= */}
      {activeTab === 'company-emails' && (
        <div className="space-y-6">
          {/* Quick Info Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 dark:text-indigo-200">
            <div className="flex items-start gap-2.5">
              <Server className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">cPanel Email Engine Active:</span> Akun email yang Anda buat di sini langsung didaftarkan ke server cPanel host <code>103.119.237.132</code> pada domain <strong>@1slabs.my.id</strong> dengan proteksi anti-duplikasi otomatis.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={webmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <span>Login Webmail (Port 2096)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={companyEmailSearch}
                onChange={(e) => setCompanyEmailSearch(e.target.value)}
                placeholder="Cari akun email company (contoh: info, dzikri, sales)..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-zinc-500">
              Menampilkan {filteredCompanyEmails.length} dari {companyEmails.length} akun
            </div>
          </div>

          {/* Company Emails Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/70 dark:bg-zinc-800/50 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-5">Alamat Email Resmi</th>
                    <th className="py-3.5 px-4">Penyimpanan / Disk Used</th>
                    <th className="py-3.5 px-4">Status Akun</th>
                    <th className="py-3.5 px-4">Domain cPanel</th>
                    <th className="py-3.5 px-4">Terakhir Diubah</th>
                    <th className="py-3.5 px-5 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {loadingCompanyEmails ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        <span>Memuat akun email company dari cPanel...</span>
                      </td>
                    </tr>
                  ) : filteredCompanyEmails.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        Tidak ada akun email company yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanyEmails.map((acc) => {
                      const isProtected = ['info', 'admin', 'dzikri'].includes(acc.user.toLowerCase());
                      return (
                        <tr
                          key={acc.email}
                          className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-mono text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              <span>{acc.email}</span>
                              {isProtected && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-xs">
                              <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                                <span>{acc.humandiskused}</span>
                                <span>{acc.humandiskquota}</span>
                              </div>
                              <div className="w-36 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(acc.diskusedpercent || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                            {acc.domain}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                            {acc.mtime ? new Date(acc.mtime).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={webmailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                                title="Buka di Webmail"
                              >
                                <span>Webmail</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <button
                                onClick={() => {
                                  setChangePasswordTarget(acc);
                                  setUpdatedPassword(generateRandomPassword());
                                  setShowUpdatedPassword(true);
                                }}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                                title="Ganti Kata Sandi"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setChangeQuotaTarget(acc);
                                  const isUnlimited = acc.diskquota === 'unlimited' || acc.diskquota === 0 || acc.diskquota === '0';
                                  const curQuota = parseInt(String(acc.diskquota), 10);
                                  setUpdatedQuota(isUnlimited ? 0 : (isNaN(curQuota) || curQuota <= 0 ? 500 : curQuota));
                                }}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                                title="Ubah Kuota Penyimpanan"
                              >
                                <HardDrive className="w-3.5 h-3.5" />
                              </button>

                              {!isProtected && (
                                <button
                                  onClick={() => setDeleteEmailTarget(acc)}
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  title="Hapus Akun Email"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Client Manual Setup Reference */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Panduan Konfigurasi Email Client (Outlook / Apple Mail / Android)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                <div className="font-bold text-zinc-900 dark:text-white mb-1">Incoming Server (IMAP SSL):</div>
                <div className="text-zinc-600 dark:text-zinc-300">Server: <strong className="text-indigo-600">mail.1slabs.my.id</strong></div>
                <div className="text-zinc-600 dark:text-zinc-300">Port: <strong>993</strong> (SSL/TLS)</div>
                <div className="text-zinc-600 dark:text-zinc-300">Username: <em>[email_anda]@1slabs.my.id</em></div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                <div className="font-bold text-zinc-900 dark:text-white mb-1">Outgoing Server (SMTP SSL):</div>
                <div className="text-zinc-600 dark:text-zinc-300">Server: <strong className="text-indigo-600">mail.1slabs.my.id</strong></div>
                <div className="text-zinc-600 dark:text-zinc-300">Port: <strong>465</strong> (SSL/TLS)</div>
                <div className="text-zinc-600 dark:text-zinc-300">Autentikasi: <em>Sama dengan incoming</em></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LOG PENGIRIMAN & AUDIT SMTP                        */}
      {/* ========================================================= */}
      {activeTab === 'smtp-logs' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">Total Email Keluar</div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2">{totalEmails}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Via info@1slabs.my.id</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
              <div className="text-xs font-mono uppercase text-emerald-600 font-semibold">Terkirim Sukses</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{sentEmails}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">SMTP 250 Accepted</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 shadow-xs">
              <div className="text-xs font-mono uppercase text-red-600 font-semibold">Gagal Dikirim</div>
              <div className="text-2xl font-bold font-mono text-red-600 mt-2">{failedEmails}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Bounce / Handshake error</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">Tingkat Keberhasilan</div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-2">{successRate}%</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Delivery reliability</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchLogs}
                onChange={(e) => setSearchLogs(e.target.value)}
                placeholder="Cari email penerima, subjek, atau tipe template..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'sent', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Email Logs Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/70 dark:bg-zinc-800/50 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-5">Penerima</th>
                    <th className="py-3.5 px-4">Subjek Email</th>
                    <th className="py-3.5 px-4">Kategori Template</th>
                    <th className="py-3.5 px-4">Status Pengiriman</th>
                    <th className="py-3.5 px-4">Waktu Dikirim</th>
                    <th className="py-3.5 px-5 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {loadingLogs && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Mengambil log pengiriman email...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        Tidak ditemukan log email yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const recipient = log.recipient || (log as any).recipient_email;
                      const templateName = log.template_name || log.email_type || 'System';
                      const timestamp = log.sent_at || log.created_at;

                      return (
                        <tr key={log.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-xs font-bold text-zinc-900 dark:text-white">
                            {recipient}
                          </td>
                          <td className="py-3.5 px-4 max-w-sm truncate text-zinc-900 dark:text-zinc-200 font-medium">
                            {log.subject}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                              {templateName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                            {timestamp
                              ? new Date(timestamp).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-colors text-xs font-semibold cursor-pointer"
                            >
                              Inspeksi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* MODAL: CREATE COMPANY EMAIL */}
      {createEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Buat Akun Email Company Baru
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Akun akan langsung dibuat di cPanel domain <strong>@1slabs.my.id</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateEmailModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCompanyEmail} className="space-y-4">
              {/* Email Prefix with @1slabs.my.id suffix */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alamat Email Baru *
                </label>
                <div className="flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <input
                    type="text"
                    required
                    value={newEmailPrefix}
                    onChange={(e) => setNewEmailPrefix(e.target.value.toLowerCase().trim())}
                    placeholder="sales / support / karir / nama"
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none"
                  />
                  <span className="px-3 py-2 text-xs font-mono font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 shrink-0">
                    @1slabs.my.id
                  </span>
                </div>
                {/* Duplicate Warning */}
                {cleanPrefix && (
                  <div className="mt-1.5 text-[11px] font-medium">
                    {isDuplicate ? (
                      <span className="text-rose-600 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Email <strong>{cleanPrefix}@1slabs.my.id</strong> sudah terdaftar di cPanel!
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Alamat email tersedia: <strong>{cleanPrefix}@1slabs.my.id</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Sandi Email (Min. 8 Karakter) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setNewEmailPassword(pwd);
                      setShowNewPassword(true);
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Sandi Kuat</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newEmailPassword}
                    onChange={(e) => setNewEmailPassword(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quota */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Batas Kuota Kotak Surat (Storage Quota)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '250 MB', val: 250 },
                    { label: '500 MB', val: 500 },
                    { label: '1024 MB', val: 1024 },
                    { label: 'Unlimited', val: 0 }
                  ].map((q) => (
                    <button
                      key={q.val}
                      type="button"
                      onClick={() => setNewEmailQuota(q.val)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                        newEmailQuota === q.val
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreateEmail || isDuplicate}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {submittingCreateEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat di cPanel...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Daftarkan Akun Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {changePasswordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Ganti Kata Sandi Email
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {changePasswordTarget.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Sandi Baru (Min. 8 Karakter) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setUpdatedPassword(pwd);
                      setShowUpdatedPassword(true);
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Generate Sandi
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showUpdatedPassword ? 'text' : 'password'}
                    required
                    value={updatedPassword}
                    onChange={(e) => setUpdatedPassword(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUpdatedPassword(!showUpdatedPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                  >
                    {showUpdatedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChangePasswordTarget(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingChangePassword}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                >
                  {submittingChangePassword ? 'Menyimpan ke cPanel...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE QUOTA */}
      {changeQuotaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Ubah Batas Kuota Penyimpanan
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {changeQuotaTarget.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangeQuota} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '250 MB', val: 250 },
                  { label: '500 MB', val: 500 },
                  { label: '1024 MB', val: 1024 },
                  { label: 'Unlimited', val: 0 }
                ].map((q) => (
                  <button
                    key={q.val}
                    type="button"
                    onClick={() => setUpdatedQuota(q.val)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                      updatedQuota === q.val
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChangeQuotaTarget(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingChangeQuota}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  {submittingChangeQuota ? 'Menyimpan...' : 'Simpan Kuota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteEmailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Hapus Akun Email?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus akun email <strong>{deleteEmailTarget.email}</strong> dari cPanel? Seluruh isi kotak masuk akun ini akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteEmailTarget(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteCompanyEmail}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG INSPECT */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Inspeksi Pengiriman Email</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Penerima</span>
                  <span className="text-zinc-900 dark:text-white font-bold">{selectedLog.recipient || (selectedLog as any).recipient_email}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Subjek</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{selectedLog.subject}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Kategori Template</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{selectedLog.template_name || selectedLog.email_type}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Status Pengiriman</span>
                  <span className={selectedLog.status === 'sent' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-red-700 dark:text-red-400 font-bold'}>
                    {selectedLog.status.toUpperCase()}
                  </span>
                </div>
                {selectedLog.last_error && (
                  <div>
                    <span className="text-red-600 text-[10px] uppercase font-bold block">Pesan Error SMTP</span>
                    <span className="text-red-700 dark:text-red-400 font-bold break-all">{selectedLog.last_error}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Waktu Dispatch</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{new Date(selectedLog.sent_at || selectedLog.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-zinc-100 dark:border-zinc-800 mt-5">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 cursor-pointer"
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

export default EmailManagementView;
