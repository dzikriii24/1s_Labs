import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Video,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  Send,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Power,
  Users,
  Copy
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api, HRInterview, HRInterviewSlot, HRCandidate, HRPosition } from '../../../../services/api';
import notify from '../../../../lib/notify';

const TIME_OPTIONS_24H = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

function timeToMin(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function minToTime(totalMin: number): string {
  const norm = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const HRInterviewsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'interviews' | 'slots'>('interviews');

  // Interviews State
  const [interviews, setInterviews] = useState<HRInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Slots State
  const [slots, setSlots] = useState<HRInterviewSlot[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({
    slot_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:00',
    meeting_link: '',
    max_capacity: 2,
    duration_minutes: 120,
    timezone: 'Asia/Jakarta (WIB)'
  });

  // Confirm Interview Modal (Google Meet Link Input)
  const [confirmModalInterview, setConfirmModalInterview] = useState<HRInterview | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [instructionsInput, setInstructionsInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Reschedule Modal
  const [rescheduleModalInterview, setRescheduleModalInterview] = useState<HRInterview | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Complete Modal
  const [completeModalInterview, setCompleteModalInterview] = useState<HRInterview | null>(null);
  const [interviewerNotes, setInterviewerNotes] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isCompleting, setIsCompleting] = useState(false);

  // Invite Candidate Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<HRCandidate[]>([]);
  const [inviteCandidateId, setInviteCandidateId] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);

  // Fetch interviews
  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.hr.getInterviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined
      });
      if (res.success) {
        setInterviews(res.interviews);
      }
    } catch (err: any) {
      console.warn('Failed to load interviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch slots
  const fetchSlots = async () => {
    setIsSlotsLoading(true);
    try {
      const res = await api.hr.getInterviewSlots();
      if (res.success) {
        setSlots(res.slots);
      }
    } catch (err: any) {
      console.warn('Failed to load slots:', err);
    } finally {
      setIsSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (activeSubTab === 'slots') {
      fetchSlots();
    }
  }, [activeSubTab]);

  // Load candidate list for invite modal
  useEffect(() => {
    api.hr.getCandidates({ limit: 100 }).then(res => {
      if (res.success) {
        setCandidates(res.candidates);
        if (res.candidates.length > 0) setInviteCandidateId(String(res.candidates[0].id));
      }
    });
  }, []);

  // Confirm Interview & Send Meet Link
  const handleOpenConfirm = (intv: HRInterview) => {
    setConfirmModalInterview(intv);
    setMeetingLinkInput(intv.meeting_link || 'https://meet.google.com/');
    setInstructionsInput(intv.instructions || 'Mohon hadir 5 menit sebelum sesi dimulai dengan microphone dan webcam siap.');
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalInterview || !meetingLinkInput.trim()) {
      notify.error('Tautan Google Meet wajib diisi.');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await api.hr.confirmInterview(confirmModalInterview.id, {
        meeting_link: meetingLinkInput.trim(),
        instructions: instructionsInput.trim() || undefined
      });

      if (res.success) {
        notify.success('Interview dikonfirmasi & email resmi terkirim ke kandidat via hr@1slabs.my.id!');
        setConfirmModalInterview(null);
        fetchInterviews();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengonfirmasi interview.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Reschedule Submit
  const handleOpenReschedule = (intv: HRInterview) => {
    setRescheduleModalInterview(intv);
    setRescheduleDate(intv.interview_date || '');
    setRescheduleTime(intv.interview_time || '10:00 - 10:45');
    setRescheduleReason('');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalInterview || !rescheduleDate || !rescheduleTime) {
      notify.error('Tanggal dan jam baru wajib diisi.');
      return;
    }

    setIsRescheduling(true);
    try {
      const res = await api.hr.rescheduleInterview(rescheduleModalInterview.id, {
        interview_date: rescheduleDate,
        interview_time: rescheduleTime,
        reason: rescheduleReason.trim() || undefined
      });

      if (res.success) {
        notify.success('Jadwal interview berhasil diubah dan notifikasi terkirim!');
        setRescheduleModalInterview(null);
        fetchInterviews();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menjadwal ulang.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Cancel Interview
  const handleCancelInterview = async (intv: HRInterview) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Batalkan Sesi Interview?',
      text: `Apakah Anda yakin ingin membatalkan jadwal interview untuk ${intv.candidate_name}?`,
      input: 'textarea',
      inputLabel: 'Alasan pembatalan (akan dikirimkan ke kandidat):',
      inputPlaceholder: 'Tuliskan alasan pembatalan atau instruksi lanjutan (opsional)...',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Ya, Batalkan Interview',
      cancelButtonText: 'Kembali'
    });

    if (isConfirmed) {
      try {
        const res = await api.hr.cancelInterview(intv.id, { reason: reason || 'Dibatalkan oleh Admin HR' });
        if (res.success) {
          notify.success('Interview berhasil dibatalkan.');
          fetchInterviews();
          fetchSlots();
        }
      } catch (err: any) {
        notify.error(err.message || 'Gagal membatalkan interview.');
      }
    }
  };

  // Complete Interview
  const handleOpenComplete = (intv: HRInterview) => {
    setCompleteModalInterview(intv);
    setInterviewerNotes('');
    setRating(5);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalInterview) return;

    setIsCompleting(true);
    try {
      const res = await api.hr.completeInterview(completeModalInterview.id, {
        interviewer_notes: interviewerNotes.trim() || undefined,
        rating,
        advance_candidate_status: true
      });

      if (res.success) {
        notify.success('Interview ditandai selesai! Antrean kandidat berikutnya otomatis aktif.');
        setCompleteModalInterview(null);
        fetchInterviews();
        fetchSlots();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menandai selesai.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Start Session (In Progress)
  const handleStartSession = async (intv: HRInterview) => {
    try {
      const res = await api.hr.startInterviewSession(intv.id);
      if (res.success) {
        notify.success(`Sesi wawancara ${intv.candidate_name} dimulai (In Progress)!`);
        fetchInterviews();
        fetchSlots();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memulai sesi interview.');
    }
  };

  // Invite Candidate Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCandidateId) return;

    setIsInviting(true);
    try {
      const res = await api.hr.inviteCandidateToInterview({
        candidate_id: parseInt(inviteCandidateId, 10),
        send_email: true
      });

      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Undangan Interview Terkirim!',
          html: `<p class="text-xs">Tautan penjadwalan mandiri telah dikirimkan ke email kandidat:</p><div class="p-2 bg-zinc-100 rounded text-[11px] font-mono break-all mt-2">${res.scheduling_url}</div>`,
          confirmButtonColor: '#18181b'
        });
        setIsInviteModalOpen(false);
        fetchInterviews();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengirim undangan interview.');
    } finally {
      setIsInviting(false);
    }
  };

  // Slot Management Handlers
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.meeting_link || !slotForm.meeting_link.trim()) {
      notify.error('Link Google Meet wajib diisi.');
      return;
    }
    const startM = timeToMin(slotForm.start_time);
    const endM = timeToMin(slotForm.end_time);
    if (endM <= startM) {
      notify.error('Jam selesai harus lebih akhir daripada jam mulai.');
      return;
    }
    if (!slotForm.max_capacity || slotForm.max_capacity < 1) {
      notify.error('Maksimal kandidat per slot minimal 1 orang.');
      return;
    }

    setIsSubmittingSlot(true);
    try {
      const res = await api.hr.createInterviewSlot({
        ...slotForm,
        duration_minutes: endM - startM
      });
      if (res.success) {
        notify.success('Slot interview baru berhasil dibuka!');
        setIsAddSlotModalOpen(false);
        fetchSlots();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menambahkan slot ketersediaan.');
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await api.hr.deleteInterviewSlot(slotId);
      notify.success('Slot berhasil dihapus.');
      fetchSlots();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus slot.');
    }
  };

  const handleToggleSlot = async (slotId: number) => {
    try {
      await api.hr.toggleInterviewSlot(slotId);
      fetchSlots();
    } catch (err: any) {
      notify.error('Gagal mengubah status slot.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Sedang Berlangsung
          </span>
        );
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"><CheckCircle2 className="w-3 h-3" /> Terkonfirmasi</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"><Clock className="w-3 h-3" /> Terjadwal</span>;
      case 'pending_selection':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60"><Calendar className="w-3 h-3" /> Undangan Terkirim</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200"><CheckCircle2 className="w-3 h-3" /> Selesai</span>;
      case 'rescheduled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60"><Clock className="w-3 h-3" /> Dijadwal Ulang</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60"><XCircle className="w-3 h-3" /> Dibatalkan</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Penjadwalan & Manajemen Interview
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola sesi interview kandidat, atur slot ketersediaan pewawancara, dan kirimkan tautan Google Meet resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab Pill */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold mr-2">
            <button
              onClick={() => setActiveSubTab('interviews')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'interviews' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Jadwal Interview
            </button>
            <button
              onClick={() => setActiveSubTab('slots')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeSubTab === 'slots' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Slot Ketersediaan ({slots.length})
            </button>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Buat Undangan Interview
          </button>
        </div>
      </div>

      {/* SUBTAB 1: INTERVIEWS LIST / CALENDAR */}
      {activeSubTab === 'interviews' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kandidat atau posisi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700"
              >
                <option value="all">Semua Status</option>
                <option value="scheduled">Scheduled (Menunggu Meet Link)</option>
                <option value="confirmed">Confirmed (Terkonfirmasi)</option>
                <option value="pending_selection">Pending (Menunggu Kandidat)</option>
                <option value="completed">Completed (Selesai)</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={fetchInterviews}
                className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600"
                title="Muat ulang"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interviews List Table */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-3.5">Kandidat</th>
                    <th className="px-4 py-3.5">Posisi Dilamar</th>
                    <th className="px-4 py-3.5">Tanggal & Jam</th>
                    <th className="px-4 py-3.5">Ruang Pertemuan</th>
                    <th className="px-4 py-3.5">Status Interview</th>
                    <th className="px-5 py-3.5 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Memuat data interview...
                      </td>
                    </tr>
                  ) : interviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                        <CalendarCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        Tidak ada sesi interview yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    interviews.map(intv => (
                      <tr key={intv.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-4 font-bold text-zinc-900 text-sm">
                          {intv.candidate_name}
                          <span className="block text-[11px] font-normal text-zinc-400">
                            {intv.candidate_email}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-zinc-800">
                          {intv.position_name || 'Posisi 1sLabs'}
                        </td>
                        <td className="px-4 py-4">
                          {intv.interview_date ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-900 block">
                                  {intv.interview_date}
                                </span>
                                {intv.queue_number && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-white font-bold">
                                    Antrean #{intv.queue_number}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500 block">
                                Slot: {intv.interview_time || '-'} ({intv.timezone || 'WIB'})
                              </span>
                              {intv.estimated_start_time && (
                                <span className="text-[11px] font-semibold text-emerald-700 block">
                                  Est: {intv.estimated_start_time} - {intv.estimated_end_time} WIB
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Kandidat belum memilih slot</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {intv.meeting_link ? (
                            <div className="space-y-1">
                              <a
                                href={intv.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] hover:bg-blue-100 transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Buka Google Meet
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : intv.status === 'scheduled' ? (
                            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Perlu link Google Meet
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(intv.status)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {intv.status === 'scheduled' && !intv.meeting_link && (
                              <button
                                onClick={() => handleOpenConfirm(intv)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Video className="w-3 h-3" />
                                Masukkan Link Meet & Konfirmasi
                              </button>
                            )}

                            {(intv.status === 'confirmed' || (intv.status === 'scheduled' && intv.meeting_link)) && (
                              <button
                                onClick={() => handleStartSession(intv)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Video className="w-3 h-3" />
                                Mulai Interview
                              </button>
                            )}

                            {intv.status === 'in_progress' && (
                              <button
                                onClick={() => handleOpenComplete(intv)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs animate-pulse"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Selesaikan Sesi (Lanjut Antrean)
                              </button>
                            )}

                            {intv.status !== 'completed' && intv.status !== 'cancelled' && (
                              <>
                                <button
                                  onClick={() => handleOpenReschedule(intv)}
                                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                                  title="Jadwal Ulang"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelInterview(intv)}
                                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400"
                                  title="Batalkan Sesi"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SLOTS AVAILABILITY MANAGEMENT */}
      {activeSubTab === 'slots' && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Manajemen Slot Ketersediaan Interview</h3>
              <p className="text-xs text-zinc-500">
                Atur slot waktu wawancara yang dapat dipilih oleh kandidat secara mandiri.
              </p>
            </div>

            <button
              onClick={() => setIsAddSlotModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Buka Slot Baru
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {isSlotsLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                Memuat slot...
              </div>
            ) : slots.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                Belum ada slot ketersediaan dibuka. Klik "Buka Slot Baru" di atas.
              </div>
            ) : (
              slots.map(slot => (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border text-xs flex flex-col justify-between space-y-3 transition-all ${
                    slot.is_booked
                      ? 'bg-zinc-50 border-zinc-200'
                      : 'bg-white border-zinc-200 shadow-xs hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 text-sm">
                        {slot.slot_date}
                      </span>
                      {slot.is_booked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-700">
                          Penuh ({slot.booked_count || slot.max_capacity}/{slot.max_capacity})
                        </span>
                      ) : slot.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {slot.booked_count || 0} / {slot.max_capacity || 1} Terisi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500">
                          Ditutup
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                      <p className="flex items-center gap-1.5 font-semibold text-zinc-800">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {slot.start_time} - {slot.end_time} WIB
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Total {slot.duration_minutes || 60} mnt • Max {slot.max_capacity || 1} kandidat (~{Math.floor((slot.duration_minutes || 60) / (slot.max_capacity || 1))} mnt/org)
                      </p>
                    </div>

                    {slot.meeting_link && (
                      <div className="text-[11px] flex items-center justify-between bg-blue-50/60 border border-blue-100 p-2 rounded-lg text-blue-700">
                        <span className="font-medium truncate max-w-[180px]">{slot.meeting_link}</span>
                        <a
                          href={slot.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline font-bold shrink-0 ml-1 inline-flex items-center gap-0.5"
                        >
                          Buka <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Booked Candidates Queue */}
                    {slot.candidates && slot.candidates.length > 0 && (
                      <div className="pt-2 border-t border-zinc-100 space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                          Antrean Kandidat ({slot.candidates.length}):
                        </p>
                        <div className="space-y-1">
                          {slot.candidates.map(c => (
                            <div key={c.id} className="text-[11px] bg-white p-1.5 rounded-lg border border-zinc-200/80 flex items-center justify-between">
                              <span className="font-bold text-zinc-800 truncate mr-1">
                                #{c.queue_number} {c.candidate_name}
                              </span>
                              <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                                {c.estimated_start_time || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleSlot(slot.id)}
                      disabled={Boolean(slot.is_booked)}
                      className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 disabled:opacity-40"
                    >
                      {slot.is_active ? 'Tutup Slot' : 'Buka Slot'}
                    </button>

                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={Boolean(slot.is_booked || (slot.candidates && slot.candidates.length > 0))}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 disabled:opacity-30"
                      title={slot.candidates && slot.candidates.length > 0 ? "Tidak dapat dihapus karena ada kandidat terjadwal" : "Hapus slot"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONFIRM MODAL (SEND GOOGLE MEET LINK) */}
      {confirmModalInterview && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  Konfirmasi Jadwal & Kirim Link Google Meet
                </h3>
                <p className="text-xs text-zinc-500">
                  Kandidat: <strong>{confirmModalInterview.candidate_name}</strong> ({confirmModalInterview.interview_date} {confirmModalInterview.interview_time})
                </p>
              </div>
              <button onClick={() => setConfirmModalInterview(null)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tautan Ruang Google Meet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={meetingLinkInput}
                  onChange={e => setMeetingLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono text-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Instruksi Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={instructionsInput}
                  onChange={e => setInstructionsInput(e.target.value)}
                  placeholder="Petunjuk persiapan wawancara..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] text-zinc-600">
                <p className="font-semibold text-zinc-800 mb-0.5">Pengiriman Otomatis:</p>
                <p>
                  Email konfirmasi resmi akan dikirimkan langsung ke <strong>{confirmModalInterview.candidate_email}</strong> melalui akun <strong>hr@1slabs.my.id</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalInterview(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isConfirming}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-xs"
                >
                  {isConfirming ? 'Mengirimkan...' : 'Kirim Konfirmasi & Link Meet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModalInterview && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Jadwal Ulang Interview ({rescheduleModalInterview.candidate_name})
              </h3>
              <button onClick={() => setRescheduleModalInterview(null)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tanggal Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Jam Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  placeholder="Contoh: 14:00 - 14:45 WIB"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alasan Perubahan Jadwal
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="Penyesuaian jadwal pewawancara..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                />
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalInterview(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  {isRescheduling ? 'Menyimpan...' : 'Simpan & Kirim Notifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE MODAL */}
      {completeModalInterview && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Selesaikan Interview ({completeModalInterview.candidate_name})
              </h3>
              <button onClick={() => setCompleteModalInterview(null)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Rating Evaluasi (1 - 5)
                </label>
                <select
                  value={rating}
                  onChange={e => setRating(parseInt(e.target.value, 10))}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Sangat Bagus / Recommended)</option>
                  <option value={4}>⭐⭐⭐⭐ (Bagus / Kompeten)</option>
                  <option value={3}>⭐⭐⭐ (Cukup / Rata-rata)</option>
                  <option value={2}>⭐⭐ (Kurang Memenuhi Standar)</option>
                  <option value={1}>⭐ (Tidak Sesuai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Catatan Evaluasi Pewawancara
                </label>
                <textarea
                  rows={3}
                  value={interviewerNotes}
                  onChange={e => setInterviewerNotes(e.target.value)}
                  placeholder="Kesan teknis, kecocokan budaya, catatan porto..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                />
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalInterview(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  {isCompleting ? 'Menyimpan...' : 'Simpan Evaluasi Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE CANDIDATE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Kirim Undangan Penjadwalan Interview Mandiri
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Kandidat Penerima <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={inviteCandidateId}
                  onChange={e => setInviteCandidateId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                >
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.position_name}) - {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-600 space-y-1">
                <p className="font-semibold text-zinc-900">Mekanisme Penjadwalan Mandiri:</p>
                <p className="text-[11px] leading-relaxed">
                  Sistem akan membuat token unik yang aman (expiring 14 hari) dan otomatis mengirimkan email undangan berisikan tombol <strong>"Schedule Your Interview"</strong> ke kandidat terpilih dari akun <span className="font-semibold text-zinc-800">hr@1slabs.my.id</span>.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteCandidateId}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-xs"
                >
                  {isInviting ? 'Memproses...' : 'Kirim Undangan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SLOT MODAL */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Buka Slot Ketersediaan Interview Baru
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Atur waktu 24 jam, link Google Meet, dan kapasitas antrean kandidat.
                </p>
              </div>
              <button onClick={() => setIsAddSlotModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tanggal Slot <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={slotForm.slot_date}
                  onChange={e => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
                />
              </div>

              {/* 24-Hour Time Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jam Mulai (24 Jam) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={slotForm.start_time}
                    onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white font-mono"
                  >
                    {TIME_OPTIONS_24H.map(t => (
                      <option key={`start-${t}`} value={t}>{t} WIB</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Jam Selesai (24 Jam) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={slotForm.end_time}
                    onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white font-mono"
                  >
                    {TIME_OPTIONS_24H.map(t => (
                      <option key={`end-${t}`} value={t}>{t} WIB</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Google Meet Link (MANDATORY) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Link Google Meet <span className="text-rose-500">* (Wajib)</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  value={slotForm.meeting_link}
                  onChange={e => setSlotForm({ ...slotForm, meeting_link: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white font-mono"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Link ini wajib disertakan dan akan otomatis diberikan kepada kandidat yang memesan slot ini sesuai antrean.
                </span>
              </div>

              {/* Capacity (MANDATORY, MULTI-CANDIDATE) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Maksimal Kandidat dalam 1 Slot <span className="text-rose-500">* (Wajib)</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">Sistem Antrean Bertahap</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={slotForm.max_capacity}
                    onChange={e => setSlotForm({ ...slotForm, max_capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-24 text-xs p-2.5 rounded-xl border border-zinc-200 bg-white font-bold"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSlotForm({ ...slotForm, max_capacity: num })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          slotForm.max_capacity === num
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                            : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        {num} Kandidat
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Queue Calculation Preview */}
              {(() => {
                const startM = timeToMin(slotForm.start_time);
                const endM = timeToMin(slotForm.end_time);
                const totalM = endM - startM;
                if (totalM <= 0) {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      ⚠️ Jam selesai harus lebih akhir daripada jam mulai.
                    </div>
                  );
                }
                const cap = Math.max(1, slotForm.max_capacity);
                const durPerCand = Math.floor(totalM / cap);

                return (
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold text-zinc-800">
                      <span>Total Waktu Slot: <strong>{totalM} Menit</strong></span>
                      <span className="text-emerald-700">Estimasi: ~<strong>{durPerCand} Menit</strong> / kandidat</span>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
                        Simulasi Antrean Kandidat:
                      </p>
                      <div className="space-y-1">
                        {Array.from({ length: Math.min(cap, 5) }).map((_, idx) => {
                          const s = startM + (idx * durPerCand);
                          const e = s + durPerCand;
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded-lg border border-zinc-100">
                              <span className="font-semibold text-zinc-700">Antrean #{idx + 1}</span>
                              <span className="font-mono text-zinc-600">{minToTime(s)} - {minToTime(e)} WIB</span>
                            </div>
                          );
                        })}
                        {cap > 5 && (
                          <p className="text-[10px] text-zinc-400 italic text-center">... dan {cap - 5} antrean berikutnya</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSlot}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
                >
                  {isSubmittingSlot ? 'Menyimpan Slot...' : 'Simpan Slot Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

