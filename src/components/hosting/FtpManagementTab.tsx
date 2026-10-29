import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Terminal,
  HelpCircle,
  X
} from 'lucide-react';
import { api, FtpAccount } from '../../services/api';

interface FtpManagementTabProps {
  serviceCode: string;
  serverIp: string;
  domain: string | null;
}

export const FtpManagementTab: React.FC<FtpManagementTabProps> = ({
  serviceCode,
  serverIp,
  domain
}) => {
  const [accounts, setAccounts] = useState<FtpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New account modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Password reset modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<FtpAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadFtpAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.ftp.list(serviceCode);
      if (res.success) {
        setAccounts(res.accounts);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar akun FTP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFtpAccounts();
  }, [serviceCode]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;
    try {
      setIsSubmitting(true);
      const res = await api.ftp.create(serviceCode, {
        username: usernameInput.trim(),
        password: passwordInput
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setCreateModalOpen(false);
        setUsernameInput('');
        setPasswordInput('');
        loadFtpAccounts();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membuat akun FTP.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !newPasswordInput) return;
    try {
      setIsSubmitting(true);
      const res = await api.ftp.changePassword(serviceCode, resetTarget.id, newPasswordInput);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setResetModalOpen(false);
        setResetTarget(null);
        setNewPasswordInput('');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengubah password FTP.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: FtpAccount) => {
    if (!window.confirm(`Hapus akun FTP '${account.username}'?`)) return;
    try {
      setIsSubmitting(true);
      const res = await api.ftp.delete(serviceCode, account.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        loadFtpAccounts();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menghapus akun FTP.' });
    } finally {
      setIsSubmitting(false);
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

      {/* FTP Connection Parameters Box (Hostinger Style) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span>Detail Koneksi FTP / FTPS Server</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Gunakan parameter ini di aplikasi client seperti <strong>FileZilla</strong>, <strong>WinSCP</strong>, atau <strong>Cyberduck</strong>.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Akun FTP Baru</span>
          </button>
        </div>

        {/* 4 Connection Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block mb-1">Host / Server IP:</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-gray-900 dark:text-white">{serverIp || '194.233.65.45'}</span>
              <button
                onClick={() => copyToClipboard(serverIp || '194.233.65.45', 'host')}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {copiedKey === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block mb-1">Port Standar:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">21 (FTPS)</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block mb-1">Protokol:</span>
            <span className="font-semibold text-gray-900 dark:text-white">FTP (File Transfer Protocol)</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 block mb-1">Enkripsi (Keamanan):</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Require explicit FTP over TLS</span>
            </span>
          </div>
        </div>
      </div>

      {/* FTP Accounts List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Daftar Akun FTP Aktif
          </h4>
          <span className="text-xs text-gray-500 font-mono">
            {accounts.length} Akun Terdaftar
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p>Memuat akun FTP...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-rose-500 space-y-2">
            <AlertCircle className="w-5 h-5 mx-auto" />
            <p>{error}</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 space-y-3">
            <Server className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700" />
            <p>Belum ada akun FTP tambahan yang dibuat.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Akun FTP Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-5">Username FTP</th>
                  <th className="py-3 px-5">Direktori Akses (Root)</th>
                  <th className="py-3 px-5">Tanggal Dibuat</th>
                  <th className="py-3 px-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 dark:text-white">{acc.username}</span>
                        <button
                          onClick={() => copyToClipboard(acc.username, `user-${acc.id}`)}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          {copiedKey === `user-${acc.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-500 text-xs font-sans truncate max-w-xs">
                      {acc.homedir}
                    </td>
                    <td className="py-4 px-5 text-gray-500 font-sans">
                      {acc.created_at ? acc.created_at.slice(0, 10) : '-'}
                    </td>
                    <td className="py-4 px-5 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setResetTarget(acc);
                            setResetModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        >
                          <Key className="w-3 h-3 text-amber-500" />
                          <span>Ganti Password</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Hapus Akun"
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

      {/* Step by step FileZilla Guide */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span>Panduan Cepat Menghubungkan FileZilla</span>
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <li>Unduh dan buka aplikasi <strong>FileZilla Client</strong> di komputer Anda.</li>
          <li>Pada menu atas, isi kolom <strong>Host</strong> dengan: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-gray-900 dark:text-white">{serverIp || '194.233.65.45'}</code></li>
          <li>Isi <strong>Username</strong> dengan akun FTP lengkap di atas (misal: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-gray-900 dark:text-white">user@{domain || '1slabs.my.id'}</code>).</li>
          <li>Masukkan <strong>Password</strong> yang Anda buat, dan set <strong>Port</strong> ke: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-gray-900 dark:text-white">21</code>.</li>
          <li>Klik <strong>Quickconnect</strong>. Jika muncul dialog sertifikat SSL/TLS, centang <em>"Always trust certificate"</em> dan klik <strong>OK</strong>.</li>
        </ol>
      </div>

      {/* MODAL: Create FTP Account */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAccount}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Buat Akun FTP Baru</h3>
            <p className="text-xs text-gray-500">
              Akun ini akan otomatis terkunci ke folder website layanan: <code className="font-mono text-gray-900 dark:text-white">public_html</code>
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Username:</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  placeholder="developer"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-l-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
                />
                <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700/60 text-gray-500 text-xs rounded-r-xl border border-l-0 border-gray-200 dark:border-gray-700 font-mono">
                  @{domain || '1slabs.my.id'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Password FTP:</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimal 8 karakter kombinasi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
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
                <span>Buat Akun FTP</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Change Password */}
      {resetModalOpen && resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Ganti Password FTP</h3>
            <p className="text-xs text-gray-500">
              Username: <strong className="font-mono text-gray-900 dark:text-white">{resetTarget.username}</strong>
            </p>

            <div>
              <label className="text-xs font-semibold block mb-1 text-gray-700 dark:text-gray-300">Password Baru:</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
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
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
