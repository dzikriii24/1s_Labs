import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck2,
  Layers,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { AutomationOverviewResponse, GenerationJob } from '../../../../services/contentAutomationApi';
import { formatDateId } from '../content/blogUiUtils';

interface AutomationOverviewPanelProps {
  overview: AutomationOverviewResponse | null;
  recentJobs: GenerationJob[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateSubtab: (sub: string) => void;
}

const APPROVAL_MODE_LABELS: Record<string, string> = {
  manual_approval: 'Manual Approval (Default — Review Sebelum Terbit)',
  auto_publish_qualified: 'Auto Publish Jika Lolos Quality Gate',
  always_save_draft: 'Simpan Selalu Sebagai Draft'
};

const JOB_STATUS_BADGE: Record<string, string> = {
  queued: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial_failed: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200'
};

export const AutomationOverviewPanel: React.FC<AutomationOverviewPanelProps> = ({
  overview,
  recentJobs,
  loading,
  onRefresh,
  onNavigateSubtab
}) => {
  const health = overview?.engine_health;
  const counts = overview?.counts;
  const quota = overview?.quota;
  const avg = overview?.averages;
  const settings = overview?.settings;

  const quotaPct = quota && quota.daily_limit > 0 ? Math.min(100, Math.round((quota.daily_used / quota.daily_limit) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Engine Status & Mode Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={`lg:col-span-2 rounded-2xl border p-5 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between gap-4 ${
            health?.reachable
              ? 'border-blue-200 dark:border-blue-900/50'
              : 'border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  health?.reachable
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                <Server size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                    Local Python Engine Adapter
                  </h3>
                  {health?.reachable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Terhubung ({health.latency_ms} ms)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle size={12} /> Engine Lokal Belum Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Endpoint: {health?.engine_url || settings?.engine_url || 'http://127.0.0.1:8000'}
                </p>
                {!health?.reachable && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    Jalankan <code className="px-1.5 py-0.5 bg-amber-100/70 dark:bg-amber-900/40 rounded">python run_local_slabs_engine.py</code> di folder{' '}
                    <code className="px-1.5 py-0.5 bg-amber-100/70 dark:bg-amber-900/40 rounded">article-generator/project</code> untuk mengaktifkan generasi artikel lokal.
                  </p>
                )}
                {health?.error && (
                  <p className="text-xs text-rose-600 mt-1">Detail: {health.error}</p>
                )}
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Cek Ulang
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-400 block">Integration Key</span>
              <span className={`font-semibold ${health?.key_configured ? 'text-emerald-600' : 'text-rose-600'}`}>
                {health?.key_configured ? 'Terkonfigurasi' : 'Belum Disetel'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Gemini Provider</span>
              <span className={`font-semibold ${health?.gemini_configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {health?.gemini_configured ? 'Siap' : health?.reachable ? 'Cek API Key Engine' : 'Menunggu Engine'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Approval Mode Aktif</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                {APPROVAL_MODE_LABELS[settings?.approval_mode || 'manual_approval']}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Jadwal Terdekat (WIB)</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-200 truncate block">
                {overview?.next_scheduled_run?.next_run_at
                  ? formatDateId(overview.next_scheduled_run.next_run_at, true)
                  : `${counts?.active_schedules ?? 0} jadwal aktif`}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Quota */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kuota Generasi Harian</span>
              <Cpu size={16} className="text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white">{quota?.daily_used ?? 0}</span>
              <span className="text-sm text-zinc-500">/ {quota?.daily_limit ?? 20} artikel hari ini</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all ${quotaPct >= 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Sisa kuota aman hari ini: <strong>{quota?.remaining ?? 0}</strong> artikel.
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onNavigateSubtab('generate')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles size={14} /> Run Automation
            </button>
            <button
              onClick={() => onNavigateSubtab('batch')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Layers size={14} /> Queue
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Antrean Aktif',
            val: counts?.active_queue ?? 0,
            icon: Activity,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            target: 'batch'
          },
          {
            label: 'Butuh Review',
            val: counts?.awaiting_review ?? 0,
            icon: ShieldCheck,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            target: 'review'
          },
          {
            label: 'Terbit via AI',
            val: counts?.published_via_automation ?? 0,
            icon: FileCheck2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            target: 'published'
          },
          {
            label: 'Ditolak / Gagal',
            val: (counts?.rejected ?? 0) + (counts?.failed ?? 0),
            icon: XCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-200',
            target: 'review'
          },
          {
            label: 'Jadwal Aktif',
            val: `${counts?.active_schedules ?? 0}/${counts?.total_schedules ?? 0}`,
            icon: Clock,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
            target: 'scheduler'
          },
          {
            label: 'Saran SEO GSC',
            val: counts?.pending_seo_suggestions ?? 0,
            icon: TrendingUp,
            color: 'text-sky-600 bg-sky-50 border-sky-200',
            target: 'seo'
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateSubtab(card.target)}
              className="text-left p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 transition-all shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500">{card.label}</span>
                <span className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon size={13} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">{card.val}</div>
            </button>
          );
        })}
      </div>

      {/* Quality Averages + Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Rata-rata Skor Quality Audit</h4>
            <Bot size={16} className="text-blue-600" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'SEO Score', value: avg?.seo_score ?? 0, target: settings?.min_seo_score ?? 75 },
              { label: 'GEO AI Search Score', value: avg?.geo_score ?? 0, target: settings?.min_geo_score ?? 70 },
              { label: 'Skor Gabungan', value: avg?.composite_score ?? 0, target: settings?.min_composite_score ?? 74 }
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{row.label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {row.value} <span className="text-zinc-400 font-normal">(min {row.target})</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.value >= row.target ? 'bg-blue-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, row.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between text-xs text-zinc-500">
            <span>Total Blog Terbit: <strong>{counts?.total_blog_published ?? 0}</strong></span>
            <button
              onClick={() => onNavigateSubtab('settings')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Atur Threshold
            </button>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Riwayat Job Generasi Terbaru</h4>
            <button
              onClick={() => onNavigateSubtab('review')}
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Play size={12} /> Buka Antrean Review
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-400">
              Belum ada job generasi artikel. Mulai dari Automation Center atau AI Content Calendar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="py-2 pr-3 font-semibold">Judul Job</th>
                    <th className="py-2 px-2 font-semibold">Tipe</th>
                    <th className="py-2 px-2 font-semibold">Status</th>
                    <th className="py-2 px-2 font-semibold">Progres</th>
                    <th className="py-2 pl-2 font-semibold text-right">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentJobs.slice(0, 7).map((j) => (
                    <tr key={j.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 pr-3 font-medium text-zinc-800 dark:text-zinc-100 max-w-xs truncate">
                        {j.title}
                      </td>
                      <td className="py-2.5 px-2 uppercase font-mono text-[10px] text-zinc-500">{j.job_type}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                            JOB_STATUS_BADGE[j.status] || JOB_STATUS_BADGE.queued
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-zinc-600 dark:text-zinc-300">
                        {j.completed_items}/{j.total_items} selesai
                        {j.failed_items > 0 && <span className="text-rose-500 ml-1">({j.failed_items} gagal)</span>}
                      </td>
                      <td className="py-2.5 pl-2 text-right text-zinc-400 whitespace-nowrap">
                        {formatDateId(j.created_at, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

