import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Server,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';
import { api, FreePlanClaim } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const DomainCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const initialSubdomain = (searchParams.get('subdomain') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const initialTier = searchParams.get('tier') === 'paid' ? 'paid' : 'free';

  const [subdomain, setSubdomain] = useState(initialSubdomain);
  const [selectedTier, setSelectedTier] = useState<'free' | 'paid'>(initialTier);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Availability checking state
  const [isChecking, setIsChecking] = useState(false);
  const [availResult, setAvailResult] = useState<{
    available: boolean;
    message: string;
    subdomain?: string;
    domain?: string;
  } | null>(null);

  // Free Plan claim status state
  const [statusLoading, setStatusLoading] = useState(true);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Free Plan step modal
  const [claimStep, setClaimStep] = useState(0);
  const [claimProgressModal, setClaimProgressModal] = useState(false);

  const claimSteps = [
    'Validasi Otorisasi & Format Subdomain...',
    'Memeriksa Ketersediaan DNS di Server cPanel...',
    'Provisioning Subdomain *.1slabs.my.id di VirtualHost...',
    'Menyiapkan Document Root & Auto-SSL Let\'s Encrypt...',
    'Mengaktifkan Layanan Domain 1 Bulan & Siap Digunakan!'
  ];

  // Fetch free plan status for the user
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      api.freePlan.getStatus()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.alreadyClaimed) {
            setAlreadyClaimed(true);
            setClaimedDomain(res.claim?.domain || null);
            setSelectedTier('paid'); // Auto fallback to paid if already claimed
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setStatusLoading(false);
        });
    } else {
      setStatusLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Real-time debounced availability check
  useEffect(() => {
    const clean = subdomain.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setAvailResult(null);
      setIsChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await api.freePlan.checkSubdomain(clean);
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
        setIsChecking(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleManualCheck = async () => {
    const clean = subdomain.trim().toLowerCase();
    if (!clean) return;
    setIsChecking(true);
    setAvailResult(null);
    try {
      const res = await api.freePlan.checkSubdomain(clean);
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
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      const currentUrl = `/domain/checkout?subdomain=${encodeURIComponent(subdomain)}&tier=${selectedTier}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const clean = subdomain.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setError('Masukkan nama subdomain minimal 3 karakter.');
      return;
    }

    if (!availResult || !availResult.available) {
      setError('Nama subdomain belum divalidasi atau tidak tersedia. Harap pilih nama lain.');
      return;
    }

    if (!agreedToTerms) {
      setError('Anda wajib menyetujui ketentuan layanan registrasi domain 1sLabs.');
      return;
    }

    if (selectedTier === 'free') {
      if (alreadyClaimed) {
        setError('Akun Anda sudah pernah mengklaim program Domain Gratis. Silakan pilih opsi Subdomain Pro.');
        return;
      }

      setIsSubmitting(true);
      setClaimProgressModal(true);
      setClaimStep(0);

      // Animate progress steps
      const stepTimer1 = setTimeout(() => setClaimStep(1), 800);
      const stepTimer2 = setTimeout(() => setClaimStep(2), 1600);
      const stepTimer3 = setTimeout(() => setClaimStep(3), 2400);

      try {
        const res = await api.freePlan.claim(clean, true);
        setClaimStep(4);
        setTimeout(() => {
          navigate('/portal?tab=domains&claimed=true');
        }, 1200);
      } catch (err: any) {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        setClaimProgressModal(false);
        setError(err.message || 'Gagal memproses klaim domain gratis. Silakan coba kembali.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Subdomain Pro (Paid)
      setIsSubmitting(true);
      try {
        const fullDomain = `${clean}.1slabs.my.id`;
        const res = await api.orders.create({
          plan_id: 6, // Plan ID 6: Subdomain .1slabs.my.id (Rp 10.000 / bulan)
          domain: fullDomain,
          domain_type: 'new',
          type: 'new',
          customer_notes: 'Registrasi Subdomain Pro .1slabs.my.id'
        });

        if (res.success && res.order) {
          navigate(`/payment/${res.order.orderNumber}`);
        } else {
          setError(res.message || 'Gagal menerbitkan pesanan subdomain.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memproses pesanan subdomain. Silakan coba kembali.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const basePrice = selectedTier === 'free' ? 0 : 10000;
  const ppn = selectedTier === 'free' ? 0 : Math.round(basePrice * 0.11);
  const total = basePrice + ppn;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[1100px] w-full mx-auto my-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <Link to="/#hosting" className="hover:underline">Domain &amp; Hosting</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Checkout Domain .1slabs.my.id</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>Dedicated Domain Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Pendaftaran &amp; Checkout Domain .1slabs.my.id
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            Pilih jenis paket, periksa ketersediaan nama subdomain Anda secara realtime, dan aktifkan domain kustom Anda secara instan di server cloud 1sLabs.
          </p>
        </div>

        {/* User Already Claimed Alert Banner */}
        {alreadyClaimed && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-blue-900 dark:text-blue-200">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-bold">Informasi Status Program Free Plan</p>
                <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                  Akun Anda telah mengklaim domain gratis <strong className="font-mono">{claimedDomain || 'dzikri.1slabs.my.id'}</strong> sebelumnya. Untuk mendaftarkan nama subdomain baru, silakan pilih opsi <strong>Subdomain Pro (Rp 10.000 / bulan)</strong>.
                </p>
              </div>
            </div>
            <Link
              to="/portal?tab=domains"
              className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <span>Kelola di Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form & Settings */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Subdomain Checker Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Pilih &amp; Cek Nama Subdomain
                  </h2>
                  <p className="text-xs text-gray-500">
                    Ketikkan nama identitas website atau API yang Anda inginkan di bawah domain <code className="font-mono text-blue-600">.1slabs.my.id</code>.
                  </p>
                </div>
              </div>

              {/* Subdomain Input with Suffix */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Nama Subdomain
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all">
                    <span className="pl-3.5 pr-2 text-xs font-mono text-gray-400 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      required
                      value={subdomain}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setSubdomain(val);
                        setAvailResult(null);
                      }}
                      placeholder="namasaya"
                      className="w-full py-3 bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none font-mono"
                    />
                    <span className="pr-4 pl-2 text-xs font-bold text-blue-600 dark:text-blue-400 select-none font-mono">
                      .1slabs.my.id
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={isChecking || !subdomain.trim()}
                    className="px-5 py-3 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memeriksa...</span>
                      </>
                    ) : (
                      <span>Cek Ketersediaan</span>
                    )}
                  </button>
                </div>

                {/* Subdomain Availability Feedback */}
                {availResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
                      availResult.available
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {availResult.available ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-medium">{availResult.message}</span>
                  </motion.div>
                )}

                <p className="text-[11px] text-gray-500">
                  Gunakan minimal 3 karakter huruf kecil (a-z) atau angka (0-9). Tanda strip (-) diperbolehkan di tengah.
                </p>
              </div>
            </div>

            {/* 2. Tier Selection: Free Subdomain vs Subdomain Pro */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                Pilih Tipe Paket Domain
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                Tentukan apakah Anda ingin memanfaatkan uji coba gratis 1 bulan atau berlangganan paket pro tanpa batas klaim.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Free Subdomain Trial */}
                <div
                  onClick={() => {
                    if (!alreadyClaimed) setSelectedTier('free');
                  }}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    alreadyClaimed
                      ? 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 opacity-70 cursor-not-allowed'
                      : selectedTier === 'free'
                      ? 'border-black dark:border-white bg-blue-50/30 dark:bg-blue-950/20 shadow-sm cursor-pointer ring-1 ring-black dark:ring-white'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Trial 1 Bulan
                    </span>
                    <input
                      type="radio"
                      name="domainTier"
                      disabled={alreadyClaimed}
                      checked={selectedTier === 'free'}
                      onChange={() => setSelectedTier('free')}
                      className="text-black focus:ring-black"
                    />
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    Free Subdomain (Trial)
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      Rp 0
                    </span>
                    <span className="text-xs text-gray-500">/ 1 bulan</span>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3">
                    Fasilitas khusus pengguna baru untuk mencoba ekosistem 1sLabs tanpa biaya registrasi.
                  </p>

                  <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Aktif 1 Bulan Penuh</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Auto-SSL Aktif Otomatis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Limit 1x Klaim per Akun</span>
                    </div>
                  </div>

                  {alreadyClaimed && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Sudah pernah diklaim oleh akun Anda</span>
                    </div>
                  )}
                </div>

                {/* Option 2: Subdomain Pro (Paid) */}
                <div
                  onClick={() => setSelectedTier('paid')}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedTier === 'paid'
                      ? 'border-black dark:border-white bg-blue-50/30 dark:bg-blue-950/20 shadow-sm ring-1 ring-black dark:ring-white'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                      Fleksibel &amp; Mandiri
                    </span>
                    <input
                      type="radio"
                      name="domainTier"
                      checked={selectedTier === 'paid'}
                      onChange={() => setSelectedTier('paid')}
                      className="text-black focus:ring-black"
                    />
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    Subdomain Pro (.1slabs.my.id)
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                      Rp 10.000
                    </span>
                    <span className="text-xs text-gray-500">/ bulan</span>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-3">
                    Daftarkan subdomain kustom tambahan tanpa batas kuota akun, dapat diperpanjang berkala.
                  </p>

                  <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span>Bebas Kuota (Multi Subdomain)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span>Perpanjangan Bulanan Fleksibel</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span>Akses DNS Records Mandiri</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Domain Technical Specs (Authoritative, no hosting junk) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Spesifikasi &amp; Konfigurasi DNS Domain
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 block mb-0.5">Format Domain Target:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {subdomain ? `${subdomain}.1slabs.my.id` : 'subdomain.1slabs.my.id'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Server Nameservers:</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">
                    ns1.domainmurah.net, ns2.domainmurah.net
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Sertifikat Keamanan:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Auto-SSL Let's Encrypt (HTTPS Otomatis)
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Durasi Layanan:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTier === 'free' ? '1 Bulan (Trial Pengguna Baru)' : '1 Bulan (Dapat Diperpanjang)'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 sticky top-24 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Rincian Tagihan Domain
              </h2>

              <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Domain</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {subdomain ? `${subdomain}.1slabs.my.id` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paket</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTier === 'free' ? 'Free Subdomain (1 Bulan)' : 'Subdomain Pro (1 Bulan)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Harga Layanan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(basePrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PPN (11%)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(ppn)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Setup &amp; DNS Provisioning</span>
                  <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="py-4 flex justify-between items-baseline border-b border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Total Pembayaran:
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {selectedTier === 'free' ? 'Promo Pengguna Baru (100% OFF)' : 'Metode Pembayaran QRIS'}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-4 pb-6">
                <label className="flex items-start space-x-3 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-black focus:ring-black dark:border-gray-700"
                  />
                  <span>
                    Saya menyetujui ketentuan layanan 1sLabs bahwa nama subdomain ini akan digunakan secara sah dan terikat pada kebijakan platform.
                  </span>
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms || !subdomain.trim() || (availResult && !availResult.available)}
                className={`w-full py-3.5 px-4 font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer ${
                  selectedTier === 'free'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : selectedTier === 'free' ? (
                  <>
                    <span>Aktifkan Subdomain Gratis Sekarang</span>
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran QRIS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Terintegrasi Langsung ke Server Cloud 1sLabs</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Free Plan Step Modal Animation */}
      <AnimatePresence>
        {claimProgressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Mengaktifkan Domain Gratis
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-mono">
                {subdomain}.1slabs.my.id
              </p>

              <div className="space-y-3 text-left">
                {claimSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      {claimStep > idx ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : claimStep === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                      )}
                    </div>
                    <span className={claimStep === idx ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};

export default DomainCheckoutPage;

