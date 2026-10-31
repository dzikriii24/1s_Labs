import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Globe,
  Server,
  Cpu,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Gift
} from 'lucide-react';
import { api, FreePlanClaim } from '../../services/api';

interface FreePlanTabProps {
  onNavigateToHosting: (serviceCode?: string) => void;
  onNavigateToDomains: () => void;
  onNavigateToNodeJs: () => void;
}

export const FreePlanTab: React.FC<FreePlanTabProps> = ({
  onNavigateToHosting,
  onNavigateToDomains,
  onNavigateToNodeJs
}) => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<{
    eligible: boolean;
    alreadyClaimed: boolean;
    claim: FreePlanClaim | null;
  } | null>(null);

  // Form states
  const [subdomainInput, setSubdomainInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [availResult, setAvailResult] = useState<{
    available: boolean;
    message: string;
    subdomain?: string;
    domain?: string;
  } | null>(null);

  // Provisioning states
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStep, setClaimStep] = useState(0);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const claimSteps = [
    'Validasi Konfigurasi & Otorisasi Pengguna...',
    'Memeriksa Ketersediaan Subdomain di Server cPanel...',
    'Provisioning Subdomain *.1slabs.my.id di VirtualHost...',
    'Membuat Direktori Document Root & File Scaffolding...',
    'Mengaktifkan Cloud Hosting Trial 14 Hari & Auto-SSL...',
    'Menyelesaikan Registrasi Layanan & Menyiapkan Akses Dashboard...'
  ];

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.freePlan.getStatus();
      if (res.success) {
        setStatusData({
          eligible: res.eligible,
          alreadyClaimed: res.alreadyClaimed,
          claim: res.claim
        });
      }
    } catch (err: any) {
      console.error('Fetch free plan status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Debounced subdomain availability check
  useEffect(() => {
    if (!subdomainInput || subdomainInput.trim().length < 3) {
      setAvailResult(null);
      setCheckingSubdomain(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSubdomain(true);
      try {
        const res = await api.freePlan.checkSubdomain(subdomainInput.trim());
        setAvailResult({
          available: res.available,
          message: res.message,
          subdomain: res.subdomain,
          domain: res.domain
        });
      } catch (err: any) {
        setAvailResult({
          available: false,
          message: err.message || 'Gagal memeriksa ketersediaan subdomain.'
        });
      } finally {
        setCheckingSubdomain(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomainInput]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms || !subdomainInput || !availResult?.available) return;

    setIsClaiming(true);
    setClaimError(null);
    setClaimStep(0);

    // Step progression visual feedback
    const stepInterval = setInterval(() => {
      setClaimStep(prev => (prev < claimSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      await api.freePlan.claim(subdomainInput.trim(), agreeTerms);
      clearInterval(stepInterval);
      setClaimStep(claimSteps.length);
      await fetchStatus();
    } catch (err: any) {
      clearInterval(stepInterval);
      setClaimError(err.message || 'Gagal memproses klaim Free Plan.');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-neutral-800 dark:text-neutral-200 animate-spin" />
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Memeriksa status program Free Plan akun Anda...
        </p>
      </div>
    );
  }

  // View when user ALREADY CLAIMED
  if (statusData?.alreadyClaimed && statusData.claim) {
    const claim = statusData.claim;
    const hostingExpDate = new Date(claim.hosting_expires_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const domainExpDate = new Date(claim.domain_expires_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const isHostingExpired = claim.is_hosting_expired;

    return (
      <div className="w-full space-y-6">
        {/* Banner Status Claimed - Clean, Professional, No AI Slop */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Layanan Subdomain & Hosting Gratis Aktif
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Setiap akun pengguna berhak mendapatkan 1 kali klaim program Free Plan seumur hidup.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                isHostingExpired
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {isHostingExpired ? 'Hosting Expired' : 'Hosting Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Claim Details Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-900 dark:text-white" />
            Informasi Domain & Hosting Anda
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Domain Gratis</span>
              <div className="flex items-center justify-between mt-1">
                <a
                  href={`https://${claim.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-bold text-gray-900 dark:text-white hover:underline flex items-center gap-1.5"
                >
                  https://{claim.domain}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
                <button
                  onClick={() => copyToClipboard(`https://${claim.domain}`)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                  title="Salin URL"
                >
                  {copiedDomain ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Masa aktif domain: <strong>1 Tahun</strong> (berakhir: {domainExpDate})
              </p>
            </div>

            {/* Hosting Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Free Hosting Trial</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {claim.service_code || 'SRV-FREE-PLAN'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                  14 Hari Penuh
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Masa aktif hosting: {isHostingExpired ? (
                  <strong className="text-amber-500">Telah berakhir pada {hostingExpDate}</strong>
                ) : (
                  <span>Berakhir pada <strong>{hostingExpDate}</strong></span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateToHosting(claim.service_code)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Server className="w-4 h-4" />
              Kelola File & Hosting
            </button>
            <button
              onClick={onNavigateToNodeJs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-xs transition cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              Buat Node.js API ({claim.subdomain}.1slabs.my.id/api)
            </button>
            <button
              onClick={onNavigateToDomains}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-xs transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              Kelola Domain & DNS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View when user is ELIGIBLE TO CLAIM
  return (
    <div className="w-full space-y-6">
      {/* Header Promo Banner - 1sLabs brand aesthetic (neutral dark, no blue, no AI badges) */}
      <div className="bg-neutral-900 dark:bg-gray-900 text-white border border-neutral-800 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Klaim Subdomain & Cloud Hosting Gratis 1sLabs
          </h1>
          <p className="text-neutral-300 dark:text-neutral-400 text-sm leading-relaxed">
            Dapatkan <strong>1 Subdomain resmi (.1slabs.my.id) gratis selama 1 tahun</strong> dan <strong>Cloud Hosting 14 hari</strong> dengan dukungan deployment Frontend website serta Node.js RESTful API langsung aktif tanpa perlu konfigurasi manual di cPanel.
          </p>
        </div>
      </div>

      {/* Benefits Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-3">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Free Subdomain</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            1 Subdomain eksklusif <code>nama.1slabs.my.id</code> aktif selama <strong>1 Tahun Penuh</strong>.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-3">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Free Hosting 14 Hari</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Storage SSD NVMe 5 GB, 2 database MariaDB/MySQL, dan unmetered bandwidth.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Node.js API Ready</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Dukungan deployment Express/Fastify backend di endpoint <code>/api</code> pada domain yang sama.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Auto-SSL Terintegrasi</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sertifikat SSL Let&apos;s Encrypt aktif otomatis untuk mengamankan koneksi HTTPS pengunjung.
          </p>
        </div>
      </div>

      {/* Claim Form Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-900 dark:text-white" />
          Pilih Nama Subdomain Gratis Anda
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Masukkan nama subdomain yang ingin Anda gunakan. Sistem akan memeriksa ketersediaannya secara realtime di server.
        </p>

        <form onSubmit={handleClaim} className="space-y-6">
          {/* Subdomain Input with Suffix */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
              Nama Subdomain
            </label>
            <div className="relative flex rounded-xl shadow-xs overflow-hidden border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600 focus-within:border-transparent">
              <input
                type="text"
                value={subdomainInput}
                onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="namadomain"
                disabled={isClaiming}
                maxLength={32}
                className="block w-full px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder-gray-400"
              />
              <span className="inline-flex items-center px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm select-none border-l border-gray-300 dark:border-gray-700">
                .1slabs.my.id
              </span>
            </div>

            {/* Realtime Check Indicator */}
            <div className="mt-2 min-h-[24px]">
              {checkingSubdomain && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memeriksa ketersediaan subdomain di server...
                </div>
              )}

              {!checkingSubdomain && availResult && (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  availResult.available
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {availResult.available ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {availResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={isClaiming}
                className="mt-0.5 w-4 h-4 rounded text-black dark:text-white focus:ring-neutral-400 border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Saya menyetujui <strong>Ketentuan Program Free Plan 1sLabs</strong>: Free Plan berlaku 1 kali per akun seumur hidup, masa aktif hosting gratis 14 hari, dan subdomain gratis berlaku selama 1 tahun. Tidak diperkenankan untuk aktivitas phishing, malware, atau konten ilegal.
              </span>
            </label>
          </div>

          {claimError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{claimError}</span>
            </div>
          )}

          {/* Claim Button - Professional Solid */}
          <button
            type="submit"
            disabled={!agreeTerms || !subdomainInput || !availResult?.available || isClaiming}
            className={`w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs ${
              agreeTerms && subdomainInput && availResult?.available && !isClaiming
                ? 'bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Provisioning Layanan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Klaim Free Plan Sekarang (Gratis)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Provisioning Progress Modal */}
      <AnimatePresence>
        {isClaiming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Menyiapkan Infrastruktur Hosting Anda
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Harap tunggu beberapa saat selagi sistem menghubungkan cPanel VirtualHost & DNS.
                </p>
              </div>

              {/* Steps Progress */}
              <div className="space-y-2.5">
                {claimSteps.map((stepText, idx) => {
                  const isDone = claimStep > idx;
                  const isCurrent = claimStep === idx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 text-xs p-2.5 rounded-xl transition ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : isCurrent
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700 shrink-0" />
                      )}
                      <span>{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
