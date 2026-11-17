import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Compass,
  Edit3,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Trash2,
  X
} from 'lucide-react';
import {
  ContentCalendarItem,
  ContentGapItem,
  ContentPillar,
  SearchIntent,
  TopicOpportunity,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import notify from '../../../../lib/notify';
import { MultiPillarSelector } from './MultiPillarSelector';

interface AutomationStrategyPanelProps {
  pillars: ContentPillar[];
  onRefreshPillars: () => void;
  onUseTopicInGenerator: (topic: {
    topic: string;
    target_keyword: string;
    pillar_code: string;
    search_intent: SearchIntent;
  }) => void;
}

const GAP_BADGE: Record<string, string> = {
  high_gap: 'bg-rose-50 text-rose-700 border-rose-200',
  growing: 'bg-amber-50 text-amber-700 border-amber-200',
  covered: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const GAP_LABEL: Record<string, string> = {
  high_gap: 'High Gap (Belum Terisi)',
  growing: 'Growing (<3 Artikel)',
  covered: 'Covered (Kuat)'
};

const CALENDAR_STATUS_BADGE: Record<string, string> = {
  planned: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  queued: 'bg-blue-50 text-blue-700 border-blue-200',
  generated: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  skipped: 'bg-zinc-100 text-zinc-400 border-zinc-200'
};

export const AutomationStrategyPanel: React.FC<AutomationStrategyPanelProps> = ({
  pillars,
  onRefreshPillars,
  onUseTopicInGenerator
}) => {
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [discoverCount, setDiscoverCount] = useState<number>(8);
  const [useAiDiscovery, setUseAiDiscovery] = useState<boolean>(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoverySource, setDiscoverySource] = useState<string>('');
  const [candidates, setCandidates] = useState<TopicOpportunity[]>([]);

  // Gap Analysis & Content Calendar
  const [gaps, setGaps] = useState<ContentGapItem[]>([]);
  const [calendar, setCalendar] = useState<ContentCalendarItem[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [generatingCal, setGeneratingCal] = useState(false);
  const [queueingSlotId, setQueueingSlotId] = useState<number | null>(null);
  const [calDays, setCalDays] = useState<number>(7);
  const [calPerDay, setCalPerDay] = useState<number>(1);
  const [replacePlanned, setReplacePlanned] = useState<boolean>(true);

  // Pillar edit modal
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [editWeight, setEditWeight] = useState(80);
  const [editCtaLabel, setEditCtaLabel] = useState('');
  const [editCtaPath, setEditCtaPath] = useState('');
  const [editActive, setEditActive] = useState(true);

  const loadStrategyIntelligence = useCallback(async () => {
    setLoadingCal(true);
    try {
      const [gRes, cRes] = await Promise.all([
        contentAutomationApi.getGapAnalysis(),
        contentAutomationApi.getCalendar({ limit: 42 })
      ]);
      setGaps(gRes.gaps || []);
      setCalendar(cRes.calendar || []);
    } catch {
      // handled silently on background refresh
    } finally {
      setLoadingCal(false);
    }
  }, []);

  useEffect(() => {
    loadStrategyIntelligence();
  }, [loadStrategyIntelligence]);

  const publishedCountsMap: Record<string, number> = {};
  for (const g of gaps) {
    publishedCountsMap[g.code] = g.published_count;
  }

  const handleSelectGapPillars = () => {
    const priorityGapCodes = gaps.filter((g) => g.gap_status !== 'covered').map((g) => g.code);
    if (priorityGapCodes.length === 0) {
      notify.info('Seluruh pilar sudah memiliki cakupan kuat.');
      return;
    }
    setSelectedPillars(priorityGapCodes);
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const res = await contentAutomationApi.discoverTopics({
        pillar_codes: selectedPillars,
        count: discoverCount,
        use_ai: useAiDiscovery,
        save_to_ideas: true
      });
      setCandidates(res.candidates || []);
      setDiscoverySource(res.source);
      notify.success(`Ditemukan ${res.candidates?.length || 0} peluang topik lintas pilar (${res.source}).`);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setDiscovering(false);
    }
  };

  const handleGenerateCalendar = async () => {
    setGeneratingCal(true);
    try {
      const res = await contentAutomationApi.generateCalendar({
        pillar_codes: selectedPillars,
        days: calDays,
        articles_per_day: calPerDay,
        replace_planned: replacePlanned,
        use_ai: useAiDiscovery
      });
      setCalendar(res.calendar || []);
      await loadStrategyIntelligence();
      notify.success(`AI Content Calendar dibuat: ${res.created_count} slot baru disusun (${res.source}).`);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setGeneratingCal(false);
    }
  };

  const handleQueueCalendarSlot = async (slot: ContentCalendarItem) => {
    setQueueingSlotId(slot.id);
    try {
      await contentAutomationApi.queueCalendarItem(slot.id);
      notify.success(`Slot "${slot.title}" dimasukkan ke antrean generasi AI.`);
      await loadStrategyIntelligence();
      onRefreshPillars();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setQueueingSlotId(null);
    }
  };

  const handleDeleteCalendarSlot = async (id: number) => {
    try {
      await contentAutomationApi.deleteCalendarItem(id);
      setCalendar((prev) => prev.filter((c) => c.id !== id));
      notify.toast('Slot kalender dihapus.');
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const openPillarEdit = (p: ContentPillar) => {
    setEditingPillar(p);
    setEditWeight(p.priority_weight);
    setEditCtaLabel(p.primary_cta_label);
    setEditCtaPath(p.primary_cta_path);
    setEditActive(Boolean(p.is_active));
  };

  const handleSavePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPillar) return;
    try {
      await contentAutomationApi.updatePillar(editingPillar.id, {
        priority_weight: editWeight,
        primary_cta_label: editCtaLabel,
        primary_cta_path: editCtaPath,
        is_active: editActive
      });
      notify.success('Konfigurasi pilar diperbarui.');
      setEditingPillar(null);
      onRefreshPillars();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const pillarName = (code: string) => pillars.find((p) => p.code === code)?.name || code;

  return (
    <div className="space-y-6">
      {/* 1. Content Gap Analysis */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Content Gap Analysis Across {pillars.length} Strategic Pillars
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mengukur pilar mana yang belum terisi agar strategi AI otomatis menutup kekosongan topik layanan 1sLabs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectGapPillars}
              className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold cursor-pointer"
            >
              Pilih Pilar High/Growing Gap
            </button>
            <button
              type="button"
              onClick={loadStrategyIntelligence}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw size={13} className={loadingCal ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {gaps.map((g) => {
            const pct = Math.min(100, Math.round((g.published_count / 5) * 100));
            return (
              <div
                key={g.code}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">{g.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${GAP_BADGE[g.gap_status]}`}>
                    {GAP_LABEL[g.gap_status]}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      g.gap_status === 'covered'
                        ? 'bg-emerald-500'
                        : g.gap_status === 'growing'
                          ? 'bg-blue-500'
                          : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{g.published_count} terbit</span>
                  <span>{g.queued_count} antrean</span>
                  <span>{g.planned_calendar_count} kalender</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Multi-Pillar Topic Discovery & Opportunity Scoring */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-blue-600" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Multi-Pillar Topic Discovery &amp; Opportunity Scoring
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Riset topik otomatis lintas beberapa pilar dengan deteksi kanibalisasi dan duplikasi terhadap artikel aktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={2}
              max={20}
              value={discoverCount}
              onChange={(e) => setDiscoverCount(Number(e.target.value))}
              className="w-16 px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              title="Jumlah topik"
            />
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 px-2">
              <input
                type="checkbox"
                checked={useAiDiscovery}
                onChange={(e) => setUseAiDiscovery(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600"
              />
              Pakai AI Engine
            </label>
            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {discovering ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Cari Peluang Topik
            </button>
          </div>
        </div>

        <MultiPillarSelector
          pillars={pillars}
          selectedCodes={selectedPillars}
          onChange={setSelectedPillars}
          compact
          publishedCounts={publishedCountsMap}
          title="Filter Pilar Strategi (Opsional)"
          subtitle="Pilih pilar target untuk Topic Discovery dan AI Content Calendar di bawah."
          emptyHint="Semua pilar aktif akan dianalisis secara merata."
        />

        {candidates.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400">
              Sumber riset: <strong>{discoverySource}</strong>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {candidates.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          Score: {c.opportunity_score}/100
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-semibold">
                          {pillarName(c.pillar_code)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          c.duplicate_risk === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : c.duplicate_risk === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {c.duplicate_risk === 'high' ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                        Duplikasi: {c.duplicate_risk} ({Math.round((c.similarity_score || 0) * 100)}%)
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">{c.title}</h4>
                    <p className="text-[11px] text-zinc-500">
                      Keyword: <span className="font-mono">{c.target_keyword}</span> • Intent:{' '}
                      <span className="capitalize">{c.search_intent}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">{c.rationale}</p>
                    {c.matched_existing_title && (
                      <p className="text-[10px] text-amber-600">Mirip dengan: {c.matched_existing_title}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() =>
                        onUseTopicInGenerator({
                          topic: c.title,
                          target_keyword: c.target_keyword,
                          pillar_code: c.pillar_code,
                          search_intent: c.search_intent || 'commercial'
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer"
                    >
                      <Plus size={12} /> Gunakan di Override Generator
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. AI Content Calendar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-600" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                AI Content Calendar Plan
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rencana terstruktur otomatis lintas hari dan pilar. Klik <strong>Antrekan AI</strong> pada slot mana pun untuk memproduksi artikelnya seketika.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={calDays}
              onChange={(e) => setCalDays(Number(e.target.value))}
              className="px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
            >
              <option value={3}>3 Hari</option>
              <option value={7}>7 Hari (1 Minggu)</option>
              <option value={14}>14 Hari (2 Minggu)</option>
            </select>
            <select
              value={calPerDay}
              onChange={(e) => setCalPerDay(Number(e.target.value))}
              className="px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
            >
              <option value={1}>1 Artikel / Hari</option>
              <option value={2}>2 Artikel / Hari</option>
            </select>
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={replacePlanned}
                onChange={(e) => setReplacePlanned(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600"
              />
              Reset Rencana Lama
            </label>
            <button
              type="button"
              onClick={handleGenerateCalendar}
              disabled={generatingCal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {generatingCal ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate AI Calendar
            </button>
          </div>
        </div>

        {calendar.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-400">
            Belum ada jadwal di AI Content Calendar. Klik <strong>Generate AI Calendar</strong> di atas untuk menyusun rencana mingguan otomatis.
          </div>
        ) : (
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {calendar.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-200 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                      {slot.day_label}, {slot.scheduled_date}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                      {slot.pillar_name || pillarName(slot.pillar_code)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${
                        CALENDAR_STATUS_BADGE[slot.status] || CALENDAR_STATUS_BADGE.planned
                      }`}
                    >
                      {slot.status}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Score {slot.priority_score}</span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white">{slot.title}</h4>
                  <p className="text-[11px] text-zinc-500">
                    Keyword: <span className="font-mono">{slot.target_keyword}</span>
                    {slot.target_audience && <span> • Audiens: {slot.target_audience}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {slot.status === 'planned' && (
                    <button
                      type="button"
                      disabled={queueingSlotId === slot.id}
                      onClick={() => handleQueueCalendarSlot(slot)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {queueingSlotId === slot.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} />
                      )}
                      Antrekan AI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteCalendarSlot(slot.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Hapus slot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Strategic Pillars Config Grid */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
          Konfigurasi {pillars.length} Content Pillars Layanan 1sLabs
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-blue-600">
                    <Target size={11} /> Bobot {p.priority_weight}
                  </span>
                  <button
                    onClick={() => openPillarEdit(p)}
                    className="text-xs text-zinc-400 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} /> Ubah
                  </button>
                </div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{p.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{p.description}</p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1 text-[11px]">
                <div className="text-zinc-600 dark:text-zinc-300">
                  CTA: <strong>{p.primary_cta_path}</strong> ({p.default_intent})
                </div>
                <div className="text-zinc-400 flex justify-between">
                  <span>Seed topik: {p.sample_topics?.length || 0}</span>
                  <span>{publishedCountsMap[p.code] ?? p.published_articles ?? 0} terbit</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPillar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePillar}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">{editingPillar.name}</h4>
              <button type="button" onClick={() => setEditingPillar(null)} className="cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Label CTA Utama</label>
              <input
                type="text"
                value={editCtaLabel}
                onChange={(e) => setEditCtaLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Path CTA Internal</label>
                <input
                  type="text"
                  value={editCtaPath}
                  onChange={(e) => setEditCtaPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Prioritas (1-100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editWeight}
                  onChange={(e) => setEditWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Pilar aktif dalam rotasi scheduler otomatis
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingPillar(null)} className="px-4 py-2 rounded-xl border text-xs cursor-pointer">
                Batal
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                <Save size={13} /> Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
