import React, { useState } from 'react';
import {
  Mail,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';
import { notify } from '../../../../lib/notify';

export const EmailDiscoveryTab: React.FC<{
  onOpenCompanyDetail?: (company: MarketingCompany) => void;
}> = ({ onOpenCompanyDetail }) => {
  // Batch Runner State
  const [batchLimit, setBatchLimit] = useState(15);
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchResults, setBatchResults] = useState<any | null>(null);

  // Single Interactive Tester State
  const [testInput, setTestInput] = useState('');
  const [testType, setTestType] = useState<'url' | 'email'>('url');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Execute Batch Discovery
  const handleRunBatchDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBatchRunning(true);
    setBatchResults(null);

    try {
      const res = await api.marketing.runEmailDiscovery({
        limit: batchLimit,
        province: selectedProvince !== 'all' ? selectedProvince : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });

      if (res && res.success) {
        setBatchResults(res.results);
        notify.success(
          `Selesai memproses ${res.results.totalProcessed} website. Ditemukan ${res.results.verifiedCount} email valid (MX record terverifikasi).`,
          'Email Discovery Selesai'
        );
      }
    } catch (err: any) {
      notify.error(err.message, 'Batch Email Discovery Gagal');
    } finally {
      setIsBatchRunning(false);
    }
  };

  // Execute Single URL or Email Test
  const handleSingleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) {
      notify.warning('Masukkan URL website atau alamat email untuk diuji.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      if (testType === 'email' || testInput.includes('@')) {
        // Run Technical MX Validation
        const res = await api.marketing.validateEmailTechnical(testInput.trim());
        if (res && res.success) {
          setTestResult({
            mode: 'email',
            ...res.result
          });
        }
      } else {
        // Run Website Crawler by dummy company ID or URL test
        let cleanUrl = testInput.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }

        // We can validate the domain part of the website
        const parsed = new URL(cleanUrl);
        const domain = parsed.hostname.replace(/^www\./, '');
        const res = await api.marketing.validateEmailTechnical(`info@${domain}`);

        setTestResult({
          mode: 'url',
          website: cleanUrl,
          domain,
          sampleCheck: res.result
        });
      }
    } catch (err: any) {
      notify.error(err.message, 'Pengujian Gagal');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              DNS MX Record Verification & Deep Crawler
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1">
            Email Discovery — Penemuan Email Bisnis Resmi
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
            Menelusuri halaman publik website resmi (/contact, /about, /kontak, /tentang-kami), mengekstrak email bisnis yang dipublikasikan secara terbuka, dan memverifikasi DNS MX record secara teknis.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-800 font-semibold">Strict: Tanpa Tebakan Email</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Batch Discovery Runner vs Single Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Batch Website Email Discovery */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900">Batch Discovery dari Database Perusahaan</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
              Crawler & DNS Check
            </span>
          </div>

          <form onSubmit={handleRunBatchDiscovery} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Target Status Email di Database
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="all">Semua Belum Terverifikasi (NO_EMAIL & UNVERIFIED)</option>
                  <option value="NO_EMAIL">Hanya Belum Memiliki Email (NO_EMAIL)</option>
                  <option value="UNVERIFIED">Hanya Perlu Validasi Ulang (UNVERIFIED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Wilayah Target (Provinsi)
                </label>
                <select
                  value={selectedProvince}
                  onChange={e => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="all">Semua Wilayah Indonesia</option>
                  <option value="DKI Jakarta">DKI Jakarta</option>
                  <option value="Jawa Barat">Jawa Barat</option>
                  <option value="Jawa Tengah">Jawa Tengah</option>
                  <option value="Jawa Timur">Jawa Timur</option>
                  <option value="Banten">Banten</option>
                  <option value="Bali">Bali</option>
                  <option value="Sumatera Utara">Sumatera Utara</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Jumlah Perusahaan yang Diproses per Batch (Aman Hosting)
                </label>
                <span className="text-xs font-mono font-bold text-zinc-900">{batchLimit} perusahaan</span>
              </div>
              <div className="flex items-center space-x-3">
                {[10, 20, 30, 50].map(val => (
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
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[11px] text-zinc-500 leading-relaxed space-y-1">
              <div className="font-semibold text-zinc-800 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Alur Kerja Penemuan Email:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Mengambil antrean perusahaan yang memiliki website aktif.</li>
                <li>Memindai homepage dan rute publik: <code className="text-zinc-800 font-mono">/contact</code>, <code className="text-zinc-800 font-mono">/about</code>, <code className="text-zinc-800 font-mono">/kontak</code>, <code className="text-zinc-800 font-mono">/tentang-kami</code>.</li>
                <li>Mengekstrak email korespondensi resmi secara eksplisit.</li>
                <li>Menguji DNS MX record domain email secara langsung via resolver server.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-400 font-mono">
                Timeout 8s/halaman &bull; Abort controller aman
              </span>

              {isBatchRunning ? (
                <div className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sedang Memindai Website...</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jalankan Batch Discovery</span>
                </button>
              )}
            </div>
          </form>

          {/* Batch Results Output */}
          {batchResults && (
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900">Hasil Pemindaian Batch Terakhir</h4>
                <span className="text-[10px] font-mono text-zinc-400">
                  {batchResults.totalProcessed} diproses
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase">VERIFIED (MX)</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                    {batchResults.verifiedCount}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-[10px] font-mono text-amber-700 font-bold uppercase">UNVERIFIED</div>
                  <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                    {batchResults.unverifiedCount}
                  </div>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase">NO_EMAIL</div>
                  <div className="text-lg font-bold text-zinc-700 font-mono mt-0.5">
                    {batchResults.noEmailCount}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="text-[10px] font-mono text-rose-700 font-bold uppercase">INVALID</div>
                  <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">
                    {batchResults.invalidCount}
                  </div>
                </div>
              </div>

              {/* Log items */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {batchResults.details?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{item.companyName}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-sm">
                        {item.website} &bull;{' '}
                        {item.chosenEmail ? (
                          <span className="font-mono font-semibold text-blue-600">{item.chosenEmail}</span>
                        ) : (
                          <span className="italic text-zinc-400">Tidak ada email pada halaman publik</span>
                        )}
                      </div>
                      {item.sourceUrl && (
                        <div className="text-[10px] text-zinc-400 truncate max-w-sm mt-0.5">
                          Sumber: <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline">{item.sourceUrl}</a>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          item.emailStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.emailStatus === 'UNVERIFIED'
                            ? 'bg-amber-100 text-amber-800'
                            : item.emailStatus === 'INVALID'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {item.emailStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Single URL / Email Live Inspector */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900">Live DNS & Website Inspector</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
              Single Test
            </span>
          </div>

          <form onSubmit={handleSingleTest} className="space-y-3.5">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setTestType('url')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  testType === 'url' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                Cek Website Bisnis
              </button>
              <button
                type="button"
                onClick={() => setTestType('email')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  testType === 'email' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                Cek DNS MX Email
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                {testType === 'url' ? 'Alamat Website Perusahaan' : 'Alamat Email Perusahaan'}
              </label>
              <input
                type="text"
                placeholder={testType === 'url' ? 'https://perusahaancontoh.co.id' : 'info@perusahaancontoh.co.id'}
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sedang Melakukan Uji DNS...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Uji Validitas Teknis</span>
                </>
              )}
            </button>
          </form>

          {/* Test Result Display */}
          {testResult && (
            <div className="p-4 rounded-2xl border text-xs space-y-3 bg-zinc-50 border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900">Hasil Pemeriksaan Teknis</span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    (testResult.status === 'VERIFIED' || testResult.sampleCheck?.status === 'VERIFIED')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.status || testResult.sampleCheck?.status || 'UNKNOWN'}
                </span>
              </div>

              <div className="space-y-1.5 text-zinc-600 text-[11px]">
                <div>
                  <span className="text-zinc-400">Target:</span>{' '}
                  <span className="font-mono font-semibold text-zinc-800">
                    {testResult.email || testResult.website}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Hasil Keterangan:</span>{' '}
                  <span className="font-medium text-zinc-800">
                    {testResult.reason || testResult.sampleCheck?.reason}
                  </span>
                </div>

                {/* DNS MX Records list */}
                {(testResult.mxRecords || testResult.sampleCheck?.mxRecords) && (
                  <div className="mt-2 pt-2 border-t border-zinc-200">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block mb-1">
                      DNS MX Server Exchange:
                    </span>
                    <div className="space-y-1 font-mono text-[10px] bg-white p-2.5 rounded-xl border border-zinc-200">
                      {(testResult.mxRecords || testResult.sampleCheck?.mxRecords).map((mx: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-zinc-700">
                          <span>{mx.exchange}</span>
                          <span className="text-zinc-400">Pri: {mx.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Validation Rules Badge */}
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Standar Status Email 1sLabs:</span>
            </div>
            <ul className="space-y-1 text-blue-800/90 pl-3 list-disc">
              <li><strong>VERIFIED:</strong> Format valid & DNS MX record aktif ditemukan pada server target.</li>
              <li><strong>UNVERIFIED:</strong> Domain belum dapat diselesaikan atau timeout jaringan.</li>
              <li><strong>INVALID:</strong> Sintaks salah, domain tidak terdaftar (NXDOMAIN), atau masuk suppression list.</li>
              <li><strong>NO_EMAIL:</strong> Website dapat diakses, namun tidak mempublikasikan kontak email terbuka.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

