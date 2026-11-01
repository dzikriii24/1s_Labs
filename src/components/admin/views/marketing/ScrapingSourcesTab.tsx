import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Building,
  MapPin,
  Sparkles,
  ChevronRight,
  Layers,
  X
} from 'lucide-react';
import { api, MarketingSource, MarketingJob } from '../../../../services/api';

export const ScrapingSourcesTab: React.FC = () => {
  const [sources, setSources] = useState<MarketingSource[]>([]);
  const [jobs, setJobs] = useState<MarketingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run Scraping Modal
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedSourceForRun, setSelectedSourceForRun] = useState<MarketingSource | null>(null);
  const [targetLimit, setTargetLimit] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getSources();
      if (res.success) {
        setSources(res.sources);
        setJobs(res.jobs);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar sumber data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleOpenRunModal = (source: MarketingSource) => {
    setSelectedSourceForRun(source);
    setRunResult(null);
    setIsRunModalOpen(true);
  };

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceForRun) return;

    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await api.marketing.runSource(selectedSourceForRun.id, {
        limit: targetLimit
      });

      if (res.success) {
        setRunResult(res.result);
        fetchSources();
      }
    } catch (err: any) {
      alert(`Scraping gagal: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Scraping Sources & Adapters
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola adapter modular sumber data publik yang diizinkan (ISEF Business Matching, KADIN, Satu Data UMKM, Open Data Jabar, Business Discovery).
            </p>
          </div>
        </div>

        <button
          onClick={fetchSources}
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-mono uppercase font-semibold border border-zinc-200">
                  {src.source_type}
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    src.health_status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {src.health_status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-zinc-900 mb-1">{src.name}</h4>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                {src.permission_notes || 'Direktori data bisnis publik.'}
              </p>

              <div className="space-y-1.5 text-[11px] bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Method:</span>
                  <span className="text-zinc-800 capitalize font-medium">{src.collection_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Collected:</span>
                  <span className="text-zinc-900 font-bold">{src.total_records_collected.toLocaleString()} entitas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rate Limit:</span>
                  <span className="text-zinc-600">{src.rate_limit_per_minute} req/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Jadwal Cron:</span>
                  <span className="text-zinc-700">{src.schedule_cron}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono">
                {src.last_successful_run ? `Run: ${new Date(src.last_successful_run).toLocaleDateString('id-ID')}` : 'Belum pernah run'}
              </span>

              <button
                onClick={() => handleOpenRunModal(src)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span>Jalankan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Scraping Jobs */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/75 flex justify-between items-center">
          <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-700" /> Riwayat Job Scraping & Discovery Terakhir
          </h4>
        </div>

        {jobs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-10 text-center">Belum ada job scraping yang tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-4">Target Sektor</th>
                  <th className="py-2.5 px-4">Wilayah</th>
                  <th className="py-2.5 px-4">Ditemukan</th>
                  <th className="py-2.5 px-4">Disimpan</th>
                  <th className="py-2.5 px-4">Duplikat</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-900 font-semibold">#{j.id}</td>
                    <td className="py-2.5 px-4 text-zinc-900 font-medium">{j.target_sector || 'General'}</td>
                    <td className="py-2.5 px-4 text-zinc-600">{j.target_province || 'Indonesia'}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-700">{j.records_found}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-600 font-bold">{j.records_saved}</td>
                    <td className="py-2.5 px-4 font-mono text-amber-600">{j.records_duplicate}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          j.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : j.status === 'running'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-400 font-mono text-[11px]">
                      {new Date(j.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run Scraping Modal */}
      {isRunModalOpen && selectedSourceForRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-zinc-900">
                  Jalankan Scraper
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedSourceForRun.name}
                </p>
              </div>
              <button
                onClick={() => setIsRunModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRun} className="space-y-4">
              {/* General Multi-Sector Info Banner */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900">Scraping Multi-Sektor Otomatis</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                    Scraper akan mengambil data bisnis riil secara umum di seluruh sektor (Kuliner, F&B, Retail, Fashion, Teknologi, Manufaktur, Logistik, dll.) dan seluruh wilayah Indonesia tanpa filter manual.
                  </p>
                </div>
              </div>

              {/* Target Limit Controls */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-700">
                    Jumlah Data yang Ingin Diambil
                  </label>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-zinc-900 text-white">
                    {targetLimit} entitas
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={targetLimit}
                  onChange={e => setTargetLimit(parseInt(e.target.value, 10))}
                  className="w-full accent-zinc-900 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                />

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-400">Pilihan cepat:</span>
                  {[15, 30, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetLimit(val)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                        targetLimit === val
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {runResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Scraping Berhasil Diselesaikan!
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-200/50">
                      <div className="text-[10px] text-emerald-600 uppercase">Ditemukan</div>
                      <div className="text-sm font-bold text-emerald-900">{runResult.recordsFound}</div>
                    </div>
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-200/50">
                      <div className="text-[10px] text-emerald-600 uppercase">Disimpan Baru</div>
                      <div className="text-sm font-bold text-emerald-900">{runResult.recordsSaved}</div>
                    </div>
                    <div className="bg-white/70 p-2 rounded-xl border border-emerald-200/50">
                      <div className="text-[10px] text-emerald-600 uppercase">Duplikat</div>
                      <div className="text-sm font-bold text-emerald-900">{runResult.recordsDuplicate}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsRunModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isRunning}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Mengambil Data...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                      <span>Mulai Scraping ({targetLimit} Data)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
