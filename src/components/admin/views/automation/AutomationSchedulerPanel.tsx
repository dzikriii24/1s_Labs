import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Edit3,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import {
  ApprovalMode,
  AutomationSchedule,
  AutomationScheduleRun,
  ContentPillar,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import { formatDateId } from '../content/blogUiUtils';
import notify from '../../../../lib/notify';
import { MultiPillarSelector } from './MultiPillarSelector';

interface AutomationSchedulerPanelProps {
  pillars: ContentPillar[];
  onRefreshOverview: () => void;
}

const CRON_PRESETS = [
  { label: 'Setiap Hari 08:00 WIB', expr: '0 8 * * *' },
  { label: 'Setiap Hari 07:00 WIB', expr: '0 7 * * *' },
  { label: 'Setiap Senin & Kamis 08:00 WIB', expr: '0 8 * * 1,4' },
  { label: 'Setiap Selasa & Jumat 09:00 WIB', expr: '0 9 * * 2,5' },
  { label: 'Hari Kerja (Senin-Jumat) 08:00 WIB', expr: '0 8 * * 1-5' }
];

const DAY_PATTERNS = [
  { label: 'Setiap Hari', dow: '*' },
  { label: 'Senin - Jumat (Hari Kerja)', dow: '1-5' },
  { label: 'Senin & Kamis', dow: '1,4' },
  { label: 'Selasa & Jumat', dow: '2,5' },
  { label: 'Senin, Rabu & Jumat', dow: '1,3,5' }
];

export const AutomationSchedulerPanel: React.FC<AutomationSchedulerPanelProps> = ({
  pillars,
  onRefreshOverview
}) => {
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [runs, setRuns] = useState<AutomationScheduleRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // Create / Edit Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpr, setCronExpr] = useState('0 8 * * *');
  const [timeHour, setTimeHour] = useState('08');
  const [timeMinute, setTimeMinute] = useState('00');
  const [dayPattern, setDayPattern] = useState('*');
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [articlesPerRun, setArticlesPerRun] = useState(2);
  const [approvalOverride, setApprovalOverride] = useState<string>('');
  const [enableWebResearch, setEnableWebResearch] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        contentAutomationApi.listSchedules(),
        contentAutomationApi.listScheduleRuns()
      ]);
      setSchedules(sRes.schedules || []);
      setRuns(rRes.runs || []);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const syncTimeToCron = (hh: string, mm: string, dow: string) => {
    const cleanMin = String(Math.max(0, Math.min(59, Number(mm) || 0)));
    const cleanHr = String(Math.max(0, Math.min(23, Number(hh) || 0)));
    setCronExpr(`${cleanMin} ${cleanHr} * * ${dow || '*'}`);
  };

  const openCreateForm = () => {
    setEditingScheduleId(null);
    setName('');
    setDescription('');
    setTimeHour('08');
    setTimeMinute('00');
    setDayPattern('*');
    setCronExpr('0 8 * * *');
    setSelectedPillars([]);
    setArticlesPerRun(2);
    setApprovalOverride('');
    setEnableWebResearch(false);
    setShowForm(true);
  };

  const openEditForm = (s: AutomationSchedule) => {
    setEditingScheduleId(s.id);
    setName(s.name);
    setDescription(s.description || '');
    setCronExpr(s.cron_expression);
    const parts = String(s.cron_expression || '0 8 * * *').trim().split(/\s+/);
    if (parts.length === 5 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      setTimeMinute(parts[0].padStart(2, '0'));
      setTimeHour(parts[1].padStart(2, '0'));
      setDayPattern(parts[4] || '*');
    }
    setSelectedPillars(
      Array.isArray(s.pillar_codes) && s.pillar_codes.length > 0
        ? s.pillar_codes
        : s.pillar_code
          ? [s.pillar_code]
          : []
    );
    setArticlesPerRun(s.articles_per_run);
    setApprovalOverride(s.approval_mode_override || '');
    setEnableWebResearch(Boolean(s.enable_web_research));
    setShowForm(true);
  };

  const handleToggleActive = async (s: AutomationSchedule) => {
    try {
      await contentAutomationApi.updateSchedule(s.id, { is_active: !s.is_active });
      notify.success(`Jadwal '${s.name}' ${!s.is_active ? 'diaktifkan' : 'dijeda'}.`);
      await loadAll();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleRunNow = async (s: AutomationSchedule) => {
    try {
      const res = await contentAutomationApi.runScheduleNow(s.id);
      notify.success(res.message || 'Eksekusi jadwal dimulai.');
      setTimeout(loadAll, 1500);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<AutomationSchedule> = {
        name: name.trim(),
        description: description.trim() || undefined,
        cron_expression: cronExpr.trim(),
        pillar_codes: selectedPillars,
        pillar_code: selectedPillars[0] || null,
        articles_per_run: articlesPerRun,
        approval_mode_override: (approvalOverride || null) as ApprovalMode | null,
        enable_web_research: enableWebResearch
      };

      if (editingScheduleId) {
        await contentAutomationApi.updateSchedule(editingScheduleId, payload);
        notify.success('Konfigurasi jadwal berhasil diperbarui.');
      } else {
        await contentAutomationApi.createSchedule({ ...payload, is_active: false });
        notify.success('Jadwal baru ditambahkan (status awal: Dijeda agar aman sebelum diaktifkan).');
      }
      setShowForm(false);
      setEditingScheduleId(null);
      await loadAll();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const handleDelete = async (s: AutomationSchedule) => {
    const ok = await notify.confirm({
      title: `Hapus Jadwal '${s.name}'?`,
      text: 'Riwayat run untuk jadwal ini juga akan dihapus.',
      confirmButtonText: 'Hapus',
      isDanger: true
    });
    if (!ok) return;
    try {
      await contentAutomationApi.deleteSchedule(s.id);
      notify.toast('Jadwal dihapus.');
      await loadAll();
      onRefreshOverview();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    }
  };

  const getPillarNames = (s: AutomationSchedule) => {
    const codes =
      Array.isArray(s.pillar_codes) && s.pillar_codes.length > 0
        ? s.pillar_codes
        : s.pillar_code
          ? [s.pillar_code]
          : [];
    if (codes.length === 0) return ['Semua Pilar Aktif'];
    return codes.map((c) => pillars.find((p) => p.code === c)?.name || c);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Autonomous Multi-Pillar Scheduler (Asia/Jakarta)
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Setiap jadwal mendukung pemilihan beberapa Content Pillar sekaligus, distribusi seimbang, pemeriksaan kuota harian, dan kunci konkurensi database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Muat Ulang
          </button>
          <button
            onClick={openCreateForm}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSaveSchedule}
          className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
              {editingScheduleId ? 'Edit Jadwal Otomatis' : 'Buat Jadwal Otomatis Baru (Zona Asia/Jakarta)'}
            </h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Nama Jadwal</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mis. Publikasi Harian Multi-Pillar 1sLabs"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Preset Jadwal Cepat</label>
              <select
                value=""
                onChange={(e) => e.target.value && setCronExpr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              >
                <option value="">Pilih preset waktu WIB...</option>
                {CRON_PRESETS.map((pr) => (
                  <option key={pr.expr} value={pr.expr}>
                    {pr.label} ({pr.expr})
                  </option>
                ))}
              </select>
            </div>

            {/* WIB Time Picker */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Jam (WIB)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={Number(timeHour)}
                  onChange={(e) => {
                    const hh = String(Math.max(0, Math.min(23, Number(e.target.value) || 0))).padStart(2, '0');
                    setTimeHour(hh);
                    syncTimeToCron(hh, timeMinute, dayPattern);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Menit</label>
                <select
                  value={timeMinute}
                  onChange={(e) => {
                    setTimeMinute(e.target.value);
                    syncTimeToCron(timeHour, e.target.value, dayPattern);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Pola Hari</label>
                <select
                  value={dayPattern}
                  onChange={(e) => {
                    setDayPattern(e.target.value);
                    syncTimeToCron(timeHour, timeMinute, e.target.value);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                >
                  {DAY_PATTERNS.map((dp) => (
                    <option key={dp.dow} value={dp.dow}>
                      {dp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Cron Expression (5-field)</label>
              <input
                type="text"
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-mono bg-white dark:bg-zinc-950"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Artikel per Eksekusi</label>
              <input
                type="number"
                min={1}
                max={10}
                value={articlesPerRun}
                onChange={(e) => setArticlesPerRun(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Override Kebijakan Publikasi</label>
              <select
                value={approvalOverride}
                onChange={(e) => setApprovalOverride(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              >
                <option value="">Ikuti Pengaturan Global</option>
                <option value="manual_approval">Manual Approval</option>
                <option value="auto_publish_qualified">Auto Publish Jika Lolos Quality Gate</option>
                <option value="always_save_draft">Always Save Draft</option>
              </select>
            </div>
          </div>

          {/* Multi-Pillar Selector Inside Schedule */}
          <MultiPillarSelector
            pillars={pillars}
            selectedCodes={selectedPillars}
            onChange={setSelectedPillars}
            compact
            title="Content Pillar Target Jadwal Ini (Multi-Select)"
            subtitle="Jadwal ini hanya membuat artikel dari pilar yang dicentang, terdistribusi seimbang."
            emptyHint="Jika dikosongkan, jadwal otomatis merotasi ke seluruh pillar layanan aktif."
          />

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={enableWebResearch}
              onChange={(e) => setEnableWebResearch(e.target.checked)}
              className="rounded border-zinc-300 text-blue-600"
            />
            Aktifkan riset web ringan pada jadwal ini
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">
              {editingScheduleId ? 'Simpan Perubahan' : 'Simpan Jadwal Baru'}
            </button>
          </div>
        </form>
      )}

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((s) => {
          const isFailure = String(s.last_run_status || '').includes('fail');
          const pillarNames = getPillarNames(s);
          return (
            <div
              key={s.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {s.is_active ? 'Aktif' : 'Dijeda'}
                    </span>
                    {s.is_locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                        <Lock size={10} /> Sedang Dieksekusi
                      </span>
                    )}
                    {isFailure && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold">
                        <AlertTriangle size={10} /> Run Terakhir: {s.last_run_status}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-zinc-400">
                      {s.cron_expression} ({s.timezone})
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-1.5">{s.name}</h4>
                  {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditForm(s)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                    title="Edit jadwal"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Hapus jadwal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {pillarNames.map((pName) => (
                    <span
                      key={pName}
                      className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold"
                    >
                      {pName}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/70 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Volume per Eksekusi</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {s.articles_per_run} artikel/run
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Run Berikutnya (WIB)</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {s.is_active && (s.next_run_preview || s.next_run_at)
                        ? formatDateId(s.next_run_preview || s.next_run_at, true)
                        : 'Dijeda'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">
                  Terakhir: {s.last_run_at ? `${formatDateId(s.last_run_at, true)} (${s.last_run_status})` : 'Belum pernah'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      s.is_active
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {s.is_active ? (
                      <>
                        <Pause size={12} /> Jeda
                      </>
                    ) : (
                      <>
                        <Play size={12} /> Aktifkan
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRunNow(s)}
                    disabled={s.is_locked}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Zap size={12} /> Jalankan Sekarang
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Run History */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-3">Log Eksekusi Scheduler</h4>
        {runs.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">Belum ada riwayat eksekusi jadwal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="py-2 pr-3 font-semibold">Jadwal</th>
                  <th className="py-2 px-2 font-semibold">Pemicu</th>
                  <th className="py-2 px-2 font-semibold">Status</th>
                  <th className="py-2 px-2 font-semibold">Direncanakan / Berhasil / Terbit</th>
                  <th className="py-2 pl-2 font-semibold text-right">Mulai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {r.schedule_name || `#${r.schedule_id}`}
                    </td>
                    <td className="py-2.5 px-2 uppercase font-mono text-[10px] text-zinc-500">{r.trigger_type}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'skipped_locked'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : r.status === 'running'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                      {r.error_message && <p className="text-[11px] text-rose-500 mt-0.5">{r.error_message}</p>}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-600">
                      {r.topics_planned} topik • {r.items_succeeded} sukses • {r.items_published} terbit
                    </td>
                    <td className="py-2.5 pl-2 text-right text-zinc-400">{formatDateId(r.started_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
