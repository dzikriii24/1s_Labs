import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Send,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Calendar,
  Video,
  Mail,
  Activity,
  AlertCircle
} from 'lucide-react';
import { api, HRStatsResponse, HRInterview } from '../../../../services/api';
import notify from '../../../../lib/notify';

interface HRDashboardTabProps {
  onNavigateTab: (tab: string) => void;
  onSelectCandidate?: (candidateId: number) => void;
}

export const HRDashboardTab: React.FC<HRDashboardTabProps> = ({
  onNavigateTab,
  onSelectCandidate
}) => {
  const [data, setData] = useState<HRStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.hr.getStats();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      console.warn('Failed to load HR stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const stats = data?.stats || {
    total_candidates: 0,
    new_candidates: 0,
    emails_sent: 0,
    candidates_replied: 0,
    interview_scheduled: 0,
    interview_completed: 0,
    candidates_accepted: 0,
    candidates_rejected: 0
  };

  const statCards = [
    {
      label: 'Total Kandidat',
      value: stats.total_candidates,
      sub: 'Seluruh pelamar terdaftar',
      icon: Users,
      actionTab: 'candidates',
      color: 'text-zinc-900',
      bgColor: 'bg-zinc-100'
    },
    {
      label: 'Kandidat Baru',
      value: stats.new_candidates,
      sub: 'Menunggu review profil',
      icon: UserPlus,
      actionTab: 'candidates',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Email Terkirim',
      value: stats.emails_sent,
      sub: 'Via hr@1slabs.my.id',
      icon: Send,
      actionTab: 'campaigns',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      label: 'Kandidat Membalas',
      value: stats.candidates_replied,
      sub: 'Tanggapan masuk di Inbox',
      icon: MessageSquare,
      actionTab: 'inbox',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Interview Terjadwal',
      value: stats.interview_scheduled,
      sub: 'Mendatang / terkonfirmasi',
      icon: CalendarCheck,
      actionTab: 'interviews',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'Interview Selesai',
      value: stats.interview_completed,
      sub: 'Wawancara telah tuntas',
      icon: CheckCircle2,
      actionTab: 'interviews',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      label: 'Kandidat Diterima',
      value: stats.candidates_accepted,
      sub: 'Offered / siap bergabung',
      icon: TrendingUp,
      actionTab: 'candidates',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100/60'
    },
    {
      label: 'Kandidat Ditolak',
      value: stats.candidates_rejected,
      sub: 'Disimpan di talent pool',
      icon: XCircle,
      actionTab: 'candidates',
      color: 'text-zinc-500',
      bgColor: 'bg-zinc-100'
    }
  ];

  // Helper status badge formatting
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new_candidate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Kandidat Baru</span>;
      case 'contacted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">Dihubungi</span>;
      case 'responded':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Dibalas</span>;
      case 'screening':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Screening</span>;
      case 'interview_scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">Interview Dijadwalkan</span>;
      case 'interview_completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60">Interview Selesai</span>;
      case 'offered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Diterima / Offered</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">Ditolak</span>;
      case 'on_hold':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60">On Hold</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600">{status}</span>;
    }
  };

  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Terkonfirmasi</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">Dijadwalkan</span>;
      case 'pending_selection':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Menunggu Pilihan</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">Selesai</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">Dibatalkan</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600">{status}</span>;
    }
  };

  const maxTimelineCount = Math.max(1, ...(data?.timeline?.map(t => t.count) || [1]));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recruitment Operations Active</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Pusat Rekrutmen & Manajemen Talenta 1sLabs
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola alur rekrutmen kandidat, kampanye email resmi <span className="font-semibold text-zinc-800">hr@1slabs.my.id</span>, dan penjadwalan interview daring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Perbarui Data
          </button>
          <button
            onClick={() => onNavigateTab('candidates')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Tambah Kandidat
          </button>
        </div>
      </div>

      {/* 8 Primary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(card.actionTab)}
              className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-900 transition-colors">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {card.value.toLocaleString('id-ID')}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-zinc-400">{card.sub}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-600 transform group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations Section: Trend & Pipeline Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Growth Over Time (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Pertumbuhan Kandidat Masuk (14 Hari Terakhir)</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Jumlah kandidat yang terdaftar per tanggal</p>
              </div>
              <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                Realtime Data
              </span>
            </div>

            {/* Timeline Bars */}
            {data?.timeline && data.timeline.length > 0 ? (
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-1 border-b border-zinc-100">
                {data.timeline.map((point, i) => {
                  const heightPercent = Math.round((point.count / maxTimelineCount) * 100);
                  const d = new Date(point.date);
                  const label = `${d.getDate()}/${d.getMonth() + 1}`;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                      <div className="text-[10px] font-bold text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.count}
                      </div>
                      <div
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                        className="w-full bg-zinc-900 group-hover:bg-zinc-700 rounded-t-md transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-200 rounded-xl my-2">
                <Calendar className="w-8 h-8 mb-2 text-zinc-300" />
                <p className="text-xs font-medium">Belum ada aktivitas pendaftaran 14 hari terakhir.</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-zinc-900 inline-block"></span>
              Pelamar Baru per Hari
            </span>
            <button
              onClick={() => onNavigateTab('candidates')}
              className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
            >
              Lihat Semua Kandidat &rarr;
            </button>
          </div>
        </div>

        {/* Status Distribution (1 Col) */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Distribusi Status Seleksi</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Sebaran pipeline kandidat aktif</p>
              </div>
              <button
                onClick={() => onNavigateTab('pipeline')}
                className="text-xs font-semibold text-zinc-800 hover:underline inline-flex items-center gap-1"
              >
                Kanban &rarr;
              </button>
            </div>

            <div className="space-y-3 my-2">
              {data?.status_breakdown && data.status_breakdown.length > 0 ? (
                data.status_breakdown.map((item, idx) => {
                  const total = stats.total_candidates || 1;
                  const pct = Math.round((item.count / total) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700">{getStatusBadge(item.status)}</span>
                        <span className="font-bold text-zinc-900">
                          {item.count} <span className="font-normal text-zinc-400 text-[10px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-zinc-800 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-400 text-center py-8">Belum ada data status seleksi.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 text-center">
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="w-full py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-xs font-semibold text-zinc-800 transition-colors"
            >
              Buka Recruitment Pipeline Board
            </button>
          </div>
        </div>
      </div>

      {/* Split Bottom: Upcoming Interviews & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Jadwal Interview Terdekat</h3>
              </div>
              <button
                onClick={() => onNavigateTab('interviews')}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:underline"
              >
                Lihat Kalender &rarr;
              </button>
            </div>

            {data?.upcoming_interviews && data.upcoming_interviews.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming_interviews.map((intv) => (
                  <div
                    key={intv.id}
                    className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{intv.candidate_name}</p>
                        <p className="text-[11px] text-zinc-500">{intv.position_name || 'Kandidat 1sLabs'}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-zinc-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {intv.interview_date || 'Belum dipilih'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {intv.interview_time || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                      {getInterviewStatusBadge(intv.status)}
                      {intv.meeting_link ? (
                        <a
                          href={intv.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Google Meet
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">Belum ada link meet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-400">
                <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Belum ada jadwal wawancara mendatang.</p>
                <button
                  onClick={() => onNavigateTab('interviews')}
                  className="mt-3 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Buka Modul Penjadwalan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent HR Activities Log */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Aktivitas Rekrutmen Terbaru</h3>
              </div>
              <span className="text-xs text-zinc-400 font-medium">Audit Trail</span>
            </div>

            {data?.recent_activities && data.recent_activities.length > 0 ? (
              <div className="space-y-3">
                {data.recent_activities.map((act) => {
                  const timeStr = new Date(act.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const dateStr = new Date(act.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-zinc-900 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-zinc-900 truncate">{act.title}</p>
                          <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                            {dateStr}, {timeStr}
                          </span>
                        </div>
                        <p className="text-zinc-600 line-clamp-1 mt-0.5">{act.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                          <span>Kandidat: <strong className="text-zinc-700">{act.candidate_name}</strong></span>
                          <span>&bull;</span>
                          <span>Oleh: {act.created_by || 'Sistem'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-400">
                <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Belum ada riwayat aktivitas rekrutmen tercatat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

