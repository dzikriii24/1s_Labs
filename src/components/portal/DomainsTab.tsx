import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Server,
  ArrowRight,
  Info,
  Layers,
  Loader2,
  X
} from 'lucide-react';
import { api, DomainRecord, HostingService } from '../../services/api';
import notify from '../../lib/notify';

interface DomainsTabProps {
  onNavigateToHosting: (serviceCode?: string) => void;
  onNavigateToFreePlan: () => void;
}

export const DomainsTab: React.FC<DomainsTabProps> = ({
  onNavigateToHosting,
  onNavigateToFreePlan
}) => {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom domain modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [checkResult, setCheckResult] = useState<{ available: boolean; message: string } | null>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Detail / DNS guide modal state
  const [selectedDomain, setSelectedDomain] = useState<DomainRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Renewal modal state
  const [renewingDomain, setRenewingDomain] = useState<DomainRecord | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await api.domains.list();
      if (res.success) {
        setDomains(res.domains);
      }
    } catch (err: any) {
      console.error('Fetch domains error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  // Debounced check for custom domain input
  useEffect(() => {
    if (!customDomainInput || customDomainInput.trim().length < 4) {
      setCheckResult(null);
      setCheckingDomain(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDomain(true);
      try {
        const res = await api.domains.check(customDomainInput.trim(), 'custom_domain');
        setCheckResult({
          available: res.available,
          message: res.message
        });
      } catch (err: any) {
        setCheckResult({
          available: false,
          message: err.message || 'Domain tidak valid atau sudah digunakan.'
        });
      } finally {
        setCheckingDomain(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [customDomainInput]);

  const handleAddCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput || !checkResult?.available) return;

    setIsAddingDomain(true);
    setAddError(null);
    try {
      await api.domains.addCustom(customDomainInput.trim());
      setIsAddModalOpen(false);
      setCustomDomainInput('');
      setCheckResult(null);
      await fetchDomains();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan domain.');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredDomains = domains.filter(d =>
    d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.service_code && d.service_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalDomains = domains.length;
  const activeDomains = domains.filter(d => d.status === 'active').length;
  const freeSubdomains = domains.filter(d => d.domain_type === 'free_subdomain').length;
  const expiringSoon = domains.filter(d => d.is_expiring_soon).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            Manajemen Domain & Subdomain
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola seluruh domain, konfigurasi DNS record, pemantauan sertifikat SSL, dan integrasi hosting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Hubungkan Custom Domain
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Domain</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalDomains}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Domain Aktif</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeDomains}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Free Subdomain</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{freeSubdomains}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Segera Berakhir</span>
          <p className={`text-2xl font-bold mt-1 ${expiringSoon > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
            {expiringSoon}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari domain atau kode layanan..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
        </div>

        <button
          onClick={fetchDomains}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          title="Segarkan data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Domain List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-gray-500">Memuat daftar domain...</p>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">
          <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Belum Ada Domain</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-6">
            Anda belum memiliki domain terdaftar. Anda dapat mengklaim subdomain gratis 1 tahun melalui program Free Plan atau menghubungkan custom domain.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onNavigateToFreePlan}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Klaim Free Plan Sekarang
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
            >
              Hubungkan Custom Domain
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDomains.map((domain) => {
            const expDate = new Date(domain.expires_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={domain.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:border-indigo-500/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                    >
                      https://{domain.domain}
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      domain.domain_type === 'free_subdomain'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {domain.domain_type === 'free_subdomain' ? 'Free Subdomain' : 'Custom Domain'}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      domain.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : domain.status === 'suspended'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {domain.status === 'active' ? 'Aktif' : domain.status === 'suspended' ? 'Ditangguhkan' : 'Expired'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Masa Aktif: s/d {expDate}
                      {domain.days_remaining !== undefined && (
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          ({domain.days_remaining} hari lagi)
                        </span>
                      )}
                    </span>

                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      SSL: {domain.ssl_status === 'active' ? 'Aktif (Let\'s Encrypt)' : 'Diproses / Auto-SSL'}
                    </span>

                    {domain.service_code && (
                      <span className="flex items-center gap-1">
                        <Server className="w-3.5 h-3.5 text-indigo-500" />
                        Hosting: <code className="font-mono text-gray-800 dark:text-gray-200">{domain.service_code}</code>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedDomain(domain);
                      setIsDetailModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition"
                  >
                    DNS & Rincian
                  </button>

                  <button
                    onClick={() => setRenewingDomain(domain)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
                  >
                    Perpanjang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah Custom Domain */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Hubungkan Custom Domain
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomDomain} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                    Nama Domain Kustom
                  </label>
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase().trim())}
                    placeholder="contoh: startupanda.com atau toko.id"
                    disabled={isAddingDomain}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Availability feedback */}
                  <div className="mt-2 min-h-[20px] text-xs">
                    {checkingDomain && (
                      <span className="text-indigo-600 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Memvalidasi format & ketersediaan domain...
                      </span>
                    )}
                    {!checkingDomain && checkResult && (
                      <span className={checkResult.available ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                        {checkResult.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                  <p className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Panduan Konfigurasi DNS:
                  </p>
                  <p>
                    Setelah domain didaftarkan, arahkan <strong>A Record (@)</strong> domain Anda ke IP Server 1sLabs:
                  </p>
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 font-mono font-bold text-indigo-600">
                    <span>103.119.237.132</span>
                    <button
                      type="button"
                      onClick={() => copyText('ip_modal', '103.119.237.132')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {copiedField === 'ip_modal' ? 'Disalin!' : 'Salin'}
                    </button>
                  </div>
                </div>

                {addError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {addError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!customDomainInput || !checkResult?.available || isAddingDomain}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition ${
                      customDomainInput && checkResult?.available && !isAddingDomain
                        ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                        : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {isAddingDomain ? 'Mendaftarkan Domain...' : 'Daftarkan Domain'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Detail Domain & DNS Guide */}
      <AnimatePresence>
        {isDetailModalOpen && selectedDomain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    Konfigurasi DNS: {selectedDomain.domain}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rincian parameter DNS server untuk domain Anda.
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* A Record */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-500 uppercase">A Record (Host Utama)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                      @ &rarr; 103.119.237.132
                    </span>
                    <button
                      onClick={() => copyText('a_rec', '103.119.237.132')}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      {copiedField === 'a_rec' ? 'Tersalin' : 'Salin IP'}
                    </button>
                  </div>
                </div>

                {/* CNAME Record */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-500 uppercase">CNAME Record (WWW Alias)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                      www &rarr; {selectedDomain.domain}
                    </span>
                    <button
                      onClick={() => copyText('cname_rec', selectedDomain.domain)}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      {copiedField === 'cname_rec' ? 'Tersalin' : 'Salin Target'}
                    </button>
                  </div>
                </div>

                {/* Nameservers */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-500 uppercase">Nameservers Resmi 1sLabs</span>
                  <div className="space-y-1 mt-1 text-sm font-mono text-gray-900 dark:text-white">
                    <div className="flex justify-between">
                      <span>ns1.domainmurah.net</span>
                      <button onClick={() => copyText('ns1', 'ns1.domainmurah.net')} className="text-xs text-indigo-600 font-semibold">Salin</button>
                    </div>
                    <div className="flex justify-between">
                      <span>ns2.domainmurah.net</span>
                      <button onClick={() => copyText('ns2', 'ns2.domainmurah.net')} className="text-xs text-indigo-600 font-semibold">Salin</button>
                    </div>
                  </div>
                </div>

                {/* Physical Document Root */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                  <span className="font-bold text-gray-600 dark:text-gray-300">Document Root Server:</span>
                  <p className="font-mono mt-1 text-gray-800 dark:text-gray-200 select-all">
                    {selectedDomain.document_root}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Perpanjangan Domain */}
      <AnimatePresence>
        {renewingDomain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Perpanjang Domain
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Perpanjang masa aktif domain <strong>{renewingDomain.domain}</strong> agar tetap aktif dan terhindar dari suspensi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Biaya Perpanjangan:</span>
                  <strong className="text-gray-900 dark:text-white">Rp 10.000 / bulan</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Durasi Tambahan:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">+30 Hari</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRenewingDomain(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    const domainToRenew = renewingDomain;
                    setRenewingDomain(null);
                    notify.loading('Memproses tagihan...', 'Sedang membuat tagihan perpanjangan domain');
                    try {
                      const res = await api.domains.renew(domainToRenew.id);
                      notify.close();
                      if (res.success) {
                        notify.success(res.message || 'Tagihan perpanjangan domain berhasil dibuat.');
                        if (res.order_number) {
                          window.location.href = `/payment/${res.order_number}`;
                        } else {
                          loadData();
                        }
                      }
                    } catch (err: any) {
                      notify.close();
                      notify.error(err.message || 'Gagal memproses perpanjangan domain.');
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  Buat Tagihan Perpanjangan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

