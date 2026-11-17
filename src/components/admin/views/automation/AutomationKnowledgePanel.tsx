import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X
} from 'lucide-react';
import {
  KnowledgeEntry,
  KnowledgeFact,
  KnowledgeFactItem,
  contentAutomationApi,
  getErrMsg
} from '../../../../services/contentAutomationApi';
import notify from '../../../../lib/notify';

function normalizeFactItem(raw: KnowledgeFactItem): KnowledgeFact {
  if (typeof raw === 'string') {
    const colonIdx = raw.indexOf(':');
    if (colonIdx > 0 && colonIdx < 60) {
      return {
        label: raw.slice(0, colonIdx).trim(),
        value: raw.slice(colonIdx + 1).trim(),
        status: 'verified'
      };
    }
    return { label: 'Info', value: raw, status: 'verified' };
  }
  return {
    label: String(raw?.label || '').trim(),
    value: String(raw?.value || '').trim(),
    status: raw?.status === 'needs_verification' ? 'needs_verification' : 'verified'
  };
}

export const AutomationKnowledgePanel: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formFacts, setFormFacts] = useState<KnowledgeFact[]>([]);
  const [formMarkdown, setFormMarkdown] = useState('');
  const [formStatus, setFormStatus] = useState<'verified' | 'needs_verification'>('verified');
  const [formSource, setFormSource] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await contentAutomationApi.getKnowledge();
      setEntries(res.entries || []);
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const openEdit = (entry: KnowledgeEntry) => {
    setEditing(entry);
    setFormTitle(entry.title);
    setFormSummary(entry.summary || '');
    const normalized = Array.isArray(entry.facts) ? entry.facts.map(normalizeFactItem) : [];
    setFormFacts(normalized.length > 0 ? normalized : [{ label: '', value: '', status: entry.verification_status }]);
    setFormMarkdown(entry.content_markdown || '');
    setFormStatus(entry.verification_status);
    setFormSource(entry.source_reference || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const cleanedFacts: KnowledgeFact[] = formFacts
        .map((f) => ({
          label: f.label.trim(),
          value: f.value.trim(),
          status: (f.status === 'needs_verification' ? 'needs_verification' : 'verified') as
            | 'verified'
            | 'needs_verification'
        }))
        .filter((f) => f.label.length > 0 || f.value.length > 0)
        .map((f) => ({
          label: f.label || 'Info',
          value: f.value || '-',
          status: f.status
        }));

      await contentAutomationApi.upsertKnowledge(editing.entry_key, {
        title: formTitle.trim(),
        category_number: editing.category_number,
        category_label: editing.category_label,
        verification_status: formStatus,
        source_reference: formSource.trim(),
        summary: formSummary.trim(),
        facts: cleanedFacts,
        content_markdown: formMarkdown
      });
      notify.success('Entri Knowledge Base diperbarui.');
      setEditing(null);
      await loadEntries();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSyncBaseline = async () => {
    setSyncing(true);
    try {
      const res = await contentAutomationApi.syncKnowledgeBaseline();
      notify.success(`Sinkronisasi baseline selesai (${res.total_baseline} kategori terdata).`);
      await loadEntries();
    } catch (err: unknown) {
      notify.error(getErrMsg(err));
    } finally {
      setSyncing(false);
    }
  };

  const needsVerifyCount = entries.filter((e) => e.verification_status === 'needs_verification').length;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-blue-600" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">1sLabs Verified Knowledge Base</h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Sumber kebenaran tunggal untuk AI agar tidak mengarang harga, durasi uji coba, garansi SLA, maupun spesifikasi palsu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {needsVerifyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <AlertTriangle size={13} /> {needsVerifyCount} kategori perlu konfirmasi manual
            </span>
          )}
          <button
            onClick={handleSyncBaseline}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Sinkronkan Baseline
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-zinc-400">Memuat Knowledge Base 1sLabs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((e) => (
            <div
              key={e.entry_key}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                      #{e.category_number} {e.category_label}
                    </span>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">{e.title}</h4>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      e.verification_status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {e.verification_status === 'verified' ? (
                      <>
                        <CheckCircle2 size={11} /> Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={11} /> Needs Verification
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{e.summary}</p>

                {Array.isArray(e.facts) && e.facts.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-zinc-500 list-disc pl-4">
                    {e.facts.slice(0, 4).map((rawFact, idx) => {
                      const f = normalizeFactItem(rawFact);
                      return (
                        <li key={idx}>
                          {f.label && <strong className="text-zinc-700 dark:text-zinc-200">{f.label}: </strong>}
                          <span>{f.value}</span>
                          {f.status === 'needs_verification' && (
                            <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold">
                              Perlu Verifikasi
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {e.facts.length > 4 && (
                      <li className="italic text-zinc-400">+{e.facts.length - 4} fakta lainnya...</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="truncate max-w-[240px]">Sumber: {e.source_reference || '-'}</span>
                <button
                  onClick={() => openEdit(e)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  <Edit3 size={12} /> Perbarui Fakta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-blue-600 font-bold">{editing.category_label}</span>
                <h4 className="font-bold text-base text-zinc-900 dark:text-white">Edit Knowledge Base</h4>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Bagian</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Status Verifikasi</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'verified' | 'needs_verification')}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
                >
                  <option value="verified">Verified (Fakta Terkonfirmasi)</option>
                  <option value="needs_verification">Needs Verification (Jangan Dijadikan Klaim Pasti)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Ringkasan</label>
              <textarea
                rows={2}
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold">Daftar Fakta Terstruktur</label>
                <button
                  type="button"
                  onClick={() => setFormFacts((prev) => [...prev, { label: '', value: '', status: formStatus }])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold cursor-pointer"
                >
                  <Plus size={12} /> Tambah Fakta
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {formFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950"
                  >
                    <input
                      type="text"
                      value={fact.label}
                      onChange={(ev) =>
                        setFormFacts((prev) => prev.map((it, i) => (i === idx ? { ...it, label: ev.target.value } : it)))
                      }
                      placeholder="Label (mis. Masa Aktif)"
                      className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900"
                    />
                    <input
                      type="text"
                      value={fact.value}
                      onChange={(ev) =>
                        setFormFacts((prev) => prev.map((it, i) => (i === idx ? { ...it, value: ev.target.value } : it)))
                      }
                      placeholder="Nilai terverifikasi..."
                      className="sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900"
                    />
                    <select
                      value={fact.status || 'verified'}
                      onChange={(ev) =>
                        setFormFacts((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, status: ev.target.value as 'verified' | 'needs_verification' }
                              : it
                          )
                        )
                      }
                      className="sm:col-span-3 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] bg-white dark:bg-zinc-900"
                    >
                      <option value="verified">Verified</option>
                      <option value="needs_verification">Needs Verification</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setFormFacts((prev) => prev.filter((_, i) => i !== idx))}
                      className="sm:col-span-1 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer flex items-center justify-center"
                      title="Hapus baris fakta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Catatan Konteks Markdown untuk AI</label>
              <textarea
                rows={3}
                value={formMarkdown}
                onChange={(e) => setFormMarkdown(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Referensi Sumber Internal</label>
              <input
                type="text"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
