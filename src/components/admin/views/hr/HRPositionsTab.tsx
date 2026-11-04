import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Building2,
  Clock,
  MapPin,
  RefreshCw,
  Archive,
  Power
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api, HRPosition } from '../../../../services/api';
import notify from '../../../../lib/notify';

interface HRPositionsTabProps {
  onSelectPositionFilter?: (positionId: number) => void;
}

export const HRPositionsTab: React.FC<HRPositionsTabProps> = ({
  onSelectPositionFilter
}) => {
  const [positions, setPositions] = useState<HRPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'closed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<HRPosition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Engineering',
    employment_type: 'full_time',
    location: 'Remote / Bandung',
    description: '',
    requirements: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const res = await api.hr.getPositions({ status: statusFilter === 'all' ? undefined : statusFilter });
      if (res.success) {
        setPositions(res.positions);
      }
    } catch (err: any) {
      console.warn('Failed to load positions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingPosition(null);
    setFormData({
      name: '',
      department: 'Engineering',
      employment_type: 'full_time',
      location: 'Remote / Bandung',
      description: '',
      requirements: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pos: HRPosition) => {
    setEditingPosition(pos);
    setFormData({
      name: pos.name,
      department: pos.department,
      employment_type: pos.employment_type,
      location: pos.location || 'Remote',
      description: pos.description || '',
      requirements: pos.requirements || '',
      status: pos.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify.error('Nama posisi wajib diisi.');
      return;
    }
    if (!formData.department.trim()) {
      notify.error('Departemen wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPosition) {
        await api.hr.updatePosition(editingPosition.id, formData as any);
        notify.success('Posisi rekrutmen berhasil diperbarui!');
      } else {
        await api.hr.createPosition(formData);
        notify.success('Posisi baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchPositions();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan data posisi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (pos: HRPosition) => {
    const newStatus = pos.status === 'active' ? 'inactive' : 'active';
    try {
      await api.hr.togglePositionStatus(pos.id, newStatus);
      notify.success(`Status posisi ${pos.name} diubah menjadi ${newStatus}.`);
      fetchPositions();
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengubah status posisi.');
    }
  };

  const handleDelete = async (pos: HRPosition) => {
    const confirm = await Swal.fire({
      title: 'Hapus Posisi Rekrutmen?',
      text: `Apakah Anda yakin ingin menghapus atau mengarsipkan posisi "${pos.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await api.hr.deletePosition(pos.id);
        notify.success(res.message || 'Posisi berhasil dihapus.');
        fetchPositions();
      } catch (err: any) {
        notify.error(err.message || 'Gagal menghapus posisi.');
      }
    }
  };

  const filteredPositions = positions.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  const getEmploymentBadge = (type: string) => {
    switch (type) {
      case 'full_time':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">Full-Time</span>;
      case 'freelance':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Freelance</span>;
      case 'contract':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Kontrak</span>;
      case 'internship':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Internship</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Master Data Posisi Rekrutmen
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daftar posisi aktif dan formasi lowongan kerja 1sLabs. Form kandidat akan otomatis mengambil data dari sini.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Posisi Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama posisi atau departemen..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'active' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'inactive' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Nonaktif
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                statusFilter === 'closed' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Ditutup
            </button>
          </div>

          <button
            onClick={fetchPositions}
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-xs"
            title="Muat ulang"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="px-5 py-3.5">Nama Posisi</th>
                <th className="px-4 py-3.5">Departemen</th>
                <th className="px-4 py-3.5">Tipe Pekerjaan</th>
                <th className="px-4 py-3.5">Lokasi</th>
                <th className="px-4 py-3.5 text-center">Total Kandidat</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat daftar posisi rekrutmen...
                  </td>
                </tr>
              ) : filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <Briefcase className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    Tidak ada posisi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredPositions.map(pos => (
                  <tr key={pos.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-zinc-900 text-sm">
                      {pos.name}
                      {pos.description && (
                        <p className="text-[11px] font-normal text-zinc-400 line-clamp-1 mt-0.5">
                          {pos.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-700 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        {pos.department}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {getEmploymentBadge(pos.employment_type)}
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {pos.location || 'Remote'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-zinc-100 text-zinc-900 text-xs">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {pos.candidates_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {pos.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : pos.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          <Power className="w-3 h-3" />
                          Nonaktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          <Archive className="w-3 h-3" />
                          Ditutup
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(pos)}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors"
                          title={pos.status === 'active' ? 'Nonaktifkan Posisi' : 'Aktifkan Posisi'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(pos)}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
                          title="Edit Posisi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pos)}
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition-colors"
                          title="Hapus / Arsipkan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    {editingPosition ? 'Edit Posisi Rekrutmen' : 'Tambah Posisi Rekrutmen Baru'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Master data formasi lowongan kerja</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Posisi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Digital Marketing Specialist"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Departemen <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Engineering">Engineering / IT</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Product Design">Product Design (UI/UX)</option>
                    <option value="IT & Operations">IT & Operations</option>
                    <option value="Finance & Admin">Finance & Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tipe Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={e => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="freelance">Freelance</option>
                    <option value="contract">Kontrak</option>
                    <option value="internship">Internship / Magang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Lokasi Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Remote / Bandung"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Status Posisi
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="active">Aktif (Menerima Pelamar)</option>
                    <option value="inactive">Nonaktif (Jeda)</option>
                    <option value="closed">Ditutup (Arsip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Deskripsi Peran (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ringkasan tanggung jawab dan cakupan peran..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold tracking-wide"
                >
                  {isSubmitting ? 'Menyimpan...' : editingPosition ? 'Simpan Perubahan' : 'Tambah Posisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

