import React, { useState, useEffect } from 'react';
import {
  Search,
  Layers,
  MapPin,
  Building2,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Sliders,
  Database
} from 'lucide-react';
import { api, MarketingSource, MarketingJob } from '../../../../services/api';
import { notify } from '../../../../lib/notify';
import { BulkImportModal } from './BulkImportModal';

// All 38 Provinces of Indonesia
const INDONESIA_PROVINCES = [
  'Semua Wilayah Indonesia',
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'DKI Jakarta',
  'Jawa Barat',
  'Banten',
  'Jawa Tengah',
  'D.I. Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya'
];

// Major Indonesian Business Categories
const BUSINESS_CATEGORIES = [
  'Semua Sektor (Multi-Industri)',
  'Teknologi dan IT',
  'Manufaktur dan Industri',
  'Konstruksi dan Properti',
  'Perdagangan dan Retail',
  'Distributor dan Grosir',
  'Logistik dan Ekspedisi',
  'Pendidikan dan Pelatihan',
  'Kesehatan dan Farmasi',
  'Hospitality, Hotel & F&B',
  'Jasa Profesional dan Konsultan',
  'Agrikultur dan Perkebunan',
  'Industri Kreatif dan Digital',
  'Layanan Finansial dan Koperasi'
];

export const LeadDiscoveryTab: React.FC<{ onNavigateSubtab?: (subtab: string) => void }> = ({
  onNavigateSubtab
}) => {
  const [sources, setSources] = useState<MarketingSource[]>([]);
  const [jobs, setJobs] = useState<MarketingJob[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Form State
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState('Jawa Barat');
  const [customCity, setCustomCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Sektor (Multi-Industri)');
  const [businessScale, setBusinessScale] = useState<'all' | 'corporate' | 'umkm'>('all');
  const [batchLimit, setBatchLimit] = useState(30);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeJobResult, setActiveJobResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await api.marketing.getSources();
      if (res && res.success) {
        setSources(res.sources);
        setJobs(res.jobs || []);
        if (res.sources.length > 0 && !selectedSourceId) {
          // Default to OpenStreetMap or first active
          const osm = res.sources.find(s => s.source_type === 'osm_indonesia' || s.source_type === 'osm_overpass');
          setSelectedSourceId(osm ? osm.id : res.sources[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load sources:', err);
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const selectedSource = sources.find(s => s.id === selectedSourceId);
  const isPadiUmkm = selectedSource?.source_type === 'padi_umkm';

  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId) {
      notify.warning('Pilih salah satu sumber data terlebih dahulu.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setErrorMsg(null);
    setActiveJobResult(null);

    try {
      const payload: any = {
        province: selectedProvince !== 'Semua Wilayah Indonesia' ? selectedProvince : undefined,
        city: customCity.trim() || undefined,
        sector: selectedCategory !== 'Semua Sektor (Multi-Industri)' ? selectedCategory : undefined,
        business_scale: businessScale !== 'all' ? businessScale : undefined,
        limit: batchLimit
      };

      const res = await api.marketing.runSource(selectedSourceId, payload);
      if (res && res.success) {
        setActiveJobResult(res.result);
        notify.success(
          `Pengumpulan selesai! ${res.result.recordsSaved || 0} prospek baru disimpan, ${res.result.recordsDuplicate || 0} duplikat digabungkan.`,
          'Lead Discovery Berhasil'
        );
        fetchSources();
      } else {
        throw new Error(res.message || 'Eksekusi pengumpulan data gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menjalankan adapter pengumpulan data.');
      notify.error(err.message, 'Lead Discovery Gagal');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Legal Multi-Source Lead Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1">
            Lead Discovery — Pengumpulan Data Bisnis Indonesia
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
            Tarik data perusahaan dan UMKM dari OpenStreetMap, Satu Data Indonesia, Direktori Bisnis resmi, atau unggah dataset CSV dengan verifikasi anti-duplikasi otomatis.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-600" />
            <span>Import CSV / Excel</span>
          </button>
          <button
            onClick={fetchSources}
            title="Refresh Sources"
            className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
          <form onSubmit={handleRunDiscovery} className="space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-100">
              <Sliders className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900">Parameter Pengumpulan Data</h3>
            </div>

            {/* 1. Sumber Data (Source Selector) */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Sumber Data Prospek (Legal & Public Sources) <span className="text-rose-500">*</span>
              </label>
              {isLoadingSources ? (
                <div className="py-4 text-center text-xs text-zinc-400">Memuat sumber data...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sources.map(src => {
                    const isSelected = selectedSourceId === src.id;
                    return (
                      <div
                        key={src.id}
                        onClick={() => setSelectedSourceId(src.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 shadow-xs'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-zinc-900">{src.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                src.health_status === 'healthy'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {src.collection_method.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                            {src.permission_notes || src.data_category}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Limit: {src.max_records_per_run || 50}/batch</span>
                          <span>Terkumpul: {src.total_records_collected || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PaDi UMKM Notice if selected */}
              {isPadiUmkm && (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-900">Perhatian Kredensial PaDi UMKM OpenAPI</p>
                    <p className="text-[11px] leading-relaxed">
                      API PaDi UMKM memerlukan Client ID & Client Secret resmi. Apabila belum dikonfigurasi, sistem akan menampilkan panduan pendaftaran pada portal{' '}
                      <a
                        href="https://openapi-docs.padiumkm.id/docs/authentication/credential"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold"
                      >
                        openapi-docs.padiumkm.id
                      </a>. Kredensial dapat dimasukkan di menu Marketing Settings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Wilayah Indonesia (Province & City) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Provinsi Target <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProvince}
                  onChange={e => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {INDONESIA_PROVINCES.map((prov, i) => (
                    <option key={i} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Kabupaten / Kota (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bandung, Surabaya, Jakarta Selatan"
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* 3. Kategori Bisnis & Skala Usaha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Kategori Industri / Bisnis <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {BUSINESS_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Skala / Tipe Usaha
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'corporate', label: 'Perusahaan' },
                    { id: 'umkm', label: 'UMKM' }
                  ].map(scale => (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => setBusinessScale(scale.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        businessScale === scale.id
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Batch Limit & Server Safety Guard */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Jumlah Maksimum Data per Batch (Resource Guard)
                </label>
                <span className="text-xs font-mono font-bold text-zinc-900">{batchLimit} data</span>
              </div>
              <div className="flex items-center space-x-3">
                {[15, 30, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBatchLimit(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      batchLimit === val
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Proses pengumpulan data menggunakan batch processing untuk menjaga batas CPU, RAM, dan Entry Processes hosting 1sLabs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Anti-duplikasi otomatis aktif (Name, Domain, Phone)</span>
              </div>

              <div className="flex items-center space-x-2">
                {isRunning ? (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsPaused(!isPaused)}
                      className="px-3.5 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>{isPaused ? 'Lanjutkan' : 'Jeda'}</span>
                    </button>
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengumpulkan...</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Pengumpulan Data</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Execution Status & Real-time Metrics */}
        <div className="space-y-6">
          {/* Active / Last Run Results Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Hasil Eksekusi Batch</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                Live Status
              </span>
            </div>

            {isRunning ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Sedang Mengambil Data dari Sumber...</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Menghubungi API dan menerapkan parsing metadata serta normalisasi anti-duplikasi.
                  </p>
                </div>
              </div>
            ) : activeJobResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2.5 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Batch Pengumpulan Selesai Berhasil!</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">Data Ditemukan</div>
                    <div className="text-lg font-bold text-zinc-900 font-mono mt-0.5">
                      {activeJobResult.recordsFound || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-[10px] font-mono text-emerald-600 uppercase font-bold">Data Baru Disimpan</div>
                    <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                      +{activeJobResult.recordsSaved || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <div className="text-[10px] font-mono text-amber-600 uppercase">Duplikat Terdeteksi</div>
                    <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                      {activeJobResult.recordsDuplicate || 0}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">Diperkaya</div>
                    <div className="text-lg font-bold text-zinc-700 font-mono mt-0.5">
                      {activeJobResult.recordsEnriched || 0}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateSubtab && onNavigateSubtab('companies')}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <span>Buka Database Prospek</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : errorMsg ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Pengumpulan Tidak Berhasil</span>
                </div>
                <p className="text-[11px] leading-relaxed">{errorMsg}</p>
                {errorMsg.includes('PaDi') && (
                  <button
                    type="button"
                    onClick={() => onNavigateSubtab && onNavigateSubtab('settings')}
                    className="mt-2 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    Buka Konfigurasi PaDi UMKM
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400 space-y-1">
                <Info className="w-6 h-6 text-zinc-300 mx-auto mb-1" />
                <p className="font-medium text-zinc-600">Belum ada job yang dijalankan sesi ini.</p>
                <p className="text-[11px] text-zinc-400">
                  Pilih sumber data dan wilayah, lalu klik tombol "Mulai Pengumpulan Data".
                </p>
              </div>
            )}
          </div>

          {/* Guidelines Box */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 text-xs text-zinc-600 space-y-2.5">
            <div className="flex items-center space-x-2 font-bold text-zinc-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Prinsip Kepatuhan & Keamanan Data</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-zinc-500 list-disc pl-4 leading-relaxed">
              <li>Hanya mengambil data yang dipublikasikan secara terbuka untuk keperluan bisnis.</li>
              <li>Tidak mengumpulkan data pribadi sensitif (NIK, NPWP pribadi, nomor rekening).</li>
              <li>Menghormati hak opt-out / Do Not Contact list secara mutlak.</li>
              <li>Mendukung atribusi OpenStreetMap di bawah lisensi ODbL.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSV Bulk Import Modal */}
      {isImportModalOpen && (
        <BulkImportModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            notify.success('Data CSV berhasil diimpor ke database prospek!', 'Import Selesai');
            fetchSources();
          }}
        />
      )}
    </div>
  );
};

