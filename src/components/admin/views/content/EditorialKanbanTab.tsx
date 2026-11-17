import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Kanban,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  Edit3,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  User
} from 'lucide-react';
import {
  blogApi,
  type ArticlePriority,
  type ArticleStatus,
  type BlogArticle,
  type BlogAuthor,
  type BlogCategory
} from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';
import {
  PRIORITY_META,
  STATUS_META,
  ScorePill,
  StatusBadge,
  formatDateId,
  toDatetimeLocalValue
} from './blogUiUtils';

interface EditorialKanbanTabProps {
  onOpenEditor: (articleId?: number | null) => void;
}

const KANBAN_COLUMNS: ArticleStatus[] = [
  'ideas',
  'draft',
  'in_review',
  'needs_revision',
  'scheduled',
  'published'
];

export const EditorialKanbanTab: React.FC<EditorialKanbanTabProps> = ({ onOpenEditor }) => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // HTML5 Drag & Drop state
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ArticleStatus | null>(null);

  // Calendar month cursor
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Card Detail Popup Modal
  const [selectedCard, setSelectedCard] = useState<BlogArticle | null>(null);
  const [cardStatus, setCardStatus] = useState<ArticleStatus>('draft');
  const [cardPriority, setCardPriority] = useState<ArticlePriority>('medium');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardPublishedAt, setCardPublishedAt] = useState('');
  const [cardAuthorName, setCardAuthorName] = useState('');
  const [cardNotes, setCardNotes] = useState('');
  const [savingCard, setSavingCard] = useState(false);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, catRes, authRes] = await Promise.all([
        blogApi.getAdminPosts({ limit: 150, sort: 'updated_desc' }),
        blogApi.getCategories().catch(() => ({ categories: [] })),
        blogApi.getAuthors().catch(() => ({ authors: [] }))
      ]);
      setArticles(postRes.articles || []);
      setCategories(catRes.categories || []);
      setAuthors(authRes.authors || []);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat papan editorial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const openCardModal = (art: BlogArticle) => {
    setSelectedCard(art);
    setCardStatus(art.status);
    setCardPriority(art.priority || 'medium');
    setCardDueDate(art.due_date ? String(art.due_date).slice(0, 10) : '');
    setCardPublishedAt(toDatetimeLocalValue(art.published_at));
    setCardAuthorName(art.author_name || 'Tim Editorial 1sLabs');
    setCardNotes(art.editorial_notes || '');
  };

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (categoryFilter !== 'all' && String(a.category_id) !== categoryFilter) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.focus_keyphrase || '').toLowerCase().includes(q) ||
          (a.author_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, categoryFilter, priorityFilter, search]);

  const handleDropToColumn = async (targetStatus: ArticleStatus) => {
    setDragOverCol(null);
    if (!draggedId) return;
    const item = articles.find((a) => a.id === draggedId);
    setDraggedId(null);
    if (!item || item.status === targetStatus) return;

    if (targetStatus === 'scheduled' && !item.published_at) {
      // Prompt user via detail modal so scheduled datetime is properly supplied
      openCardModal({ ...item, status: 'scheduled' });
      setCardStatus('scheduled');
      notify.info('Atur tanggal & jam publikasi untuk memindahkan kartu ke kolom Terjadwal.');
      return;
    }

    const previousSnapshot = [...articles];
    setArticles((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: targetStatus } : a)));

    try {
      const res = await blogApi.updatePostStatus(item.id, { status: targetStatus });
      setArticles((prev) => prev.map((a) => (a.id === item.id ? res.article : a)));
      notify.toast(`"${item.title.slice(0, 32)}..." dipindah ke ${STATUS_META[targetStatus].label}`);
    } catch (err: any) {
      setArticles(previousSnapshot);
      notify.error(err.message || 'Gagal memperbarui status kartu.');
    }
  };

  const handleSaveCardDetail = async (overrideStatus?: ArticleStatus) => {
    if (!selectedCard) return;
    const nextStatus = overrideStatus || cardStatus;
    if (nextStatus === 'scheduled' && !cardPublishedAt) {
      notify.warning('Jadwal terbit (tanggal & jam) wajib diisi untuk status Terjadwal.');
      return;
    }
    setSavingCard(true);
    try {
      const matchedAuthor = authors.find((au) => au.name === cardAuthorName);
      const res = await blogApi.updatePostStatus(selectedCard.id, {
        status: nextStatus,
        priority: cardPriority,
        due_date: cardDueDate || null,
        published_at: cardPublishedAt ? new Date(cardPublishedAt).toISOString() : null,
        author_name: cardAuthorName,
        author_id: matchedAuthor?.id ?? selectedCard.author_id ?? null,
        editorial_notes: cardNotes
      });
      setArticles((prev) => prev.map((a) => (a.id === selectedCard.id ? res.article : a)));
      setSelectedCard(res.article);
      notify.success('Detail kartu editorial disimpan.');
      if (overrideStatus === 'published') setSelectedCard(null);
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan detail kartu.');
    } finally {
      setSavingCard(false);
    }
  };

  // Calendar Grid Helpers
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; iso: string }> = [];
    for (let i = 0; i < firstDayWeekday; i++) cells.push({ date: null, iso: `empty-start-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const pad = (n: number) => String(n).padStart(2, '0');
      const iso = `${year}-${pad(month + 1)}-${pad(d)}`;
      cells.push({ date: dt, iso });
    }
    return cells;
  }, [calMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, BlogArticle[]>();
    for (const art of filtered) {
      const targetIso =
        (art.status === 'scheduled' || art.status === 'published') && art.published_at
          ? new Date(art.published_at).toISOString().slice(0, 10)
          : art.due_date
            ? String(art.due_date).slice(0, 10)
            : null;
      if (!targetIso) continue;
      const list = map.get(targetIso) || [];
      list.push(art);
      map.set(targetIso, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1.5">
            <Kanban size={13} />
            Editorial Workflow &amp; Content Calendar
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Pipeline Produksi Konten 1sLabs</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Seret kartu antar kolom untuk memindah status alur kerja, atau klik kartu untuk melihat &amp; menyunting detail editorial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'kanban' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm' : 'text-zinc-500'
              }`}
            >
              <Kanban size={14} /> Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'calendar' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm' : 'text-zinc-500'
              }`}
            >
              <CalendarIcon size={14} /> Kalender Terbit
            </button>
          </div>
          <button
            type="button"
            onClick={() => onOpenEditor(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
          >
            <Plus size={15} /> Artikel Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul artikel, keyphrase, penulis..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
        >
          <option value="all">Semua Prioritas</option>
          {(Object.keys(PRIORITY_META) as ArticlePriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_META[p].label}</option>
          ))}
        </select>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-6 gap-3.5 min-w-[1260px]">
            {KANBAN_COLUMNS.map((colStatus) => {
              const colMeta = STATUS_META[colStatus];
              const colItems = filtered.filter((a) => a.status === colStatus);
              const isDropTarget = dragOverCol === colStatus;

              return (
                <div
                  key={colStatus}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== colStatus) setDragOverCol(colStatus);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => handleDropToColumn(colStatus)}
                  className={`rounded-2xl border p-3 flex flex-col min-h-[540px] transition-colors ${
                    isDropTarget
                      ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/30 dark:border-blue-600'
                      : 'bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between px-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colMeta.dot}`} />
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                        {colMeta.label}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {loading && articles.length === 0 ? (
                      <div className="py-10 text-center text-[11px] text-zinc-400">Memuat...</div>
                    ) : colItems.length === 0 ? (
                      <div className="py-10 text-center text-[11px] text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                        Belum ada artikel di kolom ini
                      </div>
                    ) : (
                      colItems.map((art) => {
                        const prio = PRIORITY_META[art.priority || 'medium'];
                        return (
                          <div
                            key={art.id}
                            draggable
                            onDragStart={() => setDraggedId(art.id)}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setDragOverCol(null);
                            }}
                            onClick={() => openCardModal(art)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${prio.badge}`}>
                                {prio.label}
                              </span>
                              {art.category_name && (
                                <span className="text-[10px] font-medium text-zinc-500 truncate max-w-[110px]">
                                  {art.category_name}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                              {art.title}
                            </h4>

                            {art.focus_keyphrase && (
                              <p className="text-[10px] font-mono text-blue-600 truncate">
                                KW: {art.focus_keyphrase}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 pt-0.5">
                              <ScorePill label="SEO" score={art.seo_score} />
                              <ScorePill label="GEO" score={art.geo_score} />
                            </div>

                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                              <span className="inline-flex items-center gap-1 truncate max-w-[110px]">
                                <User size={10} /> {art.author_name}
                              </span>
                              {(art.due_date || art.published_at) && (
                                <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                  <Clock size={10} />
                                  {formatDateId(art.status === 'scheduled' || art.status === 'published' ? art.published_at || art.due_date : art.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CONTENT CALENDAR VIEW */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              {calMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-bold text-zinc-500 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100 dark:divide-zinc-800">
            {calendarDays.map((cell) => {
              if (!cell.date) {
                return <div key={cell.iso} className="min-h-[108px] bg-zinc-50/40 dark:bg-zinc-950/30" />;
              }
              const items = eventsByDate.get(cell.iso) || [];
              const isToday = cell.iso === new Date().toISOString().slice(0, 10);

              return (
                <div key={cell.iso} className={`min-h-[108px] p-2 space-y-1 ${isToday ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                  <div className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-zinc-500'}`}>
                    {cell.date.getDate()}
                  </div>
                  {items.map((art) => {
                    const meta = STATUS_META[art.status];
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => openCardModal(art)}
                        className={`w-full text-left px-2 py-1 rounded-md border text-[11px] font-medium line-clamp-2 ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        {art.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLICKABLE KANBAN CARD DETAIL MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedCard.status} />
                  {selectedCard.category_name && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 text-xs font-medium">
                      {selectedCard.category_name}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug pt-1">
                  {selectedCard.title}
                </h3>
                <p className="text-xs font-mono text-zinc-500">/blog/{selectedCard.slug}</p>
              </div>
              <button type="button" onClick={() => setSelectedCard(null)} className="p-1.5 rounded-lg hover:bg-zinc-200/70 text-zinc-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 text-center">
                  <div className="text-zinc-500">SEO</div>
                  <div className="text-lg font-extrabold text-blue-600">{selectedCard.seo_score}</div>
                </div>
                <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 text-center">
                  <div className="text-zinc-500">Readability</div>
                  <div className="text-lg font-extrabold text-zinc-800 dark:text-white">{selectedCard.readability_score}</div>
                </div>
                <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 text-center">
                  <div className="text-zinc-500">GEO Ready</div>
                  <div className="text-lg font-extrabold text-indigo-600">{selectedCard.geo_score}</div>
                </div>
                <div className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/40 text-center">
                  <div className="text-zinc-500">Waktu Baca</div>
                  <div className="text-lg font-extrabold text-zinc-800 dark:text-white">{selectedCard.reading_time} mnt</div>
                </div>
              </div>

              {selectedCard.excerpt && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {selectedCard.excerpt}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status Pipeline</label>
                  <select value={cardStatus} onChange={(e) => setCardStatus(e.target.value as ArticleStatus)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                    {KANBAN_COLUMNS.map((st) => (
                      <option key={st} value={st}>{STATUS_META[st].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Prioritas</label>
                  <select value={cardPriority} onChange={(e) => setCardPriority(e.target.value as ArticlePriority)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                    {(Object.keys(PRIORITY_META) as ArticlePriority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Author / PIC Editorial</label>
                  <select value={cardAuthorName} onChange={(e) => setCardAuthorName(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                    <option value="Tim Editorial 1sLabs">Tim Editorial 1sLabs</option>
                    {authors.map((au) => (
                      <option key={au.id} value={au.name}>{au.name} ({au.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Deadline Penulisan</label>
                  <input type="date" value={cardDueDate} onChange={(e) => setCardDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jadwal Terbit / Waktu Publikasi {cardStatus === 'scheduled' ? '*' : ''}
                  </label>
                  <input type="datetime-local" value={cardPublishedAt} onChange={(e) => setCardPublishedAt(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Catatan Editorial</label>
                  <textarea rows={3} value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} placeholder="Arahan revisi, catatan riset, atau komentar review..." className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedCard.id;
                    setSelectedCard(null);
                    onOpenEditor(id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                >
                  <Edit3 size={14} /> Buka di Artikel Editor
                </button>
                {selectedCard.status === 'published' && (
                  <a
                    href={`/blog/${selectedCard.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700"
                  >
                    <ExternalLink size={14} /> Lihat Live
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedCard.status !== 'published' && (
                  <button
                    type="button"
                    disabled={savingCard}
                    onClick={() => handleSaveCardDetail('published')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <Send size={14} /> Terbitkan Sekarang
                  </button>
                )}
                <button
                  type="button"
                  disabled={savingCard}
                  onClick={() => handleSaveCardDetail()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <Save size={14} /> {savingCard ? 'Menyimpan...' : 'Simpan Kartu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

