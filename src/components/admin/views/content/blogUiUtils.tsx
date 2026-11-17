import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileEdit,
  Eye,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import type { ArticlePriority, ArticleStatus } from '../../../../services/blogApi';

export const STATUS_META: Record<
  ArticleStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  ideas: {
    label: 'Ide Topik',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400'
  },
  draft: {
    label: 'Draft',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500'
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500'
  },
  needs_revision: {
    label: 'Perlu Revisi',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  scheduled: {
    label: 'Terjadwal',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-600'
  },
  published: {
    label: 'Terbit',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  }
};

export const PRIORITY_META: Record<ArticlePriority, { label: string; badge: string }> = {
  low: { label: 'Rendah', badge: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' },
  medium: { label: 'Sedang', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  high: { label: 'Tinggi', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  urgent: { label: 'Prioritas Utama', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800' }
};

export function getStatusIcon(status: ArticleStatus, size = 13) {
  switch (status) {
    case 'published':
      return <CheckCircle2 size={size} className="shrink-0" />;
    case 'scheduled':
      return <Clock size={size} className="shrink-0" />;
    case 'in_review':
      return <Eye size={size} className="shrink-0" />;
    case 'needs_revision':
      return <RotateCcw size={size} className="shrink-0" />;
    case 'ideas':
      return <Lightbulb size={size} className="shrink-0" />;
    default:
      return <FileEdit size={size} className="shrink-0" />;
  }
}

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}>
      {getStatusIcon(status, 12)}
      {meta.label}
    </span>
  );
}

export function getScoreTier(score: number) {
  const s = Number(score) || 0;
  if (s >= 75) {
    return {
      label: 'Baik',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400'
    };
  }
  if (s >= 50) {
    return {
      label: 'Perlu Optimasi',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400'
    };
  }
  return {
    label: 'Kurang',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400'
  };
}

export function ScorePill({ label, score }: { label: string; score: number }) {
  const tier = getScoreTier(score);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${tier.badge}`}>
      <span className="opacity-80">{label}</span>
      <span>{Number(score) || 0}</span>
    </span>
  );
}

export function CheckStatusIcon({ status }: { status: 'good' | 'warning' | 'problem' }) {
  if (status === 'good') return <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />;
  if (status === 'warning') return <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />;
}

export function formatDateId(dateStr?: string | null, withTime = false) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}

export function toDatetimeLocalValue(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

