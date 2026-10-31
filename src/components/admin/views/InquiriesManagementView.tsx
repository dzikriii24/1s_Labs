import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
  Building,
  Globe,
  Trash2,
  ExternalLink,
  Edit3,
  Check,
  X,
  Send,
  Loader2,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { api, InquiryItem } from '../../../services/api';
import notify from '../../../lib/notify';

export const InquiriesManagementView: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<string>('new');
  const [updating, setUpdating] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.inquiries.adminList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search.trim() || undefined
      });
      if (res.success && res.inquiries) {
        setInquiries(res.inquiries);
      }
    } catch (err: any) {
      console.error('Failed to load inquiries:', err);
      notify.error(err.message || 'Gagal memuat daftar inquiry pelanggan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter]);

  const handleOpenDetail = (inquiry: InquiryItem) => {
    setSelectedInquiry(inquiry);
    setEditNotes(inquiry.admin_notes || '');
    setEditStatus(inquiry.status);
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;
    setUpdating(true);
    try {
      const res = await api.inquiries.adminUpdate(selectedInquiry.id, {
        status: editStatus,
        admin_notes: editNotes.trim()
      });
      if (res.success) {
        notify.success('Status inquiry berhasil diperbarui.');
        setSelectedInquiry(null);
        await fetchInquiries();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status inquiry.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    const ok = await notify.confirm({
      title: 'Hapus Inquiry',
      text: `Hapus data inquiry #${id} secara permanen dari database?`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;

    try {
      const res = await api.inquiries.adminDelete(id);
      if (res.success) {
        notify.success('Inquiry berhasil dihapus.');
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        await fetchInquiries();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus inquiry.');
    }
  };

  const typeLabels: Record<string, string> = {
    consultation: 'Konsultasi IT Gratis',
    website_development: 'Jasa Pembuatan Website',
    website_maintenance: 'Annual Website Maintenance',
    custom_software: 'Custom Web App / Software',
    hosting: 'Cloud Hosting & Domain',
    other: 'Inquiry Umum'
  };

  const statusColors: Record<string, string> = {
    new: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  };

  const filtered = inquiries.filter((inq) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inq.name.toLowerCase().includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.phone && inq.phone.includes(q)) ||
      (inq.company && inq.company.toLowerCase().includes(q)) ||
      inq.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Manajemen Inquiry & Konsultasi Pelanggan
            </h1>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
              Kelola seluruh formulir masuk untuk Konsultasi IT, Jasa Pembuatan Website, dan Annual Website Maintenance secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-gray-700 hover:bg-zinc-100 dark:hover:bg-gray-700 text-zinc-500 dark:text-gray-400 transition-colors cursor-pointer"
            title="Refresh inquiry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, perusahaan, atau isi pesan..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="new">Baru (New)</option>
            <option value="contacted">Sudah Dihubungi</option>
            <option value="in_progress">Sedang Diproses</option>
            <option value="converted">Deal / Converted</option>
            <option value="closed">Ditutup</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Layanan</option>
            <option value="consultation">Konsultasi IT Gratis</option>
            <option value="website_development">Pembuatan Website</option>
            <option value="website_maintenance">Website Maintenance</option>
            <option value="custom_software">Custom Web App</option>
            <option value="hosting">Cloud Hosting</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table / Cards */}
      <div className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">Memuat data inquiry dari database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Belum ada inquiry yang cocok.</p>
            <p className="text-xs text-gray-400 mt-1">Seluruh formulir kontak dan konsultasi yang disubmit pengunjung akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4">Pengirim & Kontak</th>
                  <th className="py-3.5 px-4">Layanan Diminati</th>
                  <th className="py-3.5 px-4">Ringkasan Pesan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{item.email}</span>
                      </div>
                      {item.phone && (
                        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.company && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {item.company}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                        {typeLabels[item.inquiry_type] || item.inquiry_type}
                      </span>
                      {item.current_website_url && (
                        <a
                          href={item.current_website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{item.current_website_url}</span>
                        </a>
                      )}
                      {item.budget_range && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                          Budget: {item.budget_range}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-gray-600 dark:text-gray-300">
                        {item.message}
                      </p>
                      {item.admin_notes && (
                        <div className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 p-1 rounded mt-1 border border-amber-200 dark:border-amber-800">
                          <strong>Catatan Admin:</strong> {item.admin_notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[item.status] || 'bg-gray-100'}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.phone && (
                          <a
                            href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(item.name)}%2C%20terima%20kasih%20telah%20menghubungi%201sLabs%20mengenai%20${encodeURIComponent(typeLabels[item.inquiry_type] || 'layanan')}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                            title="Chat WhatsApp Pelanggan"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Detail & Tindak Lanjut
                        </button>

                        <button
                          onClick={() => handleDeleteInquiry(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus inquiry"
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

      {/* Detail & Action Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Detail Inquiry #{selectedInquiry.id}
                </h3>
                <p className="text-xs text-gray-500">
                  {typeLabels[selectedInquiry.inquiry_type] || selectedInquiry.inquiry_type} &bull; Dikirim {new Date(selectedInquiry.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 block">Nama:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedInquiry.name}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Perusahaan:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedInquiry.company || '-'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Email:</span>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-indigo-600 hover:underline">{selectedInquiry.email}</a>
                </div>
                <div>
                  <span className="text-gray-400 block">WhatsApp:</span>
                  {selectedInquiry.phone ? (
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                    >
                      {selectedInquiry.phone} <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ) : '-'}
                </div>
              </div>

              {selectedInquiry.current_website_url && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-400 block">Website Existing:</span>
                  <a href={selectedInquiry.current_website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium hover:underline">
                    {selectedInquiry.current_website_url}
                  </a>
                </div>
              )}

              {selectedInquiry.budget_range && (
                <div>
                  <span className="text-gray-400 block">Estimasi Budget:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedInquiry.budget_range}</span>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pesan Kebutuhan Pelanggan:
              </label>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Update Status & Notes Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ubah Status Follow-Up:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="new">Baru (Belum Ditindaklanjuti)</option>
                  <option value="contacted">Sudah Dihubungi via WA/Email</option>
                  <option value="in_progress">Sedang Negosiasi / Diskusi Teknis</option>
                  <option value="converted">Deal / Converted Menjadi Proyek</option>
                  <option value="closed">Ditutup / Batal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Admin (Internal):
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="cth. Penawaran proposal sudah dikirim..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdateInquiry}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {updating ? 'Menyimpan...' : 'Simpan Perubahan Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

