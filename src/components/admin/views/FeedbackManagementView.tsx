import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Trash2,
  Edit3,
  Loader2,
  ArrowUpRight,
  Send,
  Check,
  X
} from 'lucide-react';
import { api, MeetingScheduleItem } from '../../../services/api';
import notify from '../../../lib/notify';

export const FeedbackManagementView: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingScheduleItem | null>(null);

  // Edit / Detail State
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Summary counts
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today_meetings: 0
  });

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.meetings.adminList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined
      });
      if (res.success && res.meetings) {
        setMeetings(res.meetings);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to load meetings:', err);
      notify.error(err.message || 'Gagal memuat jadwal meeting pelanggan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter]);

  const handleOpenDetail = (item: MeetingScheduleItem) => {
    setSelectedMeeting(item);
    setEditStatus(item.status);
    setEditAdminNotes(item.admin_notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedMeeting) return;
    setUpdating(true);
    try {
      const res = await api.meetings.adminUpdate(selectedMeeting.id, {
        status: editStatus,
        admin_notes: editAdminNotes.trim()
      });
      if (res.success) {
        notify.success('Status meeting berhasil diperbarui.');
        setSelectedMeeting(null);
        await fetchMeetings();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status meeting.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await notify.confirm({
      title: 'Hapus Jadwal Meeting',
      text: `Hapus data jadwal meeting #${id} secara permanen?`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;

    try {
      const res = await api.meetings.adminDelete(id);
      if (res.success) {
        notify.success('Jadwal meeting berhasil dihapus.');
        if (selectedMeeting?.id === id) setSelectedMeeting(null);
        await fetchMeetings();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus meeting.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          label: 'Terkonfirmasi'
        };
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'Selesai'
        };
      case 'cancelled':
        return {
          bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
          label: 'Dibatalkan'
        };
      case 'rescheduled':
        return {
          bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          label: 'Jadwal Ulang'
        };
      case 'scheduled':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          label: 'Menunggu Konfirmasi'
        };
    }
  };

  const filtered = meetings.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.company_name && m.company_name.toLowerCase().includes(q)) ||
      m.contact_person.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                1sLabs Communication & Feedback
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              Feedback & Jadwal Meeting Pelanggan
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-2xl">
              Daftar calon klien yang memesan sesi diskusi online melalui tautan email marketing, feedback kebutuhan proyek, dan jadwal konsultasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="/schedule"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center space-x-1.5 shadow-xs hover:bg-zinc-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Form Publik (/schedule)</span>
          </a>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] text-zinc-500 font-medium block">Total Meeting</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white font-mono mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">Menunggu Konfirmasi</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
            {stats.scheduled}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-xs">
          <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium block">Terkonfirmasi</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
            {stats.confirmed}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">Selesai Diskusi</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            {stats.completed}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-emerald-600 font-bold block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Jadwal Hari Ini
          </span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
            {stats.today_meetings}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama bisnis, kontak person, email, catatan..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'scheduled', label: 'Menunggu' },
            { id: 'confirmed', label: 'Terkonfirmasi' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Dibatalkan' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-zinc-500">Memuat data jadwal meeting & feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Belum Ada Jadwal Meeting</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Belum ada data pengajuan meeting yang sesuai dengan filter pencarian ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3 px-4">Waktu & Jadwal</th>
                  <th className="py-3 px-4">Bisnis & Kontak Person</th>
                  <th className="py-3 px-4">Kontak (Email / WA)</th>
                  <th className="py-3 px-4">Platform & Catatan / Feedback</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const isToday =
                    item.meeting_date === new Date().toISOString().split('T')[0];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Jadwal */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-zinc-900 dark:text-white">{item.meeting_date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.meeting_time}</span>
                        </div>
                        {isToday && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                            HARI INI
                          </span>
                        )}
                      </td>

                      {/* Bisnis & Kontak */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-white block">
                          {item.contact_person}
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          {item.company_name || '(Bisnis Pribadi)'}
                        </span>
                      </td>

                      {/* Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <a href={`mailto:${item.email}`} className="hover:underline">
                            {item.email}
                          </a>
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-1 text-emerald-600 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {item.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Platform & Catatan */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <Video className="w-3 h-3" />
                          <span>{item.platform}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5" title={item.notes || ''}>
                          {item.notes ? item.notes : <span className="italic text-zinc-400">Tanpa catatan</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {item.phone && (
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Halo ${item.contact_person}, salam kenal dari tim 1sLabs. Kami ingin mengonfirmasi jadwal meeting diskusi online Anda pada ${item.meeting_date} (${item.meeting_time}).`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 transition"
                              title="Chat WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                            title="Detail & Update Status"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail & Status Update */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                  Rincian Jadwal Meeting #{selectedMeeting.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact Person:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedMeeting.contact_person}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Perusahaan / Brand:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedMeeting.company_name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email:</span>
                <a href={`mailto:${selectedMeeting.email}`} className="text-indigo-600 hover:underline">
                  {selectedMeeting.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">No. WhatsApp / HP:</span>
                <span className="font-mono text-emerald-600 font-semibold">{selectedMeeting.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Waktu Dijadwalkan:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedMeeting.meeting_date} &bull; {selectedMeeting.meeting_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Platform:</span>
                <span className="font-semibold text-indigo-600">{selectedMeeting.platform}</span>
              </div>
            </div>

            {/* Notes / Feedback */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Catatan / Feedback Kebutuhan dari Pelanggan:
              </label>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs italic">
                {selectedMeeting.notes || 'Tidak ada catatan khusus.'}
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Ubah Status Meeting:
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="scheduled">Menunggu Konfirmasi (Scheduled)</option>
                <option value="confirmed">Terkonfirmasi (Confirmed)</option>
                <option value="completed">Meeting Selesai (Completed)</option>
                <option value="rescheduled">Dijadwalkan Ulang (Rescheduled)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Catatan Internal Admin (Opsional):
              </label>
              <textarea
                rows={3}
                value={editAdminNotes}
                onChange={(e) => setEditAdminNotes(e.target.value)}
                placeholder="Tuliskan catatan hasil diskusi, link Google Meet yang diberikan, atau rencana tindak lanjut..."
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

