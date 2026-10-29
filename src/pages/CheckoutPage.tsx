import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileCheck
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

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    if (!agreedToTerms) {
      setError('Anda harus menyetujui ketentuan layanan sebelum melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.orders.create({
        plan_id: plan.id,
        type: 'new',
        customer_notes: customerNotes
      });

      if (res.success && res.order) {
        // Redirect to QRIS Payment Page
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
          Ringkasan Pemesanan Hosting
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Periksa kembali rincian paket dan identitas akun pemesan sebelum menerbitkan invoice pembayaran.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Plan & Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Plan Snapshot */}
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

            {/* Customer Details */}
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
                  <span className="font-semibold text-gray-900 dark:text-white">{user?.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Nomor WhatsApp:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{user?.phone || 'Belum diisi'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Metode Pembayaran:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">QRIS (BCA, Mandiri, GoPay, Dana, dll.)</span>
                </div>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Catatan Khusus atau Domain Rencana (Opsional)
              </label>
              <textarea
                rows={3}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Contoh: Rencana domain bisnis saya adalah tokoberkah.com, butuh bantuan migrasi data dari hosting lama."
                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                * Konfigurasi domain resmi akan diminta secara mandiri melalui Customer Portal setelah pembayaran terverifikasi.
              </p>
            </div>
          </div>

          {/* Right Column: Cost Breakdown & Checkout Submit */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 sticky top-24 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Rincian Biaya
              </h2>

              {(() => {
                const basePrice = plan ? parseFloat(plan.price) : 0;
                const ppnAmount = Math.round(basePrice * 0.11);
                const totalAmount = basePrice + ppnAmount;

                return (
                  <>
                    <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-gray-800 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Harga Paket ({plan.name})</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(basePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center space-x-1.5">
                          <span>PPN 11% (Pajak Pertambahan Nilai)</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-mono font-bold">11%</span>
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(ppnAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bantuan Setup & Auto-SSL</span>
                        <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Biaya Administrasi QRIS</span>
                        <span className="font-semibold text-emerald-600">Rp 0 (Gratis)</span>
                      </div>
                    </div>

                    <div className="py-4 flex justify-between items-baseline border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">Total Pembayaran:</span>
                        <span className="text-[11px] text-gray-400">Sudah Termasuk PPN 11%</span>
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
                    Saya menyetujui ketentuan layanan 1sLabs bahwa layanan hosting akan aktif setelah pembayaran diverifikasi oleh admin.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms}
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

              <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Transaksi Aman & Terverifikasi 1sLabs</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
