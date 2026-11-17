import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Zap
} from 'lucide-react';
import {
  ApprovalMode,
  ContentPillar,
  DuplicateCheckResult,
  GenerationItem,
  GenerationJob,
  SearchIntent,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import notify from '../../../../lib/notify';
import { MultiPillarSelector } from './MultiPillarSelector';

interface AutomationGeneratorPanelsProps {
  mode: 'single' | 'batch';
  pillars: ContentPillar[];
  defaultApprovalMode: ApprovalMode;
  defaultWordCount: number;
  savedSelectedPillars?: string[];
  maxBatchSize?: number;
  remainingQuota?: number;
  onSaveDefaultPillars?: (codes: string[]) => Promise<void>;
  prefillTopic?: { topic: string; target_keyword?: string; pillar_code?: string; search_intent?: SearchIntent } | null;
  onJobCreated: () => void;
  onOpenReview: (itemId?: number) => void;
}

const ITEM_STAGE_COLORS: Record<string, string> = {
  queued: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  researching: 'bg-sky-50 text-sky-700 border-sky-200',
  generating: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  fetching_images: 'bg-cyan-50 text-cyan-700 border-cyan-200 animate-pulse',
  auditing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  awaiting_review: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  saved_draft: 'bg-teal-50 text-teal-700 border-teal-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-300',
  cancelled: 'bg-zinc-100 text-zinc-400 border-zinc-200'
};

const ARTICLE_COUNT_PRESETS = [1, 3, 5, 10];

export const AutomationGeneratorPanels: React.FC<AutomationGeneratorPanelsProps> = ({
  mode,
  pillars,
  defaultApprovalMode,
  defaultWordCount,
  savedSelectedPillars = [],
  maxBatchSize = 10,
  remainingQuota = 20,
  onSaveDefaultPillars,
  prefillTopic,
  onJobCreated,
  onOpenReview
}) => {
  const activePillars = pillars.filter((p) => Boolean(p.is_active));

  // Autonomous runner state
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [pillarsInitialized, setPillarsInitialized] = useState(false);
  const [articleCount, setArticleCount] = useState<number>(3);
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);
  const [savingDefault, setSavingDefault] = useState<boolean>(false);
  const [showDirective, setShowDirective] = useState<boolean>(false);
  const [showManualOverride, setShowManualOverride] = useState<boolean>(false);

  // Shared parameters
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [wordCount, setWordCount] = useState<number>(defaultWordCount || 1050);
  const [enableWebResearch, setEnableWebResearch] = useState<boolean>(false);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(defaultApprovalMode);
  const [customInstructions, setCustomInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Optional Manual Override state
  const [topic, setTopic] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [manualPillarCode, setManualPillarCode] = useState<string>(pillars[0]?.code || 'free-hosting-domain');
  const [searchIntent, setSearchIntent] = useState<SearchIntent>('commercial');
  const [dupResult, setDupResult] = useState<DuplicateCheckResult | null>(null);

  // Optional Manual Multi-Topic Batch state (in Queue mode)
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchTitle, setBatchTitle] = useState('Batch Manual Topik 1sLabs');
  const [batchTopicsText, setBatchTopicsText] = useState('');

  // Queue / Jobs Monitor state
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJobItems, setSelectedJobItems] = useState<GenerationItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const selectedJobIdRef = useRef<number | null>(selectedJobId);
  selectedJobIdRef.current = selectedJobId;

  useEffect(() => {
    setApprovalMode(defaultApprovalMode);
  }, [defaultApprovalMode]);

  useEffect(() => {
    if (defaultWordCount > 0) setWordCount(defaultWordCount);
  }, [defaultWordCount]);

  useEffect(() => {
    if (pillarsInitialized || activePillars.length === 0) return;
    if (savedSelectedPillars.length > 0) {
      const validSaved = savedSelectedPillars.filter((c) => activePillars.some((p) => p.code === c));
      setSelectedPillars(validSaved.length > 0 ? validSaved : activePillars.slice(0, 3).map((p) => p.code));
    } else {
      setSelectedPillars(activePillars.slice(0, 3).map((p) => p.code));
    }
    setPillarsInitialized(true);
  }, [activePillars, savedSelectedPillars, pillarsInitialized]);

  useEffect(() => {
    if (prefillTopic) {
      setTopic(prefillTopic.topic);
      setTargetKeyword(prefillTopic.target_keyword || prefillTopic.topic);
      if (prefillTopic.pillar_code) setManualPillarCode(prefillTopic.pillar_code);
      if (prefillTopic.search_intent) setSearchIntent(prefillTopic.search_intent);
      setShowManualOverride(true);
    }
  }, [prefillTopic]);

  useEffect(() => {
    if (!manualPillarCode && pillars.length > 0) {
      setManualPillarCode(pillars[0].code);
    }
  }, [pillars, manualPillarCode]);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await contentAutomationApi.listJobs({
        limit: 20,
        status: jobStatusFilter || undefined
      });
      setJobs(res.jobs || []);
      const activeOrFirst = res.jobs?.find((j) => j.status === 'running' || j.status === 'queued') || res.jobs?.[0];
      if (!selectedJobIdRef.current && activeOrFirst) {
        setSelectedJobId(activeOrFirst.id);
      } else if (res.jobs?.length && !res.jobs.some((j) => j.id === selectedJobIdRef.current)) {
        setSelectedJobId(res.jobs[0].id);
      }
    } catch {
      // handled silently
    } finally {
      setLoadingJobs(false);
    }
  }, [jobStatusFilter]);

  const loadJobItems = useCallback(async (jobId: number) => {
    try {
      const res = await contentAutomationApi.getJobDetails(jobId);
      setSelectedJobItems(res.items || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId) loadJobItems(selectedJobId);
  }, [selectedJobId, loadJobItems]);

  useEffect(() => {
    const hasRunning =
      jobs.some((j) => j.status === 'running' || j.status === 'queued') ||
      selectedJobItems.some((i) => ['queued', 'researching', 'generating', 'fetching_images', 'auditing'].includes(i.status));
    if (!hasRunning) return;

    const timer = setInterval(() => {
      loadJobs();
      if (selectedJobId) loadJobItems(selectedJobId);
    }, 3000);
    return () => clearInterval(timer);
  }, [jobs, selectedJobItems, selectedJobId, loadJobs, loadJobItems]);

  const handleSaveDefaultSelection = async (codes: string[]) => {
    if (!onSaveDefaultPillars) return;
    setSavingDefault(true);
    try {
      await onSaveDefaultPillars(codes);
      notify.success('Pilihan Content Pillar default tersimpan.');
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSavingDefault(false);
    }
  };

  const handleRunAutonomous = async () => {
    const safeCount = Math.max(1, Math.min(maxBatchSize || 10, Number(articleCount || 1)));
    setSubmitting(true);
    try {
      const res = await contentAutomationApi.runAutonomous({
        pillar_codes: selectedPillars,
        article_count: safeCount,
        approval_mode: approvalMode,
        language,
        word_count_target: wordCount,
        enable_web_research: enableWebResearch,
        custom_instructions: customInstructions.trim() || undefined,
        save_pillar_selection: saveAsDefault,
        use_ai: true
      });
      notify.success(
        `Automation #${res.job.id} dimulai! AI menyiapkan ${res.items.length} artikel dari ${res.selected_pillars.length} pillar.`
      );
      setSelectedJobId(res.job.id);
      await loadJobs();
      await loadJobItems(res.job.id);
      onJobCreated();
    } catch (err: unknown) {
      notify.error(getErrMsg(err, 'Gagal memulai autonomous automation.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!topic.trim()) return;
    try {
      const res = await contentAutomationApi.checkDuplicate({
        title: topic.trim(),
        focus_keyphrase: targetKeyword.trim() || topic.trim()
      });
      setDupResult(res.check);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 3) {
      notify.error('Masukkan topik artikel minimal 3 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await contentAutomationApi.generateManual({
        topic: topic.trim(),
        target_keyword: targetKeyword.trim() || topic.trim(),
        secondary_keywords: secondaryKeywords.trim(),
        pillar_code: manualPillarCode,
        search_intent: searchIntent,
        language,
        word_count_target: wordCount,
        enable_web_research: enableWebResearch,
        approval_mode: approvalMode,
        custom_instructions: customInstructions.trim()
      });
      notify.success(`Job Manual #${res.job.id} masuk antrean generasi.`);
      setSelectedJobId(res.job.id);
      await loadJobs();
      await loadJobItems(res.job.id);
      onJobCreated();
    } catch (err: unknown) {
      notify.error(getErrMsg(err, 'Gagal memulai generasi manual.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadSeedsToBatch = () => {
    const manualPillar = pillars.find((p) => p.code === manualPillarCode);
    const seeds = manualPillar?.sample_topics || [];
    if (seeds.length === 0) {
      notify.info('Pilar ini belum memiliki topik seed bawaan.');
      return;
    }
    const existingLines = batchTopicsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...existingLines, ...seeds]));
    setBatchTopicsText(merged.join('\n'));
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchTopicsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 3);
    if (lines.length === 0) {
      notify.error('Masukkan minimal 1 topik valid (1 topik per baris).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await contentAutomationApi.generateBatch({
        title: batchTitle.trim() || `Batch ${lines.length} Artikel`,
        pillar_code: manualPillarCode,
        search_intent: searchIntent,
        language,
        word_count_target: wordCount,
        enable_web_research: enableWebResearch,
        approval_mode: approvalMode,
        custom_instructions: customInstructions.trim(),
        topics: lines
      });
      notify.success(`Batch Job #${res.job.id} (${res.items.length} topik) mulai diproses di background.`);
      setBatchTopicsText('');
      setSelectedJobId(res.job.id);
      await loadJobs();
      await loadJobItems(res.job.id);
      onJobCreated();
    } catch (err: unknown) {
      notify.error(getErrMsg(err, 'Gagal membuat batch generation.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      await contentAutomationApi.cancelJob(jobId);
      notify.toast('Permintaan pembatalan job dikirim.');
      await loadJobs();
      if (selectedJobId === jobId) await loadJobItems(jobId);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleRetryItem = async (itemId: number) => {
    try {
      await contentAutomationApi.retryItem(itemId);
      notify.toast('Item dimasukkan kembali ke antrean.');
      if (selectedJobId) await loadJobItems(selectedJobId);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const pillarNameByCode = (code?: string | null) =>
    pillars.find((p) => p.code === code)?.name || code || 'Umum';

  const queueMonitorCard = (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            Monitor Antrean &amp; Progres Pipeline AI
          </h3>
          <p className="text-xs text-zinc-500">
            Tahapan real-time: queued -&gt; researching -&gt; generating -&gt; fetching_images -&gt; auditing -&gt; review/publish.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={jobStatusFilter}
            onChange={(e) => setJobStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
          >
            <option value="">Semua Status</option>
            <option value="running">Sedang Berjalan</option>
            <option value="queued">Dalam Antrean</option>
            <option value="completed">Selesai</option>
            <option value="partial_failed">Sebagian Gagal</option>
          </select>
          <button
            onClick={() => {
              loadJobs();
              if (selectedJobId) loadJobItems(selectedJobId);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
          >
            <RefreshCw size={12} className={loadingJobs ? 'animate-spin' : ''} /> Muat Ulang
          </button>
        </div>
      </div>

      {/* Job Selector Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {jobs.length === 0 ? (
          <p className="text-xs text-zinc-400 py-2">Belum ada job generasi artikel.</p>
        ) : (
          jobs.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedJobId(j.id)}
              className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer max-w-[240px] ${
                selectedJobId === j.id
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                <span className="font-mono text-blue-600">#{j.id}</span>
                <span className="truncate">{j.title}</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <span className="uppercase font-mono">{j.job_type}</span>
                <span>•</span>
                <span>{j.status}</span>
                <span>•</span>
                <span>
                  {j.completed_items}/{j.total_items}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected Job Items */}
      {selectedJobId && (
        <div className="space-y-2.5 flex-1">
          {jobs.find((j) => j.id === selectedJobId && ['queued', 'running'].includes(j.status)) && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> Job #{selectedJobId} sedang diproses oleh worker.
              </span>
              <button
                onClick={() => handleCancelJob(selectedJobId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 cursor-pointer"
              >
                <Square size={11} /> Batalkan
              </button>
            </div>
          )}

          {selectedJobItems.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">Belum ada item dalam job terpilih.</p>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {selectedJobItems.map((it) => (
                <div
                  key={it.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${
                          ITEM_STAGE_COLORS[it.status] || ITEM_STAGE_COLORS.queued
                        }`}
                      >
                        {it.status}
                      </span>
                      {it.pillar_code && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                          {pillarNameByCode(it.pillar_code)}
                        </span>
                      )}
                      {Number(it.regeneration_attempts || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                          <RotateCcw size={9} /> Regen {it.regeneration_attempts}x
                        </span>
                      )}
                      <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                        {it.draft_title || it.topic}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Keyword: <span className="font-mono">{it.target_keyword}</span>
                      {it.composite_score > 0 && (
                        <span className="ml-2 text-blue-600 font-semibold">
                          • Skor {it.composite_score} (SEO {it.seo_score} | Read {it.readability_score} | GEO {it.geo_score})
                        </span>
                      )}
                    </p>
                    {it.error_message && <p className="text-[11px] text-rose-600">{it.error_message}</p>}
                    {it.review_notes && !it.error_message && (
                      <p className="text-[11px] text-zinc-500 italic">{it.review_notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(it.status === 'failed' || it.status === 'cancelled') && (
                      <button
                        onClick={() => handleRetryItem(it.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
                      >
                        Coba Ulang
                      </button>
                    )}
                    {it.draft_content && (
                      <button
                        onClick={() => onOpenReview(it.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold cursor-pointer"
                      >
                        Tinjau Draf
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Generation Queue View (`mode === 'batch'`)
  if (mode === 'batch') {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">{queueMonitorCard}</div>

        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Batch Manual Multi-Topik</h3>
                  <p className="text-[11px] text-zinc-500">Opsional jika sudah menyiapkan daftar topik sendiri.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchForm((v) => !v)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {showBatchForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showBatchForm ? 'Tutup' : 'Buka Form'}
              </button>
            </div>

            {showBatchForm && (
              <form onSubmit={handleBatchSubmit} className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-semibold mb-1">Pilar Target</label>
                  <select
                    value={manualPillarCode}
                    onChange={(e) => {
                      const next = e.target.value;
                      setManualPillarCode(next);
                      const p = pillars.find((x) => x.code === next);
                      if (p) setSearchIntent(p.default_intent);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  >
                    {pillars.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Batch Job</label>
                  <input
                    type="text"
                    value={batchTitle}
                    onChange={(e) => setBatchTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Daftar Topik (1 per baris)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSeedsToBatch}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        <Plus size={11} /> Seed Pilar
                      </button>
                      {batchTopicsText && (
                        <button
                          type="button"
                          onClick={() => setBatchTopicsText('')}
                          className="text-[11px] text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={batchTopicsText}
                    onChange={(e) => setBatchTopicsText(e.target.value)}
                    placeholder="Judul artikel 1&#10;Judul artikel 2"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Mode Publikasi</label>
                  <select
                    value={approvalMode}
                    onChange={(e) => setApprovalMode(e.target.value as ApprovalMode)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  >
                    <option value="manual_approval">Manual Approval</option>
                    <option value="auto_publish_qualified">Auto Publish Jika Lolos Quality Gate</option>
                    <option value="always_save_draft">Simpan Selalu Sebagai Draft</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Kirim Batch ke Antrean
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Primary Autonomous Automation Center (`mode === 'single'`)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left: One-Click Autonomous Automation Center */}
      <div className="xl:col-span-7 space-y-4">
        <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  Autonomous AI Content Automation Center
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pilih content pillar dan jumlah artikel, lalu klik <strong>Run Automation</strong>. AI menentukan topik unik, riset keyword, outline, hingga optimasi SEO/GEO secara otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Multiple Content Pillar Selection */}
          <MultiPillarSelector
            pillars={pillars}
            selectedCodes={selectedPillars}
            onChange={setSelectedPillars}
            onSaveDefault={onSaveDefaultPillars ? handleSaveDefaultSelection : undefined}
            savingDefault={savingDefault}
            title="1. Pilih Content Pillar (Multi-Select)"
            subtitle="Pilih satu, beberapa, atau seluruh pilar. Distribusi topik akan diseimbangkan ke pilar yang dipilih."
          />

          {/* Step 2: Target Count & Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  2. Jumlah Artikel Otomatis
                </label>
                <span className="text-[11px] text-zinc-500">
                  Sisa kuota: <strong>{remainingQuota}</strong> • Maks batch {maxBatchSize}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {ARTICLE_COUNT_PRESETS.filter((n) => n <= Math.max(10, maxBatchSize)).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setArticleCount(Math.min(maxBatchSize, preset))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      articleCount === preset
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-300'
                    }`}
                  >
                    {preset} Artikel
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500">Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={maxBatchSize}
                    value={articleCount}
                    onChange={(e) => setArticleCount(Math.max(1, Math.min(maxBatchSize, Number(e.target.value) || 1)))}
                    className="w-16 px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                3. Kebijakan Publikasi
              </label>
              <select
                value={approvalMode}
                onChange={(e) => setApprovalMode(e.target.value as ApprovalMode)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-medium"
              >
                <option value="manual_approval">Manual Approval (Masuk Antrean Review)</option>
                <option value="auto_publish_qualified">Auto Publish Jika Lolos Quality Gate</option>
                <option value="always_save_draft">Simpan Selalu Sebagai Draft CMS</option>
              </select>
            </div>
          </div>

          {/* Language, Word Count & Switches */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Bahasa</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              >
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Target Panjang
              </label>
              <input
                type="number"
                min={600}
                max={3000}
                step={50}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableWebResearch}
                onChange={(e) => setEnableWebResearch(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600"
              />
              <span>Web Research</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600"
              />
              <span>Simpan Default</span>
            </label>
          </div>

          {/* Optional Directive Accordion */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <button
              type="button"
              onClick={() => setShowDirective((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-blue-600 cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              {showDirective ? 'Sembunyikan Arahan Khusus AI (Opsional)' : 'Tambahkan Arahan Khusus AI (Opsional)'}
              {showDirective ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showDirective && (
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Opsional: Misal tonjolkan sudut pandang ROI bagi UMKM atau sertakan studi kasus arsitektur API..."
                className="w-full mt-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              />
            )}
          </div>

          {/* Big Primary One-Click Action Button */}
          <button
            type="button"
            onClick={handleRunAutonomous}
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} fill="currentColor" />}
            Run Automation ({articleCount} Artikel Otomatis)
          </button>
        </div>

        {/* Collapsible Optional Manual Topic Override (Zero Requirement by Default) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <button
            type="button"
            onClick={() => setShowManualOverride((v) => !v)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                Override Topik Manual (Opsional)
              </h4>
              <p className="text-[11px] text-zinc-500">
                Gunakan hanya bila ingin menentukan judul/keyword spesifik dari hasil riset Content Strategy.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">
              {showManualOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showManualOverride ? 'Tutup' : 'Buka'}
            </span>
          </button>

          {showManualOverride && (
            <form onSubmit={handleManualSubmit} className="space-y-3 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Pilar Target</label>
                  <select
                    value={manualPillarCode}
                    onChange={(e) => {
                      const next = e.target.value;
                      setManualPillarCode(next);
                      const p = pillars.find((x) => x.code === next);
                      if (p) setSearchIntent(p.default_intent);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  >
                    {pillars.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Search Intent</label>
                  <select
                    value={searchIntent}
                    onChange={(e) => setSearchIntent(e.target.value as SearchIntent)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  >
                    <option value="informational">Informational</option>
                    <option value="commercial">Commercial</option>
                    <option value="transactional">Transactional</option>
                    <option value="navigational">Navigational</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">Judul / Topik Spesifik</label>
                  <button
                    type="button"
                    onClick={handleCheckDuplicate}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    <SearchCheck size={12} /> Cek Duplikasi
                  </button>
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setDupResult(null);
                  }}
                  placeholder="Masukkan topik khusus hanya jika tidak menggunakan mode otomatis..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                  required
                />
                {dupResult && (
                  <div
                    className={`mt-1.5 p-2 rounded-lg text-[11px] border flex items-center gap-1.5 ${
                      dupResult.exact_slug_conflict || dupResult.similarity_score >= 0.72
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {dupResult.exact_slug_conflict || dupResult.similarity_score >= 0.72 ? (
                      <AlertCircle size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>
                      Kemiripan {Math.round((dupResult.similarity_score || 0) * 100)}%
                      {dupResult.matched_title ? ` dengan "${dupResult.matched_title}"` : ' (Aman & Unik)'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  placeholder="Focus Keyphrase (opsional)"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                />
                <input
                  type="text"
                  value={secondaryKeywords}
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                  placeholder="Keyword sekunder (dipisah koma)"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Sparkles size={13} /> Generate Topik Spesifik Ini
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right: Real-Time Queue Monitor */}
      <div className="xl:col-span-5">{queueMonitorCard}</div>
    </div>
  );
};
