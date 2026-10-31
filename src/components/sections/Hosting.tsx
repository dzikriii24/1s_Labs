"use client";
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Globe,
  Check,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Info,
  AlertCircle,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api, HostingPlan as ApiHostingPlan } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface HostingPlanItem {
  id: string | number;
  slug?: string;
  name: string;
  target: string;
  price: string | number;
  period: string;
  description: string;
  is_recommended?: boolean | number;
  isRecommended?: boolean;
  features: string[];
  ctaText?: string;
}

const defaultHostingPlans: HostingPlanItem[] = [
  {
    id: 1,
    slug: 'starter',
    name: 'Starter Hosting',
    target: 'Ideal for Landing Pages & Company Profiles',
    price: '750000',
    period: '/ tahun',
    description: 'Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional.',
    features: [
      '30 GB High-Speed NVMe SSD Storage',
      '10 MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free SSL Certificate (Auto-SSL)',
      'Akses cPanel & File Manager Mandiri',
      'Bantuan Setup & Deployment Gratis',
      'Dukungan Teknis via WhatsApp Standar',
      'Garansi Uptime Server 99.9%'
    ],
    ctaText: 'Pilih Starter Hosting'
  },
  {
    id: 2,
    slug: 'business',
    name: 'Business Hosting',
    target: 'Best for Growing Companies & Active UMKM',
    price: '970000',
    period: '/ tahun',
    description: 'Pilihan paling populer dengan kapasitas penyimpanan 60 GB, 25 database, dan backup otomatis berkala.',
    is_recommended: 1,
    features: [
      '60 GB High-Speed NVMe SSD Storage',
      '25 MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free SSL Certificate (Auto-SSL)',
      'Akses cPanel Penuh & phpMyAdmin',
      'Backup Otomatis Mingguan (Weekly Cloud)',
      'Bantuan Setup & Konfigurasi Domain DNS',
      'Optimasi Kecepatan (LiteSpeed Caching)',
      'Dukungan Teknis Prioritas via WhatsApp'
    ],
    ctaText: 'Pilih Business Hosting'
  },
  {
    id: 3,
    slug: 'professional',
    name: 'Professional Hosting',
    target: 'For High-Traffic Sites & Critical Portals',
    price: '1120000',
    period: '/ tahun',
    description: 'Performa maksimal dengan unlimited storage dan dukungan prioritas untuk portal bisnis dengan lalu lintas tinggi.',
    features: [
      'Unlimited High-Speed NVMe SSD Storage',
      'Unlimited MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free Commercial SSL Certificate',
      'Resource CPU & RAM Lebih Tinggi (High-Performance)',
      'Backup Otomatis Harian (Daily Cloud)',
      'Bantuan Penuh Migrasi Website & Deployment',
      'Dukungan VIP Fast-Response via WhatsApp',
      'Proactive Monitoring & Security Audit'
    ],
    ctaText: 'Pilih Professional Hosting'
  }
];

export const Hosting: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activeCategory, setActiveCategory] = useState<'hosting' | 'domain'>('hosting');
  const [plans, setPlans] = useState<HostingPlanItem[]>(defaultHostingPlans);

  // Free Plan claim status state
  const [freePlanClaimed, setFreePlanClaimed] = useState<boolean>(false);
  const [claimedDomain, setClaimedDomain] = useState<string | null>(null);

  // Alert Modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');

  // Domain Tab Quick Checker State
  const [quickSubdomain, setQuickSubdomain] = useState('');
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    available: boolean;
    message: string;
    subdomain?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const res = await api.plans.getAll();
        if (res.success && res.plans && res.plans.length > 0 && isMounted) {
          setPlans(res.plans);
        }
      } catch (e) {
        console.error('Failed to load dynamic hosting plans, using defaults:', e);
      }
    };
    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch free plan status if authenticated
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      api.freePlan.getStatus()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.alreadyClaimed) {
            setFreePlanClaimed(true);
            setClaimedDomain(res.claim?.domain || null);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const formatPrice = (val: string | number) => {
    if (typeof val === 'string' && val.trim().startsWith('Rp')) return val;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val.toString();
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleFreeTrialClick = () => {
    if (freePlanClaimed) {
      setModalTitle('Anda Sudah Mengklaim Free Plan');
      setModalBody(
        `Akun Anda (${user?.email || 'saat ini'}) sudah pernah mengklaim program Free Trial sebelumnya untuk domain ${
          claimedDomain ? `"${claimedDomain}"` : 'dzikri.1slabs.my.id'
        }. Setiap akun hanya berhak mengklaim 1 kali seumur hidup. Anda dapat mengelola layanan aktif Anda langsung melalui Customer Portal.`
      );
      setAlertModalOpen(true);
      return;
    }

    if (isAuthenticated) {
      navigate('/portal?tab=freeplan');
    } else {
      navigate('/login?redirect=/portal?tab=freeplan');
    }
  };

  const handleFreeDomainClick = () => {
    if (freePlanClaimed) {
      setModalTitle('Anda Sudah Mengklaim Domain Gratis');
      setModalBody(
        `Akun Anda (${user?.email || 'saat ini'}) telah menggunakan kuota Domain Gratis 1 Bulan untuk "${
          claimedDomain || 'dzikri.1slabs.my.id'
        }". Anda tetap dapat mendaftarkan nama subdomain baru menggunakan opsi Subdomain Pro (Rp 10.000 / bulan).`
      );
      setAlertModalOpen(true);
      return;
    }

    if (isAuthenticated) {
      navigate('/domain/checkout?tier=free');
    } else {
      navigate('/login?redirect=/domain/checkout?tier=free');
    }
  };

  const handleQuickCheckSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean || clean.length < 3) {
      setCheckResult({
        available: false,
        message: 'Masukkan nama subdomain minimal 3 karakter (huruf/angka).'
      });
      return;
    }

    setIsCheckingSubdomain(true);
    setCheckResult(null);

    try {
      const res = await api.freePlan.checkSubdomain(clean);
      setCheckResult({
        available: res.available,
        message: res.message,
        subdomain: clean
      });
    } catch (err: any) {
      setCheckResult({
        available: false,
        message: err.message || 'Gagal memeriksa ketersediaan subdomain.'
      });
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  // Filter hosting plans (exclude domain-only plans like subdomain-1slabs)
  const hostingPlans = plans.filter((p) => p.slug !== 'subdomain-1slabs');

  return (
    <section id="hosting" className="py-10 sm:py-20 md:py-28 bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Server className="w-3.5 h-3.5" />
            <span>Cloud Infrastructure &amp; Domains</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-4 tracking-tight font-['Mori',_sans-serif]">
            Infrastruktur Cloud &amp; Domain 1sLabs
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            Penyimpanan NVMe ultra cepat, proteksi SSL Let's Encrypt gratis, dukungan Node.js backend mandiri, dan registrasi domain kustom langsung terhubung.
          </p>

          {/* Category Tabs Switcher (Hosting vs Domain) */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveCategory('hosting')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeCategory === 'hosting'
                    ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Paket Cloud Hosting</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('domain')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeCategory === 'domain'
                    ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Domain .1slabs.my.id</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* TAB CONTENT: CLOUD HOSTING */}
        {activeCategory === 'hosting' && (
          <div className="space-y-12">
            {/* Hosting Plans Grid */}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-8 items-stretch max-w-7xl mx-auto">
              {hostingPlans.map((plan, index) => {
                const isRecommended = Boolean(plan.is_recommended ?? plan.isRecommended);
                const isFreePlan = plan.slug === 'free-hosting' || parseFloat(String(plan.price)) === 0;
                const planSlugOrId = plan.slug || plan.id.toString();

                return (
                  <motion.div
                    key={plan.id || plan.slug || index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.12 }}
                    className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 flex flex-col justify-between transition-all duration-300 ${
                      isRecommended
                        ? 'bg-neutral-900 text-white dark:bg-neutral-800 border-2 border-blue-500 shadow-xl shadow-blue-500/10 md:-translate-y-3'
                        : isFreePlan
                        ? 'bg-white dark:bg-neutral-900/70 text-neutral-900 dark:text-white border-2 border-emerald-500/50 shadow-md hover:border-emerald-500'
                        : 'bg-white dark:bg-neutral-900/70 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg'
                    }`}
                  >
                    {/* Badges */}
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-xs flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Recommended
                      </div>
                    )}

                    {isFreePlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-xs flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Trial 14 Hari
                      </div>
                    )}

                    <div>
                      {/* Plan Title & Target */}
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg sm:text-2xl font-bold tracking-tight mb-0.5 font-['Mori',_sans-serif]">
                            {plan.name}
                          </h3>
                          {isFreePlan && freePlanClaimed && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                              Sudah Diklaim
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] sm:text-xs font-medium ${isRecommended ? 'text-blue-300' : isFreePlan ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {plan.target}
                        </p>
                      </div>

                      {/* Price Display */}
                      <div className="flex items-baseline gap-1 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-neutral-200/40 dark:border-neutral-700/50">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-['Mori',_sans-serif]">
                          {formatPrice(plan.price)}
                        </span>
                        <span className={`text-xs sm:text-sm ${isRecommended ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {plan.period || '/ tahun'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className={`text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed ${isRecommended ? 'text-neutral-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
                        {plan.description}
                      </p>

                      {/* Features List */}
                      <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                        <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 ${isRecommended ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          Fasilitas Termasuk:
                        </div>
                        {Array.isArray(plan.features) ? plan.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isRecommended
                                ? 'bg-blue-500 text-white'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                            <span className={isRecommended ? 'text-neutral-200' : 'text-neutral-700 dark:text-neutral-300'}>
                              {feature}
                            </span>
                          </div>
                        )) : null}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-2 pt-4">
                      {isFreePlan ? (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={handleFreeTrialClick}
                          className={`w-full py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                            freePlanClaimed
                              ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-0'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-0'
                          }`}
                        >
                          {freePlanClaimed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Sudah Diklaim (Kelola di Portal)</span>
                            </>
                          ) : (
                            <>
                              <span>Coba Gratis Sekarang (14 Hari)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant={isRecommended ? 'primary' : 'secondary'}
                          size="md"
                          onClick={() => navigate(`/checkout/${planSlugOrId}`)}
                          className={`w-full py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                            isRecommended
                              ? 'bg-blue-600 hover:bg-blue-500 text-white border-0'
                              : ''
                          }`}
                        >
                          <span>{plan.ctaText || `Pilih ${plan.name}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {!isFreePlan && (
                        <Link
                          to={`/hosting/plan/${planSlugOrId}`}
                          className={`block text-center text-[11px] font-medium py-1.5 hover:underline ${
                            isRecommended ? 'text-blue-300' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          Lihat Spesifikasi &amp; Detail Teknis
                        </Link>
                      )}

                      <p className={`text-center text-[10px] sm:text-[11px] ${isRecommended ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Termasuk bantuan konfigurasi DNS &amp; Auto-SSL
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: DOMAIN .1SLABS.MY.ID */}
        {activeCategory === 'domain' && (
          <div className="space-y-10 max-w-5xl mx-auto">
            {/* Realtime Subdomain Availability Checker Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white dark:bg-neutral-800 border border-neutral-800 shadow-xl"
            >
              <div className="max-w-2xl mx-auto text-center mb-6">
                <h3 className="text-lg sm:text-2xl font-bold tracking-tight mb-2 font-['Mori',_sans-serif]">
                  Cek Ketersediaan Subdomain Anda
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Dapatkan nama alamat website atau API instan berakhiran <span className="font-mono text-blue-400">.1slabs.my.id</span> langsung terhubung ke server cloud.
                </p>
              </div>

              <form onSubmit={handleQuickCheckSubdomain} className="max-w-xl mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center bg-white/10 dark:bg-black/30 border border-white/20 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 px-3">
                    <span className="text-xs font-mono text-neutral-400 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      value={quickSubdomain}
                      onChange={(e) => {
                        setQuickSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        setCheckResult(null);
                      }}
                      placeholder="namabisnisanda"
                      className="w-full py-3 px-2 bg-transparent text-sm font-semibold text-white focus:outline-none font-mono placeholder:text-neutral-500"
                    />
                    <span className="text-xs font-bold text-blue-400 select-none font-mono pr-2">
                      .1slabs.my.id
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingSubdomain || !quickSubdomain.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCheckingSubdomain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memeriksa...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Cek Nama</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Realtime Check Result Alert */}
                {checkResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      checkResult.available
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                        : 'bg-red-950/60 border border-red-800 text-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {checkResult.available ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                      )}
                      <span className="font-medium">{checkResult.message}</span>
                    </div>

                    {checkResult.available && (
                      <button
                        type="button"
                        onClick={() => navigate(`/domain/checkout?subdomain=${encodeURIComponent(checkResult.subdomain || '')}`)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                      >
                        <span>Daftarkan Sekarang</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Dedicated Domain Pricing Cards */}
            <div className="grid sm:grid-cols-2 gap-6 items-stretch">
              {/* Card 1: Free Subdomain (1 Bulan) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-emerald-500/40 hover:border-emerald-500 flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                      Gratis 1 Bulan
                    </span>
                    {freePlanClaimed && (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
                        Sudah Diklaim
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 font-['Mori',_sans-serif]">
                    Free Subdomain (Trial)
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                    Program Spesial Pengguna Baru (1x Klaim)
                  </p>

                  <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Mori',_sans-serif]">
                      Rp 0
                    </span>
                    <span className="text-xs text-gray-500">/ 1 bulan penuh</span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Coba subdomain eksklusif .1slabs.my.id secara gratis selama 1 bulan penuh tanpa biaya pendaftaran.
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>1 Subdomain Kustom (*.1slabs.my.id)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Masa Aktif 1 Bulan Penuh (Trial)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Auto-SSL Let's Encrypt Otomatis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>DNS Otomatis ke Cloud Server 1sLabs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Siap untuk Website Statis &amp; RESTful API</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleFreeDomainClick}
                    className={`w-full py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center space-x-1.5 ${
                      freePlanClaimed
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-0'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-0'
                    }`}
                  >
                    {freePlanClaimed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Sudah Diklaim (1x per Akun)</span>
                      </>
                    ) : (
                      <>
                        <span>Klaim Domain Gratis (1 Bulan)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Card 2: Subdomain Pro (.1slabs.my.id) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative p-6 sm:p-8 rounded-3xl bg-neutral-900 text-white dark:bg-neutral-800 border-2 border-blue-500 flex flex-col justify-between transition-all shadow-lg shadow-blue-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                      Bebas Kuota
                    </span>
                    <span className="text-[11px] font-semibold text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800">
                      Multi Domain
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mb-1 font-['Mori',_sans-serif]">
                    Subdomain Pro (.1slabs.my.id)
                  </h3>
                  <p className="text-xs text-blue-400 font-medium mb-3">
                    Bebas Kuota untuk Developer &amp; Bisnis
                  </p>

                  <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-neutral-700">
                    <span className="text-3xl sm:text-4xl font-extrabold font-['Mori',_sans-serif]">
                      Rp 10.000
                    </span>
                    <span className="text-xs text-neutral-400">/ bulan</span>
                  </div>

                  <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
                    Daftarkan subdomain kustom tambahan tanpa batasan kuota akun. Fleksibel diperpanjang setiap bulan.
                  </p>

                  <div className="space-y-2.5 mb-6 text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Bebas Kuota (Dapat Daftarkan Banyak Domain)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Perpanjangan Fleksibel Bulanan / Tahunan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Auto-SSL Let's Encrypt Otomatis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Akses Konfigurasi DNS &amp; Routing Penuh</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Dukungan Teknis Prioritas via WhatsApp</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/domain/checkout?tier=paid')}
                    className="w-full py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white border-0"
                  >
                    <span>Daftar Subdomain Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Custom Server & Migration Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 sm:mt-16 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-0.5 sm:mb-1">
                Butuh Server Khusus atau Migrasi Website Existing?
              </h4>
              <p className="text-[11px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Untuk aplikasi web dengan kebutuhan Virtual Private Server (VPS), backend Node.js / Python, database enterprise, atau pemindahan website lama, kami menyediakan penawaran kustom terpisah.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const text = encodeURIComponent('Halo 1sLabs, saya ingin konsultasi kebutuhan server kustom / migrasi website.');
              window.open(`https://wa.me/6285156296580?text=${text}`, '_blank');
            }}
            className="w-full sm:w-auto shrink-0 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 px-4 py-2 text-xs font-semibold"
          >
            Konsultasi Kustom <ExternalLink className="w-3.5 h-3.5 ml-1.5 inline" />
          </Button>
        </motion.div>

      </div>

      {/* Already Claimed Modal Alert */}
      <AnimatePresence>
        {alertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 text-center relative"
            >
              <button
                type="button"
                onClick={() => setAlertModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {modalTitle}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {modalBody}
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAlertModalOpen(false);
                    navigate('/portal?tab=hosting');
                  }}
                  className="flex-1 py-3 px-4 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl text-xs hover:opacity-90 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  <span>Buka Customer Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAlertModalOpen(false)}
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hosting;
