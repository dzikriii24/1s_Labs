import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  RefreshCw,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  User,
  Shield,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { api, AdminUserItem, AdminUserStats } from '../../../services/api';
import notify from '../../../lib/notify';
import { useAuth } from '../../../contexts/AuthContext';

export const AdminManagementView: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({
    total: 0,
    super_admin_count: 0,
    marketing_count: 0,
    pengguna_count: 0,
    active_count: 0,
    suspended_count: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserItem | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<AdminUserItem | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUserItem | null>(null);

  // Create Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'super_admin' | 'marketing' | 'pengguna'>('marketing');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  // Edit Role State
  const [selectedNewRole, setSelectedNewRole] = useState<'super_admin' | 'marketing' | 'pengguna'>('marketing');
  const [submittingRole, setSubmittingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.adminUsers.list({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined
      });
      if (res.success) {
        setUsers(res.users);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
      notify.error(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword(generateRandomPassword());
    setFormRole('marketing');
    setShowPassword(true);
    setCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      notify.warning('Nama, email, dan kata sandi wajib diisi.');
      return;
    }
    if (formPassword.length < 6) {
      notify.warning('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await api.adminUsers.create({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        phone: formPhone.trim() || undefined,
        role: formRole
      });
      if (res.success) {
        notify.success(res.message, 'Pengguna Didaftarkan');
        setCreateModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mendaftarkan pengguna baru.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleStatusToggle = async (targetUser: AdminUserItem) => {
    if (targetUser.id === currentUser?.id) {
      notify.warning('Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.');
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.adminUsers.updateStatus(targetUser.id, nextStatus);
      if (res.success) {
        notify.success(res.message);
        fetchUsers();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status akun.');
    }
  };

  const handleOpenResetPassword = (userItem: AdminUserItem) => {
    setResetPasswordUser(userItem);
    setNewPassword(generateRandomPassword());
    setShowNewPassword(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword.trim() || newPassword.length < 6) {
      notify.warning('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setSubmittingReset(true);
    try {
      const res = await api.adminUsers.resetPassword(resetPasswordUser.id, newPassword.trim());
      if (res.success) {
        notify.success(res.message, 'Kata Sandi Direset');
        setResetPasswordUser(null);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleOpenEditRole = (userItem: AdminUserItem) => {
    setEditRoleUser(userItem);
    const normalizedRole =
      userItem.role === 'admin' || userItem.role === 'super_admin'
        ? 'super_admin'
        : userItem.role === 'marketing'
        ? 'marketing'
        : 'pengguna';
    setSelectedNewRole(normalizedRole);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleUser) return;

    setSubmittingRole(true);
    try {
      const res = await api.adminUsers.updateRole(editRoleUser.id, selectedNewRole);
      if (res.success) {
        notify.success(res.message, 'Role Diperbarui');
        setEditRoleUser(null);
        fetchUsers();
        if (currentUser && currentUser.id === editRoleUser.id) {
          refreshUser();
        }
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengubah role pengguna.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      const res = await api.adminUsers.delete(deleteUserTarget.id);
      if (res.success) {
        notify.success(res.message, 'Pengguna Dihapus');
        setDeleteUserTarget(null);
        fetchUsers();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus pengguna.');
    }
  };

  const renderRoleBadge = (role: string) => {
    if (role === 'super_admin' || role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
          <Shield className="w-3 h-3 text-purple-600" />
          Super Admin
        </span>
      );
    }
    if (role === 'marketing') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
          <Target className="w-3 h-3 text-blue-600" />
          Marketing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
        <User className="w-3 h-3 text-zinc-500" />
        Pengguna
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Manajemen Pengguna & Hak Akses (RBAC)
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Daftarkan pengguna sistem dan tetapkan role hak akses: <strong>Super Admin</strong>, <strong>Marketing</strong>, atau <strong>Pengguna</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftarkan Pengguna Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {stats.active_count} akun aktif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 text-xs font-semibold">
            <span>Super Admin</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 dark:text-purple-400">
            {stats.super_admin_count}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Akses tak terbatas (All Modules)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-semibold">
            <span>Tim Marketing</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.marketing_count}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Growth, Intel & Communication
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-600 text-xs font-semibold">
            <span>Pengguna / Klien</span>
            <User className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.pengguna_count}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Hanya Customer Portal (/portal)
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau no HP..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="super_admin">👑 Super Admin</option>
              <option value="marketing">🎯 Marketing</option>
              <option value="pengguna">👤 Pengguna</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Nama Pengguna</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role Hak Akses</th>
                <th className="py-3 px-4 font-semibold">Status Akun</th>
                <th className="py-3 px-4 font-semibold">No HP / WhatsApp</th>
                <th className="py-3 px-4 font-semibold">Terdaftar</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Memuat daftar pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        {renderRoleBadge(u.role)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                            isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                          } ${
                            u.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                          title={isSelf ? 'Akun Anda sendiri' : 'Klik untuk mengubah status aktif / suspend'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.status === 'active' ? 'Aktif' : 'Suspended'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500">
                        {u.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRole(u)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            title="Ubah Role Akses"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                            title="Reset Kata Sandi"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => setDeleteUserTarget(u)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Hapus Pengguna"
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

      {/* RBAC Matrix Information */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>Matriks Hak Akses Peran (Role-Based Access Control)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Super Admin */}
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-200 text-sm">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Super Administrator</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Hak akses tertinggi tanpa batasan:
            </p>
            <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300 list-disc list-inside">
              <li>Kelola akun & hak akses tim (RBAC)</li>
              <li>Akses server terminal, Node.js, & cPanel UAPI</li>
              <li>Kelola transaksi, invoice & brankas bukti bayar</li>
              <li>Kelola akun email company (@1slabs.my.id)</li>
              <li>Semua modul Growth, Intel & Comms</li>
            </ul>
          </div>

          {/* Card 2: Marketing */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Tim Marketing</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Fokus pada pertumbuhan & komunikasi klien:
            </p>
            <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300 list-disc list-inside">
              <li><strong>GROWTH & INTELLIGENCE:</strong> Radar UMKM, Global Leads, AI Research, Email Campaigns & Inbox</li>
              <li><strong>COMMUNICATION:</strong> Feedback & Jadwal Meeting, Formulir Inquiry, Email Company & Templates</li>
              <li className="text-rose-600 dark:text-rose-400"><em>Terproteksi:</em> Tanpa akses server config, hosting backend & keuangan</li>
            </ul>
          </div>

          {/* Card 3: Pengguna / Pelanggan */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-200 text-sm">
              <User className="w-4 h-4 text-zinc-600" />
              <span>Pengguna / Klien</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Akun pelanggan standar:
            </p>
            <ul className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300 list-disc list-inside">
              <li>Hanya dapat mengakses <strong>Customer Portal (/portal)</strong></li>
              <li>Melihat status layanan hosting aktif milik sendiri</li>
              <li>Upload bukti pembayaran & klaim Free Plan</li>
              <li className="text-rose-600 dark:text-rose-400"><em>Ditolak:</em> Dilarang mengakses Admin Dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL 1: CREATE USER */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Daftarkan Pengguna Baru
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Buat akun login staf dan tentukan peran wewenang hak akses.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="cth. Jessica Putri"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Alamat Email (Untuk Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cth. jessica@1slabs.my.id"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="cth. 081234567890"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Sandi Login *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setFormPassword(pwd);
                      setShowPassword(true);
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Sandi Kuat</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Pilih Role Hak Akses *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setFormRole('marketing')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formRole === 'marketing'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-300 mb-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>Marketing</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Akses tab Growth & Communication.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormRole('super_admin')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formRole === 'super_admin'
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300 mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Akses penuh seluruh modul sistem.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormRole('pengguna')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formRole === 'pengguna'
                        ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-800 dark:text-zinc-200 mb-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Pengguna</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      Akun klien (Customer Portal saja).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {submittingCreate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Simpan & Aktifkan Pengguna</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Reset Kata Sandi
                </h3>
                <p className="text-xs text-zinc-500">
                  Untuk pengguna: <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Sandi Baru *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setNewPassword(pwd);
                      setShowNewPassword(true);
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Generate Sandi
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submittingReset ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT ROLE */}
      {editRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Ubah Hak Akses Role
                </h3>
                <p className="text-xs text-zinc-500">
                  Untuk pengguna: <strong>{editRoleUser.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="space-y-2">
                {[
                  {
                    id: 'super_admin',
                    label: 'Super Admin',
                    icon: Shield,
                    desc: 'Akses penuh ke seluruh modul sistem & infrastruktur server.',
                    color: 'text-purple-600'
                  },
                  {
                    id: 'marketing',
                    label: 'Marketing Specialist',
                    icon: Target,
                    desc: 'Akses ke modul GROWTH & INTELLIGENCE dan COMMUNICATION.',
                    color: 'text-blue-600'
                  },
                  {
                    id: 'pengguna',
                    label: 'Pengguna / Pelanggan',
                    icon: User,
                    desc: 'Hanya mengakses Customer Portal (/portal).',
                    color: 'text-zinc-600'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = selectedNewRole === item.id;
                  return (
                    <label
                      key={item.id}
                      onClick={() => setSelectedNewRole(item.id as any)}
                      className={`block p-3 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-white">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span>{item.label}</span>
                        </div>
                        <input
                          type="radio"
                          name="roleRadio"
                          checked={isChecked}
                          onChange={() => setSelectedNewRole(item.id as any)}
                          className="text-indigo-600"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 pl-6">
                        {item.desc}
                      </p>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditRoleUser(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submittingRole ? 'Menyimpan...' : 'Simpan Perubahan Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Hapus Pengguna?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apakah Anda yakin ingin menghapus akun <strong>{deleteUserTarget.name}</strong> ({deleteUserTarget.email})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementView;
