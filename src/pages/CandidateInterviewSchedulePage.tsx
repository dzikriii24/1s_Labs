import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Loader2,
  Users,
  Lock,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { api, HRInterviewSlot } from '../services/api';
import notify from '../lib/notify';

export const CandidateInterviewSchedulePage: React.FC = () => {
  const { token: routeToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [isBookedPreviously, setIsBookedPreviously] = useState<boolean>(false);
  const [isActiveTurn, setIsActiveTurn] = useState<boolean>(false);
  const [activeQueueNumber, setActiveQueueNumber] = useState<number | null>(null);
  const [slotQueue, setSlotQueue] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<HRInterviewSlot[]>([]);

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [candidateNotes, setCandidateNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const loadData = async (silent = false) => {
    if (!token) {
      setErrorMsg('Tautan interview tidak lengkap atau token tidak ditemukan.');
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await api.hr.getPublicInterview(token);
      if (res.success) {
        setInterviewData(res.interview);
        const booked = Boolean(
          res.is_booked_previously ||
          (res.interview && res.interview.status !== 'pending_selection')
        );
        setIsBookedPreviously(booked);
        setIsActiveTurn(Boolean(res.is_active_turn));
        setActiveQueueNumber(res.active_queue_number ?? null);
        setSlotQueue(res.slot_queue || []);
        setAvailableSlots(res.available_slots || []);

        // Pre-select first date if available
        if (!booked && res.available_slots && res.available_slots.length > 0 && !selectedDate) {
          setSelectedDate(res.available_slots[0].slot_date);
        }
      } else {
        setErrorMsg(res.interview?.instructions || 'Tautan interview tidak valid atau sudah kedaluwarsa.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat jadwal interview. Silakan hubungi tim HR 1sLabs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Periodic polling every 15 seconds when booked to auto-unlock Google Meet when turn arrives
  useEffect(() => {
    if (!token || (!isBookedPreviously && !bookingSuccess)) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [token, isBookedPreviously, bookingSuccess]);

  // Group slots by date
  const uniqueDates = Array.from(new Set(availableSlots.map(s => s.slot_date))).sort();
  const slotsForSelectedDate = availableSlots.filter(s => s.slot_date === selectedDate);
  const selectedSlot = availableSlots.find(s => s.id === selectedSlotId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      notify.error('Silakan pilih salah satu slot jam interview terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.hr.bookPublicInterview(token, {
        slot_id: selectedSlotId,
        candidate_notes: candidateNotes.trim() || undefined
      });

      if (res.success) {
        setBookingSuccess(res.booking);
        notify.success('Jadwal interview berhasil dikonfirmasi!');
        // Refresh full data to load slot queue & meet link
        await loadData(true);
      } else {
        notify.error(res.message || 'Gagal menjadwalkan interview.');
      }
    } catch (err: any) {
      notify.error(err.message || 'Terjadi kesalahan saat memproses booking jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const isScheduled = isBookedPreviously || Boolean(bookingSuccess);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-between selection:bg-zinc-900 selection:text-white font-sans">
      <Helmet>
        <title>Portal Penjadwalan Interview – 1sLabs Recruitment</title>
        <meta name="description" content="Informasi jadwal interview dan antrean seleksi kandidat 1sLabs." />
      </Helmet>

      {/* Top Header - Logo Only (No text 1sLabs) */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/logo-1slabs.png"
              alt="1sLabs"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            HR Recruitment System
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
            <p className="text-sm font-medium text-zinc-500">Memverifikasi tautan interview...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Tautan Tidak Tersedia</h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">{errorMsg}</p>
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 mb-6 text-left">
              <p className="font-semibold text-zinc-900 mb-1">Butuh bantuan penjadwalan?</p>
              <p>
                Silakan hubungi tim rekrutmen kami secara langsung di{' '}
                <a href="mailto:hr@1slabs.my.id" className="font-semibold text-zinc-900 underline">
                  hr@1slabs.my.id
                </a>{' '}
                dengan menyertakan nama lengkap dan posisi yang Anda lamar.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors"
            >
              Kembali ke Beranda 1sLabs
            </Link>
          </div>
        ) : isScheduled && interviewData ? (
          /* ===============================================================
             CONFIRMED SCHEDULE & LIVE INTERVIEW QUEUE PORTAL
             (Shown on initial booking or whenever candidate revisits the link)
             =============================================================== */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Status Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {interviewData.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                        Sesi Interview Selesai
                      </span>
                    ) : isActiveTurn ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Giliran Anda Sedang Berlangsung!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <Clock className="w-3.5 h-3.5" />
                        Jadwal Terkonfirmasi – Menunggu Antrean
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    Jadwal Interview & Antrean Seleksi
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Berikut adalah rincian jadwal dan antrean wawancara untuk posisi <strong>{interviewData.position_name || '1sLabs'}</strong>.
                  </p>
                </div>

                <div className="sm:text-right bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-zinc-100 flex sm:flex-col items-center sm:items-end justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Kandidat</p>
                    <p className="text-sm font-bold text-zinc-900">{interviewData.candidate_name}</p>
                    <p className="text-xs text-zinc-500">{interviewData.candidate_email}</p>
                  </div>
                  <button
                    onClick={() => loadData(true)}
                    disabled={isRefreshing}
                    title="Perbarui antrean terkini"
                    className="sm:mt-2 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Perbarui Status
                  </button>
                </div>
              </div>

              {/* Grid Information: Date, Slot Time, Queue Number, Estimated Personal Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-xs mb-6">
                <div>
                  <span className="text-zinc-400 font-medium block">Tanggal Wawancara</span>
                  <p className="font-bold text-zinc-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    {formatDateDisplay(interviewData.interview_date)}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 font-medium block">Rentang Slot Keseluruhan</span>
                  <p className="font-bold text-zinc-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    {interviewData.interview_time || '-'} WIB
                  </p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-2.5">
                  <span className="text-zinc-400 font-medium block text-[11px]">Nomor Antrean Anda</span>
                  <p className="font-extrabold text-zinc-900 text-base mt-0.5 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-zinc-900 text-white text-xs flex items-center justify-center font-bold">
                      #{interviewData.queue_number || 1}
                    </span>
                    Antrean #{interviewData.queue_number || 1}
                  </p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5">
                  <span className="text-emerald-700 font-semibold block text-[11px]">Perkiraan Waktu Anda</span>
                  <p className="font-extrabold text-emerald-900 text-sm mt-0.5">
                    {interviewData.estimated_start_time && interviewData.estimated_end_time
                      ? `${interviewData.estimated_start_time} - ${interviewData.estimated_end_time} WIB`
                      : `${interviewData.interview_time || '-'} WIB`}
                  </p>
                </div>
              </div>

              {/* =======================================================
                  GOOGLE MEET ACCESS CONTROL (ANTREAN / QUEUE ACCESS)
                  ======================================================= */}
              <div className="border border-zinc-200 rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-white to-zinc-50/60">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-zinc-800" />
                  <h3 className="font-bold text-sm text-zinc-900">Ruang Wawancara (Google Meet)</h3>
                </div>

                {interviewData.status === 'completed' ? (
                  <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-700 space-y-1">
                    <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Sesi Wawancara Anda Telah Selesai
                    </p>
                    <p className="text-zinc-500">
                      Terima kasih atas partisipasi Anda dalam tahap interview 1sLabs. Tim HR kami akan menghubungi Anda kembali melalui email resmi mengenai hasil evaluasi.
                    </p>
                  </div>
                ) : isActiveTurn ? (
                  /* ACTIVE TURN: Google Meet Button is Unlocked & Clickable! */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-sm text-emerald-950">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Giliran Anda Sedang Aktif!
                      </p>
                      <p className="text-emerald-800 leading-relaxed">
                        Pewawancara 1sLabs telah siap di ruang pertemuan Google Meet. Silakan klik tombol di bawah untuk langsung bergabung ke sesi wawancara Anda sekarang.
                      </p>
                    </div>

                    {interviewData.meeting_link ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <a
                          href={interviewData.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
                        >
                          <Video className="w-4 h-4" />
                          Gabung Google Meet Sekarang
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <span className="text-xs text-zinc-500 font-mono break-all sm:break-normal">
                          {interviewData.meeting_link}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        Link pertemuan sedang disinkronkan oleh tim HR. Silakan muat ulang halaman beberapa saat lagi.
                      </div>
                    )}
                  </div>
                ) : (
                  /* WAITING TURN: Candidate is queued. Google Meet Button is LOCKED until previous candidate finishes! */
                  <div className="space-y-4">
                    <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                      <p className="font-bold flex items-center gap-1.5 text-amber-950">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Menunggu Giliran Sesi Wawancara (Antrean #{interviewData.queue_number || 1})
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        Saat ini sesi wawancara untuk <strong>Antrean #{activeQueueNumber || 1}</strong> sedang berlangsung atau sedang dipersiapkan.
                        Tombol Google Meet akan <strong>otomatis terbuka (aktif)</strong> begitu antrean sebelumnya selesai dilaksanakan oleh pewawancara.
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-700">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Halaman ini memantau status secara live dan otomatis memperbarui setiap 15 detik.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-200 text-zinc-400 font-bold text-xs sm:text-sm cursor-not-allowed select-none shadow-xs"
                      >
                        <Lock className="w-4 h-4" />
                        Google Meet Terkunci (Menunggu Giliran Selesai)
                      </button>
                      <span className="text-xs text-zinc-400 italic">
                        Perkiraan waktu Anda: {interviewData.estimated_start_time || '-'} - {interviewData.estimated_end_time || '-'} WIB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* =======================================================
                  LIST DAFTAR ANTREAN DI SLOT INI (TRANSPARENCY & PRIVACY)
                  ======================================================= */}
              {slotQueue && slotQueue.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-700" />
                      <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                        Daftar Antrean Slot ({interviewData.interview_time || '-'} WIB)
                      </h4>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Total: {slotQueue.length} Kandidat
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {slotQueue.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          item.is_you
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                            : 'bg-white border-zinc-200 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              item.is_you ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            #{item.queue_number}
                          </span>
                          <div>
                            <p className="font-bold flex items-center gap-1.5">
                              {item.candidate_name}
                              {item.is_you && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-semibold">
                                  Anda
                                </span>
                              )}
                            </p>
                            <p className={`text-[11px] ${item.is_you ? 'text-zinc-300' : 'text-zinc-500'}`}>
                              Perkiraan: {item.estimated_start_time || '-'} - {item.estimated_end_time || '-'} WIB
                            </p>
                          </div>
                        </div>

                        <div>
                          {item.status === 'completed' ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                item.is_you ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              ✓ Selesai
                            </span>
                          ) : item.status === 'in_progress' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Sedang Berlangsung
                            </span>
                          ) : item.queue_number === (activeQueueNumber || 1) ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Giliran Aktif
                            </span>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                                item.is_you ? 'bg-zinc-800 text-zinc-300' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}
                            >
                              Menunggu Giliran
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions & Help */}
              <div className="mt-6 pt-5 border-t border-zinc-100 text-xs text-zinc-500 space-y-2">
                <p className="font-semibold text-zinc-800">Petunjuk Penting Sebelum Masuk Ruang Wawancara:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-600">
                  <li>Mohon pastikan kamera, mikrofon, dan sambungan internet Anda siap 5 menit sebelum perkiraan waktu giliran.</li>
                  <li>Perkiraan waktu adalah estimasi. Harap tetap berada di halaman ini sampai giliran Anda dipanggil.</li>
                  <li>Apabila mengalami kendala teknis mendadak, Anda dapat langsung mengirim email ke <a href="mailto:hr@1slabs.my.id" className="text-zinc-900 font-semibold underline">hr@1slabs.my.id</a>.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* ===============================================================
             SLOT SELECTION FORM (When Candidate has NOT chosen a slot yet)
             =============================================================== */
          <div className="space-y-6">
            {/* Candidate & Position Brief Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6 mb-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 mb-2">
                    <Briefcase className="w-3.5 h-3.5" />
                    Undangan Interview Resmi
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    Pilih Jadwal Wawancara Anda
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Silakan tentukan slot waktu interview yang paling tepat dan nyaman bagi Anda.
                  </p>
                </div>

                <div className="sm:text-right bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-zinc-100">
                  <p className="text-xs text-zinc-400 font-medium">Kandidat Terdaftar</p>
                  <p className="text-sm font-bold text-zinc-900">{interviewData.candidate_name}</p>
                  <p className="text-xs text-zinc-500">{interviewData.candidate_email}</p>
                </div>
              </div>

              {/* Position details banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 border border-zinc-200/70 rounded-xl p-4 text-xs">
                <div>
                  <span className="text-zinc-400 block font-medium">Posisi yang Dilamar</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5 block">{interviewData.position_name || 'Posisi di 1sLabs'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Departemen</span>
                  <span className="font-semibold text-zinc-800 mt-0.5 block">{interviewData.department || 'Operasional'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Platform Pertemuan</span>
                  <span className="font-semibold text-zinc-800 mt-0.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-zinc-600" />
                    Google Meet (Daring)
                  </span>
                </div>
              </div>
            </div>

            {/* Date and Slot Picker Form */}
            <form onSubmit={handleBooking} className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
              {availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-700">Belum Ada Slot Tersedia</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Seluruh slot saat ini sedang penuh atau belum dibuka. Silakan balas email undangan Anda ke{' '}
                    <span className="font-medium text-zinc-800">hr@1slabs.my.id</span> untuk koordinasi jadwal khusus.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Select Date */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-3">
                      1. Pilih Tanggal Wawancara
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {uniqueDates.map(dateStr => {
                        const isSelected = selectedDate === dateStr;
                        const dateObj = new Date(dateStr);
                        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' });

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedSlotId(null);
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                            }`}
                          >
                            <span className={`text-[11px] font-semibold uppercase block ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                              {dayName}
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-lg font-bold">{dayNum}</span>
                              <span className={`text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>{monthName}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Select Time Slot (with Multi-Candidate Queue Preview) */}
                  {selectedDate && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                          2. Pilih Waktu Wawancara ({formatDateDisplay(selectedDate)})
                        </label>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          Waktu Indonesia Barat (WIB)
                        </span>
                      </div>

                      {slotsForSelectedDate.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2">
                          Tidak ada slot waktu tersedia pada tanggal ini. Silakan pilih tanggal lain.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {slotsForSelectedDate.map(slot => {
                            const isSelected = selectedSlotId === slot.id;
                            const maxCap = slot.max_capacity || 1;
                            const booked = slot.booked_count || 0;
                            const dur = slot.duration_per_candidate || slot.duration_minutes || 45;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                                }`}
                              >
                                <div className="space-y-1.5 flex-1 pr-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`} />
                                    <p className="text-sm font-bold">
                                      {slot.start_time} - {slot.end_time} WIB
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        isSelected
                                          ? 'bg-zinc-800 text-zinc-200'
                                          : 'bg-zinc-100 text-zinc-600'
                                      }`}
                                    >
                                      Kapasitas: {booked} / {maxCap} terisi
                                    </span>
                                    <span className={`text-[11px] ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                      Durasi: ~{dur} mnt/kandidat
                                    </span>
                                  </div>

                                  {slot.next_queue_number && slot.estimated_start_time && slot.estimated_end_time && (
                                    <p className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                      ✦ Anda akan menempati Antrean #{slot.next_queue_number} (Est. {slot.estimated_start_time} - {slot.estimated_end_time} WIB)
                                    </p>
                                  )}
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-white bg-white text-zinc-900'
                                      : 'border-zinc-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Optional Candidate Notes */}
                  {selectedSlotId && (
                    <div className="pt-2 border-t border-zinc-100 space-y-3">
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        3. Catatan atau Kontak Tambahan (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        value={candidateNotes}
                        onChange={e => setCandidateNotes(e.target.value)}
                        placeholder="Contoh: Nomor WhatsApp aktif untuk konfirmasi cepat atau catatan portofolio..."
                        className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white"
                      />
                    </div>
                  )}

                  {/* Summary & Submit Action */}
                  <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      {selectedSlot ? (
                        <p className="text-xs text-zinc-600">
                          Jadwal dipilih: <strong className="text-zinc-900">{formatDateDisplay(selectedSlot.slot_date)}</strong> pukul <strong className="text-zinc-900">{selectedSlot.start_time} - {selectedSlot.end_time} WIB</strong>
                          {selectedSlot.next_queue_number && (
                            <span className="block text-emerald-700 font-semibold text-[11px] mt-0.5">
                              Anda akan berada pada Antrean #{selectedSlot.next_queue_number} ({selectedSlot.estimated_start_time} - {selectedSlot.estimated_end_time} WIB)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400">
                          Silakan tentukan tanggal dan jam interview untuk melanjutkan.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedSlotId || isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-semibold tracking-wide shadow-sm transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses Jadwal...
                        </>
                      ) : (
                        <>
                          Konfirmasi Jadwal Interview
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-center text-xs text-zinc-400">
        <p>&copy; {new Date().getFullYear()} 1sLabs – Platform Rekrutmen & Pengembangan Talenta.</p>
      </footer>
    </div>
  );
};
export default CandidateInterviewSchedulePage;
