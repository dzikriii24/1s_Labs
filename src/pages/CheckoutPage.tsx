import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Globe,
  Check,
  XCircle,
  Mail,
  RefreshCw
} from 'lucide-react';
import { api, HostingPlan } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const CheckoutPage: React.FC = () => {
  const { planSlug } = useParams<{ planSlug: string }>();
  const [plan, setPlan] = useState<HostingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Domain state
  const [domain, setDomain] = useState('');
  const [domainType, setDomainType] = useState<'new' | 'existing'>('existing');
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [domainCheckStatus, setDomainCheckStatus] = useState<{ available: boolean; message: string } | null>(null);

  // Email verification resend state
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Free Plan status
  const [freePlanClaimed, setFreePlanClaimed] = useState(false);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

  // Redirect domain-only plan to dedicated domain checkout
  useEffect(() => {
    if (planSlug === 'subdomain-1slabs') {
      navigate('/domain/checkout', { replace: true });
    }
  }, [planSlug, navigate]);

  // Check free plan claim status if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.freePlan.getStatus()
        .then((res) => {
          if (res.success && res.alreadyClaimed) {
            setFreePlanClaimed(true);
            setClaimedDomain(res.claim?.domain || null);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?redirect=/checkout/${planSlug || 'starter'}`);
    }
  }, [isAuthenticated, authLoading, navigate, planSlug]);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.plans.getBySlugOrId(planSlug || 'starter');
        if (res.success && res.plan) {
          setPlan(res.plan);
        } else {
          setError('Paket hosting tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail paket.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planSlug]);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleCheckDomain = async () => {
    if (!domain.trim()) {
      setDomainCheckStatus({ available: false, message: 'Masukkan nama domain terlebih dahulu.' });
      return;
    }

    setIsCheckingDomain(true);
    setDomainCheckStatus(null);

    try {
      const res = await api.orders.checkDomain(domain.trim());
      setDomainCheckStatus({
        available: res.available,
        message: res.message
      });
      if (res.domain) {
        setDomain(res.domain);
      }
    } catch (err: any) {
      setDomainCheckStatus({
        available: false,
        message: err.message || 'Domain tidak dapat digunakan atau format tidak valid.'
      });
    } finally {
      setIsCheckingDomain(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    setResendStatus(null);
    try {
      const res = await resendVerification(user?.email);
      setResendStatus(res.message || 'Tautan verifikasi baru berhasil dikirim ke email Anda.');
    } catch (err: any) {
      setResendStatus(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    if (!user?.email_verified) {
      setError('Alamat email Anda belum diverifikasi. Harap verifikasi email Anda terlebih dahulu.');
      return;
    }

    if (!domain.trim()) {
      setError('Nama domain untuk layanan hosting wajib diisi.');
      return;
    }

    if (domainCheckStatus && !domainCheckStatus.available) {
      setError('Domain yang Anda masukkan tidak tersedia atau mengalami konflik pada sistem. Silakan ganti domain.');
      return;
    }

    if (!agreedToTerms) {
      setError('Anda harus menyetujui ketentuan layanan sebelum melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.orders.create({
        plan_id: plan.id,
        domain: domain.trim(),
        domain_type: domainType,
        type: 'new',
        customer_notes: customerNotes
      });

      if (res.success && res.order) {
        navigate(`/payment/${res.order.orderNumber}`);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500">Mempersiapkan rincian checkout...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="max-w-md mx-auto my-24 text-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-4">{error || 'Paket hosting tidak ditemukan.'}</p>
          <Link to="/#hosting" className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-semibold">
            Kembali ke Katalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[1100px] w-full mx-auto my-8">
        <div className="mb-6 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <Link to={`/hosting/plan/${plan.slug}`} className="hover:underline">{plan.name}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Checkout Pemesanan</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white">
          Checkout Pemesanan Hosting
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Lengkapi domain layanan dan periksa rincian pesanan Anda sebelum melanjutkan ke pembayaran manual.
        </p>

        {/* Email verification warning if customer is unverified */}
        {user && !user.email_verified && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-start space-x-3 text-sm">
              <Mail className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Email Anda Belum Terverifikasi ({user.email})</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Sesuai kebijakan keamanan 1sLabs, akun dengan email belum diverifikasi tidak dapat menerbitkan pesanan. Silakan klik tautan verifikasi yang telah kami kirimkan ke email Anda.
                </p>
                {resendStatus && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                    {resendStatus}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingEmail}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isResendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kirim Ulang Email</span>
                  </>
                )}
              </button>
              <Link
                to="/verify-email"
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-all"
              >
                Input Token
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* If user tries to order free plan but has already claimed */}
        {(plan.slug === 'free-hosting' || parseFloat(plan.price) === 0) && freePlanClaimed ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Anda Sudah Mengklaim Free Plan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Akun Anda (<strong className="text-gray-900 dark:text-white">{user?.email}</strong>) sudah pernah mengklaim fasilitas Free Hosting Trial sebelumnya untuk domain <strong className="font-mono text-blue-600">{claimedDomain || 'dzikri.1slabs.my.id'}</strong>. Sesuai ketentuan 1sLabs, program gratis hanya dapat diklaim 1 kali per akun seumur hidup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/portal?tab=hosting"
                className="w-full sm:w-auto px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
              >
                <span>Kelola Layanan di Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/#hosting"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Lihat Paket Hosting Lain
              </Link>
            </div>
          </div>
        ) : (plan.slug === 'free-hosting' || parseFloat(plan.price) === 0) ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Klaim Free Plan Instan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Program Free Hosting (Trial 14 Hari) dan Subdomain gratis diproses otomatis secara realtime melalui panel Free Plan kami tanpa perlu konfirmasi manual atau pembayaran.
            </p>
            <Link
              to="/portal?tab=freeplan"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2"
            >
              <span>Buka Panel Klaim Free Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Plan, Domain & Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Mandatory Domain Registration Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Pendaftaran Domain Layanan (Wajib)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tentukan nama domain yang akan dikonfigurasikan pada paket hosting ini.
                  </p>
                </div>
              </div>

              {/* Domain Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <label
                  onClick={() => setDomainType('existing')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 text-xs ${
                    domainType === 'existing'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800/80 font-semibold'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="domainType"
                    checked={domainType === 'existing'}
                    onChange={() => setDomainType('existing')}
                    className="mt-0.5 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-gray-900 dark:text-white block font-medium">Domain yang Sudah Dimiliki</span>
                    <span className="text-gray-500 text-[11px]">Saya akan mengarahkan DNS domain ke nameserver 1sLabs.</span>
                  </div>
                </label>

                <label
                  onClick={() => setDomainType('new')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 text-xs ${
                    domainType === 'new'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800/80 font-semibold'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="domainType"
                    checked={domainType === 'new'}
                    onChange={() => setDomainType('new')}
                    className="mt-0.5 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-gray-900 dark:text-white block font-medium">Registrasi Domain Baru</span>
                    <span className="text-gray-500 text-[11px]">Daftarkan nama domain baru bersama layanan hosting.</span>
                  </div>
                </label>
              </div>

              {/* Domain Input Field with Validation */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Nama Domain
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={domain}
                      onChange={(e) => {
                        setDomain(e.target.value.toLowerCase().replace(/\s+/g, ''));
                        setDomainCheckStatus(null);
                      }}
                      placeholder="contoh: bisnisanda.com atau portfolio.my.id"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckDomain}
                    disabled={isCheckingDomain || !domain.trim()}
                    className="px-5 py-3 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    {isCheckingDomain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memeriksa...</span>
                      </>
                    ) : (
                      <span>Cek Ketersediaan</span>
                    )}
                  </button>
                </div>

                {domainCheckStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                      domainCheckStatus.available
                        ? 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {domainCheckStatus.available ? (
                      <Check className="w-4 h-4 flex-shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    )}
                    <span>{domainCheckStatus.message}</span>
                  </motion.div>
                )}

                <p className="text-[11px] text-gray-500">
                  Domain akan otomatis direservasi secara atomik untuk pesanan Anda selama 24 jam dan langsung dikonfigurasi saat pembayaran disetujui.
                </p>
              </div>
            </div>

            {/* 2. Selected Plan Snapshot */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                    <p className="text-xs text-gray-500">{plan.target}</p>
                  </div>
                </div>
                <Link
                  to={`/hosting/plan/${plan.slug}`}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  Ubah Paket
                </Link>
              </div>

              <div className="py-4 space-y-2.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Penyimpanan NVMe:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.storage_gb === -1 ? 'Unlimited Storage' : `${plan.storage_gb} GB`}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Database MySQL:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.databases_count === -1 ? 'Unlimited Databases' : `${plan.databases_count} Database`}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Bandwidth:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{plan.bandwidth}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Sertifikat SSL:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{plan.ssl_type}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Masa Langganan:</span>
                  <span className="font-medium text-gray-900 dark:text-white">1 Tahun (365 Hari)</span>
                </div>
              </div>
            </div>

            {/* 3. Customer Details */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Identitas Pemesan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Nama Pemesan:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Email Akun:</span>
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center space-x-1.5">
                    <span>{user?.email}</span>
                    {user?.email_verified ? (
                      <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 font-bold">
                        Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        Belum Verifikasi
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Nomor WhatsApp:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.phone ? `+${user.phone}` : 'Wajib diisi'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Metode Pembayaran:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Manual QRIS / Transfer Bank</span>
                </div>
              </div>
            </div>

            {/* 4. Notes */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Catatan Tambahan untuk Tim Engineer (Opsional)
              </label>
              <textarea
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Contoh: Tolong siapkan konfigurasi PHP 8.2 atau bantuan pemindahan database dari hosting lama."
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Right Column: Authoritative Cost Breakdown & Checkout Submit */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 sticky top-24 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Rincian Tagihan Resmi
              </h2>

              {(() => {
                const basePrice = parseFloat(plan.price);
                const ppnAmount = Math.round(basePrice * 0.11);
                const totalAmount = basePrice + ppnAmount;

                return (
                  <>
                    <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Harga Paket (1 Tahun)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">PPN (11%)</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(ppnAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Domain ({domain || 'Belum diisi'})</span>
                        <span className="font-semibold text-emerald-600">Termasuk (Rp 0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Biaya Verifikasi Manual</span>
                        <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
                      </div>
                    </div>

                    <div className="py-4 flex justify-between items-baseline border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">Total Tagihan:</span>
                        <span className="text-[11px] text-gray-400">Total Akhir (Server Authoritative)</span>
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </>
                );
              })()}

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
                    Saya menyetujui ketentuan layanan 1sLabs bahwa layanan hosting akan aktif segera setelah bukti transfer diverifikasi sah oleh admin.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms || !user?.email_verified || !domain.trim()}
                className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Pesanan...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran QRIS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!user?.email_verified && (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  * Verifikasi email diperlukan untuk mengaktifkan tombol pemesanan.
                </p>
              )}

              <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Transaksi Aman & Terverifikasi 1sLabs</span>
              </div>
            </div>
          </div>
        </form>
        )}
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
