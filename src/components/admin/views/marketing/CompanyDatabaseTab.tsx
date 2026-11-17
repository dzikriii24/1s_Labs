import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Edit2,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Store,
  Mail,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CheckSquare,
  Square,
  Sparkles,
  GitMerge,
  ArrowUpDown
} from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';
import { notify } from '../../../../lib/notify';
import Swal from 'sweetalert2';
import { CreateBusinessModal } from './CreateBusinessModal';
import { BulkImportModal } from './BulkImportModal';
import { ProspectDetailModal } from './ProspectDetailModal';

export const CompanyDatabaseTab: React.FC<{
  onOpenDetailModal?: (company: MarketingCompany) => void;
}> = () => {
  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState('all');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<MarketingCompany | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit,
        search: search.trim() || undefined,
        province: selectedProvince !== 'all' ? selectedProvince : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        email_status: selectedEmailStatus !== 'all' ? selectedEmailStatus : undefined,
        status: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
        sortBy,
        sortDir,
        is_deleted: '0'
      };

      const res = await api.marketing.getCompanies(params);
      if (res && res.success) {
        setCompanies(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat database perusahaan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, limit, selectedProvince, selectedCategory, selectedEmailStatus, selectedLeadStatus, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === companies.length && companies.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(companies.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) {
      notify.warning('Pilih minimal satu perusahaan untuk diperbarui.');
      return;
    }

    try {
      await api.marketing.bulkUpdateCompanyStatus(selectedIds, status);
      notify.success(`Status ${selectedIds.length} perusahaan berhasil diubah menjadi "${status}".`);
      setSelectedIds([]);
      fetchCompanies();
    } catch (err: any) {
      notify.error(err.message, 'Gagal Memperbarui Status');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      notify.warning('Pilih minimal satu perusahaan untuk dihapus.');
      return;
    }

    const confirmed = await notify.confirm({
      title: 'Hapus Perusahaan Terpilih?',
      text: `Pindahkan ${selectedIds.length} perusahaan terpilih ke tempat sampah?`,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await api.marketing.bulkDeleteCompanies(selectedIds, false);
      notify.success(`${selectedIds.length} perusahaan dipindahkan ke tempat sampah.`);
      setSelectedIds([]);
      fetchCompanies();
    } catch (err: any) {
      notify.error(err.message, 'Gagal Menghapus Perusahaan');
    }
  };

  // Single Delete
  const handleDeleteSingle = async (company: MarketingCompany) => {
    const confirmed = await notify.confirm({
      title: 'Hapus Perusahaan?',
      text: `Pindahkan "${company.name}" ke tempat sampah?`,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await api.marketing.deleteCompany(company.id, false);
      notify.toast(`"${company.name}" berhasil dihapus`, 'success');
      fetchCompanies();
    } catch (err: any) {
      notify.error(err.message, 'Gagal Menghapus');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (companies.length === 0) {
      notify.warning('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'Nama Bisnis',
      'Kategori',
      'Sektor / Industri',
      'Website',
      'Email',
      'Status Email',
      'Telepon',
      'Provinsi',
      'Kota',
      'Sumber Data',
      'Status Lead',
      'Tanggal Ditemukan'
    ];

    const rows = companies.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.category || ''}"`,
      `"${(c.industry || '').replace(/"/g, '""')}"`,
      `"${c.website_url || ''}"`,
      `"${c.email || ''}"`,
      `"${c.email_status || 'NO_EMAIL'}"`,
      `"${c.phone || ''}"`,
      `"${c.province || ''}"`,
      `"${c.city || ''}"`,
      `"${(c.primary_source_name || '').replace(/"/g, '""')}"`,
      `"${c.status || ''}"`,
      `"${c.first_discovered_at ? new Date(c.first_discovered_at).toISOString().slice(0, 10) : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `1sLabs_Company_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.toast('Database berhasil diekspor ke CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Centralized Enterprise & UMKM Database
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1">
            Company Database — Seluruh Prospek Bisnis Indonesia
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
            Penyimpanan terpusat seluruh perusahaan dan UMKM di database 1sLabs. Dilengkapi status teknis email, bukti publikasi web resmi, deteksi duplikasi, dan integrasi campaign.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Bisnis</span>
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchCompanies}
            title="Refresh Table"
            className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama bisnis, kota, sektor, atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Email Filter */}
            <select
              value={selectedEmailStatus}
              onChange={e => {
                setSelectedEmailStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status Email</option>
              <option value="VERIFIED">VERIFIED (MX Aktif)</option>
              <option value="UNVERIFIED">UNVERIFIED (Pending)</option>
              <option value="INVALID">INVALID</option>
              <option value="NO_EMAIL">NO_EMAIL (Tanpa Email)</option>
            </select>

            {/* Status Lead Filter */}
            <select
              value={selectedLeadStatus}
              onChange={e => {
                setSelectedLeadStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status Prospek</option>
              <option value="New Discovery">New Discovery</option>
              <option value="Verified">Verified</option>
              <option value="Qualified">Qualified</option>
              <option value="Outreach Eligible">Outreach Eligible</option>
              <option value="Contacted">Contacted</option>
              <option value="Responded">Responded</option>
              <option value="Interested">Interested</option>
              <option value="Do Not Contact">Do Not Contact</option>
            </select>

            {/* Kategori Filter */}
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kategori</option>
              <option value="Company">Perusahaan (PT/CV)</option>
              <option value="UMKM">UMKM & Bisnis Lokal</option>
              <option value="Retail">Retail & Toko</option>
              <option value="Restaurant">Restoran & Cafe</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Manufacturing">Manufaktur</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Bulk Actions Bar if items selected */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 font-semibold text-blue-900">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>{selectedIds.length} perusahaan dipilih</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Qualified')}
                className="px-3 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tandai QUALIFIED
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Outreach Eligible')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tandai CONTACT_READY
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Do Not Contact')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Do Not Contact
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hapus Terpilih
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-blue-700 hover:underline px-2 text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Database Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 select-none">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === companies.length && companies.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Nama Bisnis</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Kategori & Sektor</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Website</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Email Bisnis</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Wilayah</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Sumber</th>
                <th className="py-3 px-3 font-semibold text-zinc-700 text-center">Status Email</th>
                <th className="py-3 px-3 font-semibold text-zinc-700 text-center">Status Lead</th>
                <th className="py-3 px-3 font-semibold text-zinc-700">Ditemukan</th>
                <th className="py-3 px-3 font-semibold text-zinc-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-900" />
                    <span>Memuat data perusahaan...</span>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-zinc-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="font-medium text-zinc-600">Tidak ada data perusahaan yang cocok.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau filter yang dipilih.
                    </p>
                  </td>
                </tr>
              ) : (
                companies.map(comp => {
                  const isChecked = selectedIds.includes(comp.id);
                  const emailStatus = comp.email_status || (comp.email ? 'UNVERIFIED' : 'NO_EMAIL');

                  return (
                    <tr
                      key={comp.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(comp.id)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Nama Bisnis */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                          <span>{comp.name}</span>
                          {comp.is_priority ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Prioritas" />
                          ) : null}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ID: #{comp.id} {comp.business_scale ? `&bull; ${comp.business_scale}` : ''}
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-800">{comp.category}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                          {comp.industry || 'Multi-sektor'}
                        </div>
                      </td>

                      {/* Website */}
                      <td className="py-3 px-3">
                        {comp.website_url ? (
                          <a
                            href={comp.website_url.startsWith('http') ? comp.website_url : `https://${comp.website_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 truncate max-w-[160px] font-mono text-[11px]"
                          >
                            <span>{comp.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-zinc-300 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Email Bisnis */}
                      <td className="py-3 px-3">
                        {comp.email ? (
                          <div className="font-mono text-zinc-900 font-medium truncate max-w-[170px]">
                            {comp.email}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px] italic">Belum ada</span>
                        )}
                      </td>

                      {/* Wilayah */}
                      <td className="py-3 px-3">
                        <div className="text-zinc-800 font-medium truncate max-w-[120px]">
                          {comp.city || comp.province || 'Indonesia'}
                        </div>
                        {comp.city && comp.province && (
                          <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                            {comp.province}
                          </div>
                        )}
                      </td>

                      {/* Sumber */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-zinc-600 truncate max-w-[110px] block">
                          {comp.primary_source_name || 'Direct'}
                        </span>
                      </td>

                      {/* Status Email Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            emailStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emailStatus === 'UNVERIFIED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : emailStatus === 'INVALID'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          }`}
                        >
                          {emailStatus}
                        </span>
                      </td>

                      {/* Status Lead */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {comp.status || 'NEW'}
                        </span>
                      </td>

                      {/* Tanggal Ditemukan */}
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {comp.first_discovered_at ? comp.first_discovered_at.slice(0, 10) : '-'}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCompanyDetail(comp)}
                            title="Detail Prospek"
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(comp)}
                            title="Hapus"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Footer */}
        <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            Menampilkan <span className="font-bold text-zinc-900">{companies.length}</span> dari{' '}
            <span className="font-bold text-zinc-900">{total}</span> total perusahaan tersimpan
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-zinc-800 font-semibold px-2">
              Halaman {page} dari {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCompanyDetail && (
        <ProspectDetailModal
          company={selectedCompanyDetail}
          onClose={() => setSelectedCompanyDetail(null)}
          onUpdate={() => {
            fetchCompanies();
          }}
        />
      )}

      {/* Create Business Modal */}
      {isCreateOpen && (
        <CreateBusinessModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            fetchCompanies();
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
        <BulkImportModal
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => {
            setIsImportOpen(false);
            fetchCompanies();
          }}
        />
      )}
    </div>
  );
};

