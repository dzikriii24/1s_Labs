import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Globe,
  LifeBuoy,
  RefreshCw,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api, HostingPlan } from '../services/api';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const HostingPlanDetailPage: React.FC = () => {
  const { planSlug } = useParams<{ planSlug: string }>();
  const [plan, setPlan] = useState<HostingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        setError(err.message || 'Gagal memuat spesifikasi paket hosting.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat spesifikasi teknis paket hosting...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="max-w-md mx-auto my-24 text-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paket Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">{error || 'Paket hosting yang Anda cari tidak tersedia.'}</p>
          <Link
            to="/#hosting"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[1200px] w-full mx-auto my-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <Link to="/#hosting" className="hover:underline">Layanan Hosting</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">{plan.name}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              {plan.is_recommended ? (
                <span className="inline-block px-3 py-1 bg-black text-white dark:bg-white dark:text-black rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                  Paling Populer & Direkomendasikan
                </span>
              ) : null}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
                {plan.name}
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {plan.description}
              </p>
              <div className="inline-flex items-center space-x-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 bg-white dark:bg-gray-800 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Target: {plan.target}</span>
              </div>
            </div>

            {/* Price & Action Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 min-w-[280px] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Biaya Berlangganan</span>
                <div className="flex items-baseline mt-1 mb-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1.5">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  Siklus penagihan per 12 bulan. Pembayaran melalui QRIS dengan verifikasi langsung.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => navigate(`/checkout/${plan.slug}`)}
                  className="w-full py-3 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Pesan Paket Ini</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={`https://wa.me/6285156296580?text=${encodeURIComponent(`Halo 1sLabs, saya ingin konsultasi teknis terkait paket ${plan.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs transition-all flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-700"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Konsultasi Teknis via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specification Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Spesifikasi & Fasilitas Lengkap</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Storage */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Penyimpanan Server</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.storage_gb === -1 ? 'Unlimited NVMe SSD' : `${plan.storage_gb} GB High-Speed NVMe`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Penyimpanan berbasis solid state drive generasi terbaru untuk akses baca/tulis super cepat.
              </p>
            </div>

            {/* Database */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Alokasi Database</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.databases_count === -1 ? 'Unlimited MySQL Databases' : `${plan.databases_count} Database MySQL`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Akses penuh phpMyAdmin untuk manajemen skema tabel, relasi, dan ekspor/impor data.
              </p>
            </div>

            {/* Bandwidth */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Bandwidth Bulanan</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.bandwidth} (Tanpa Kuota Terbatas)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Lalu lintas transfer data tanpa biaya overage tambahan dengan koneksi port 1Gbps.
              </p>
            </div>

            {/* SSL */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Keamanan SSL</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.ssl_type}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Otomatis mengamankan koneksi HTTPS dengan auto-renewal, melindungi transaksi data pengguna.
              </p>
            </div>

            {/* Backup */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Pencadangan (Backup)</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.backup_frequency}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Snapshot file dan database disimpan terpisah pada penyimpanan cloud cadangan.
              </p>
            </div>

            {/* Email */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Email Bisnis</h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.email_accounts || 'Akun Email Domain Mandiri'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Buat email profesional dengan domain sendiri (contoh: info@domainanda.com) via Webmail cPanel.
              </p>
            </div>
          </div>
        </div>

        {/* Feature List & Technical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Checklist */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Semua Fitur Termasuk Dalam Paket
            </h3>
            <ul className="space-y-3">
              {plan.features.map((feat, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy & Terms */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Ketentuan Layanan & Perpanjangan</span>
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  <strong>1. Setup & Konfigurasi Domain:</strong> Setelah verifikasi pembayaran disetujui admin, Anda dapat langsung menginput domain utama pada customer portal.
                </p>
                <p>
                  <strong>2. Masa Berlaku Layanan:</strong> Masa aktif dihitung 365 hari penuh sejak pembayaran diverifikasi. Tagihan perpanjangan dikirim 14 hari sebelum masa aktif berakhir.
                </p>
                <p>
                  <strong>3. Akses Kontrol Server:</strong> Pengguna mendapatkan akun cPanel mandiri untuk mengelola file, database, DNS records, dan email.
                </p>
                <p>
                  <strong>4. Batasan Penggunaan:</strong> Dilarang menggunakan server untuk aktivitas spam, malware, phishing, atau crypto mining.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => navigate(`/checkout/${plan.slug}`)}
                className="w-full py-3 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Lanjutkan Pemesanan Paket {plan.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
