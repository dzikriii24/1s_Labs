import React, { useEffect, useState, useCallback } from 'react';
import {
  Network,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Link2,
  Lightbulb,
  Loader2,
  Edit3,
  FilePlus2,
  X
} from 'lucide-react';
import {
  seoIntelligenceApi,
  type ContentIdea,
  type InternalLinkOpportunity,
  type TopicCluster
} from '../../../../services/blogApi';
import { notify } from '../../../../lib/notify';

interface ContentStrategyTabProps {
  onOpenEditor: (articleId: number) => void;
}

export const ContentStrategyTab: React.FC<ContentStrategyTabProps> = ({ onOpenEditor }) => {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [linkOpps, setLinkOpps] = useState<InternalLinkOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [focusTopic, setFocusTopic] = useState('');

  // Cluster Modal
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [clusterForm, setClusterForm] = useState<{
    name: string;
    pillar_title: string;
    target_keyword: string;
    search_intent: TopicCluster['search_intent'];
    notes: string;
  }>({
    name: '',
    pillar_title: '',
    target_keyword: '',
    search_intent: 'commercial',
    notes: ''
  });

  // Manual Idea Form
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaForm, setIdeaForm] = useState<{
    title: string;
    target_keyword: string;
    cluster_id: string;
    priority: ContentIdea['priority'];
    rationale: string;
  }>({
    title: '',
    target_keyword: '',
    cluster_id: '',
    priority: 'medium',
    rationale: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clRes, idRes, lkRes] = await Promise.all([
        seoIntelligenceApi.getClusters(),
        seoIntelligenceApi.getIdeas(),
        seoIntelligenceApi.getInternalLinkOpportunities()
      ]);
      setClusters(clRes.clusters || []);
      setIdeas(idRes.ideas || []);
      setLinkOpps(lkRes.opportunities || []);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memuat Content Strategy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateAiIdeas = async () => {
    setGeneratingAi(true);
    try {
      const res = await seoIntelligenceApi.generateAiIdeas(focusTopic.trim());
      notify.success(`${res.generated.length} ide artikel strategis baru berhasil dirancang oleh Gemini (${res.model}).`);
      setFocusTopic('');
      loadData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghasilkan ide konten AI.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleConvertToDraft = async (idea: ContentIdea) => {
    try {
      const res = await seoIntelligenceApi.convertIdeaToDraft(idea.id, 'draft');
      notify.success('Ide dikonversi menjadi Draft Artikel dengan kerangka H2 awal.');
      onOpenEditor(res.article.id);
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengonversi ide menjadi draft.');
    }
  };

  const handleSaveCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clusterForm.name.trim() || !clusterForm.pillar_title.trim() || !clusterForm.target_keyword.trim()) {
      notify.warning('Lengkapi nama klaster, judul pilar, dan kata kunci target.');
      return;
    }
    try {
      await seoIntelligenceApi.createCluster(clusterForm);
      notify.success('Topic Cluster baru ditambahkan.');
      setShowClusterModal(false);
      setClusterForm({ name: '', pillar_title: '', target_keyword: '', search_intent: 'commercial', notes: '' });
      loadData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menambah topic cluster.');
    }
  };

  const handleSaveManualIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaForm.title.trim()) {
      notify.warning('Judul ide wajib diisi.');
      return;
    }
    try {
      await seoIntelligenceApi.createIdea({
        ...ideaForm,
        cluster_id: ideaForm.cluster_id ? Number(ideaForm.cluster_id) : null
      });
      notify.success('Ide konten ditambahkan.');
      setShowIdeaModal(false);
      setIdeaForm({ title: '', target_keyword: '', cluster_id: '', priority: 'medium', rationale: '' });
      loadData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan ide konten.');
    }
  };

  const handleDeleteCluster = async (id: number) => {
    const ok = await notify.confirm({
      title: 'Hapus Topic Cluster?',
      text: 'Artikel yang terhubung tetap aman dan hanya dilepas dari klaster ini.',
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;
    await seoIntelligenceApi.deleteCluster(id);
    loadData();
  };

  const handleDeleteIdea = async (id: number) => {
    await seoIntelligenceApi.deleteIdea(id);
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1.5">
            <Network size={13} />
            1sLabs Content Strategy &amp; Topical Authority
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Topic Clusters, AI Content Gaps &amp; Internal Links</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Rancang arsitektur pilar konten seputar Custom Software, Managed Hosting &amp; Technical SEO lalu ubah menjadi draft artikel 1-klik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowClusterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
          >
            <Plus size={15} className="text-blue-600" /> Tambah Klaster
          </button>
          <button
            type="button"
            onClick={() => setShowIdeaModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
          >
            <Lightbulb size={15} /> Catat Ide Topik
          </button>
        </div>
      </div>

      {/* Topic Clusters Grid */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Topic Clusters Aktif ({clusters.length})</h3>
        {loading ? (
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border text-center text-zinc-500">
            <Loader2 size={20} className="animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clusters.map((cl) => (
              <div key={cl.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {cl.search_intent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCluster(cl.id)}
                      className="text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-2">{cl.name}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">Pilar: {cl.pillar_title}</p>
                  <p className="text-[11px] font-mono text-blue-600 mt-1.5">KW: {cl.target_keyword}</p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>{Number(cl.published_count || 0)} terbit / {Number(cl.article_count || 0)} total</span>
                  <span>Avg SEO: <strong className="text-zinc-900 dark:text-white">{Number(cl.avg_seo_score || 0)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Content Gap Generator + Ideas Backlog */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-blue-50/70 to-white dark:from-blue-950/20 dark:to-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              Backlog Ide Artikel &amp; Content Gap Discovery
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gemini AI menganalisis klaster topik, data Search Console, dan artikel yang sudah ada agar tidak terjadi duplikasi keyword.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="Fokus topik opsional (mis. VPS Laravel)..."
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs w-56"
            />
            <button
              type="button"
              disabled={generatingAi}
              onClick={handleGenerateAiIdeas}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 whitespace-nowrap"
            >
              {generatingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generatingAi ? 'Merancang...' : 'AI Cari Content Gap'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {ideas.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500">
              Belum ada ide artikel tercatat. Gunakan tombol "AI Cari Content Gap" di atas untuk menghasilkan 5 ide terstruktur.
            </div>
          ) : (
            ideas.map((idea) => (
              <div key={idea.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      idea.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {idea.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                      {idea.source === 'ai_gap' ? 'Gemini AI Gap' : 'Manual'}
                    </span>
                    {idea.cluster_name && (
                      <span className="text-[11px] text-zinc-500">Klaster: {idea.cluster_name}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{idea.title}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{idea.rationale}</p>
                  {idea.target_keyword && (
                    <p className="text-[11px] font-mono text-blue-600">Target Keyword: {idea.target_keyword}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {idea.linked_article_id ? (
                    <button
                      type="button"
                      onClick={() => onOpenEditor(idea.linked_article_id!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
                    >
                      <Edit3 size={13} /> Buka Artikel ({idea.linked_article_status || 'draft'})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConvertToDraft(idea)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      <FilePlus2 size={13} /> Konversi ke Draft <ArrowRight size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Internal Linking Opportunities */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <Link2 size={16} className="text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Peluang Internal Link Otomatis ({linkOpps.length})</h3>
            <p className="text-xs text-zinc-500">Artikel yang membahas topik relevan atau satu klaster namun belum saling menautkan tautan internal.</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {linkOpps.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Belum ada rekomendasi internal link tambahan saat ini (tambah dan terbitkan lebih banyak artikel untuk pemetaan klaster).
            </div>
          ) : (
            linkOpps.map((opp, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-900 dark:text-white">
                    Dari: <span className="text-blue-600">{opp.source_title}</span> → Ke: <span className="text-emerald-700">{opp.target_title}</span>
                  </div>
                  <p className="text-zinc-500">{opp.reason}</p>
                  <p className="font-mono text-[11px] text-zinc-600">
                    Anchor disarankan: "{opp.suggested_anchor}" ({opp.target_url})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenEditor(opp.source_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold shrink-0 hover:bg-blue-100"
                >
                  <Edit3 size={13} /> Edit Artikel Sumber
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Create Cluster Modal */}
      {showClusterModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveCluster} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Tambah Topic Cluster Baru</h4>
              <button type="button" onClick={() => setShowClusterModal(false)}><X size={16} /></button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Nama Klaster *</label>
              <input type="text" value={clusterForm.name} onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" placeholder="Misal: Automasi Bisnis & ERP Custom" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Judul Pillar Page Utama *</label>
              <input type="text" value={clusterForm.pillar_title} onChange={(e) => setClusterForm({ ...clusterForm, pillar_title: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Target Keyword *</label>
                <input type="text" value={clusterForm.target_keyword} onChange={(e) => setClusterForm({ ...clusterForm, target_keyword: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Search Intent</label>
                <select value={clusterForm.search_intent} onChange={(e) => setClusterForm({ ...clusterForm, search_intent: e.target.value as any })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                  <option value="informational">Informational</option>
                  <option value="commercial">Commercial</option>
                  <option value="transactional">Transactional</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Catatan Strategis</label>
              <textarea rows={2} value={clusterForm.notes} onChange={(e) => setClusterForm({ ...clusterForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowClusterModal(false)} className="px-3.5 py-2 rounded-xl border">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Simpan Klaster</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Manual Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveManualIdea} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-3.5 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Catat Ide Artikel Baru</h4>
              <button type="button" onClick={() => setShowIdeaModal(false)}><X size={16} /></button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Judul Ide Artikel *</label>
              <input type="text" value={ideaForm.title} onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Target Keyword</label>
              <input type="text" value={ideaForm.target_keyword} onChange={(e) => setIdeaForm({ ...ideaForm, target_keyword: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Klaster</label>
                <select value={ideaForm.cluster_id} onChange={(e) => setIdeaForm({ ...ideaForm, cluster_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                  <option value="">Umum</option>
                  {clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Prioritas</label>
                <select value={ideaForm.priority} onChange={(e) => setIdeaForm({ ...ideaForm, priority: e.target.value as any })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Brief / Alasan Bisnis</label>
              <textarea rows={2} value={ideaForm.rationale} onChange={(e) => setIdeaForm({ ...ideaForm, rationale: e.target.value })} className="w-full px-3 py-2 rounded-xl border bg-zinc-50 dark:bg-zinc-800" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowIdeaModal(false)} className="px-3.5 py-2 rounded-xl border">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Simpan Ide</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

