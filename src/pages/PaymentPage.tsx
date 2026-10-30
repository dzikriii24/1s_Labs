import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Upload,
  ArrowRight,
  ShieldCheck,
  FileText,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Globe,
  Server
} from 'lucide-react';
import { api, Order, QRISInfo } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const PaymentPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [qrisInfo, setQrisInfo] = useState<QRISInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Confirmation form state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [senderBank, setSenderBank] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      setError(null);
      const [orderRes, qrisRes] = await Promise.all([
        api.orders.getByNumber(orderNumber),
        api.payments.getQrisInfo()
      ]);

      if (orderRes.success && orderRes.order) {
        setOrder(orderRes.order);
      } else {
        setError('Data pesanan tidak ditemukan.');
      }

      if (qrisRes.success && qrisRes.qris) {
        setQrisInfo(qrisRes.qris);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat rincian pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderNumber]);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleCopyAmount = () => {
    if (!order) return;
    const amountNum = Math.round(parseFloat(order.price_snapshot));
    navigator.clipboard.writeText(amountNum.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) return;

    if (!proofFile && !order?.proof_image) {
      setError('Harap lampirkan foto struk bukti transfer pembayaran.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    try {
      const formData = new FormData();
      if (proofFile) {
        formData.append('proof_image', proofFile);
      }
      formData.append('sender_bank_or_wallet', senderBank);
      formData.append('sender_account_name', senderAccountName);
      formData.append('notes', notes);

      const res = await api.payments.confirm(orderNumber, formData);
      if (res.success) {
        setSubmitSuccess(res.message);
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim konfirmasi bukti transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500">Memuat informasi pembayaran QRIS...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="max-w-md mx-auto my-24 text-center p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link to="/portal" className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-semibold">
            Kembali ke Portal
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
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/portal" className="hover:underline">Customer Portal</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {order?.status === 'paid' ? `Detail Pemesanan (${order?.order_number})` : `Pembayaran QRIS (${order?.order_number})`}
          </span>
        </div>

        {/* Status Notification Banners (Only for Pending / Rejected) */}
        {order?.status === 'pending_verification' && (
          <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
                  Sedang Menunggu Verifikasi Admin
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Bukti transfer Anda telah tersimpan. Admin sedang memeriksa mutasi rekening kami.
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Perbarui Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {order?.payment_status === 'rejected' && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-red-900 dark:text-red-200">
                  Konfirmasi Pembayaran Ditolak
                </h2>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Alasan: <strong>{order.rejection_reason || 'Bukti transfer tidak dapat diverifikasi atau dana belum masuk.'}</strong>
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Silakan periksa kembali mutasi Anda dan unggah bukti pembayaran yang valid pada formulir di bawah.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            KONDISIONAL: JIKA SUDAH LUNAS -> TAMPILKAN DETAIL PEMESANAN (TANPA QRIS)
            ======================================================== */}
        {order?.status === 'paid' ? (
          <div className="space-y-8">
            {/* Header Hero Card: Bukti Pembayaran Lunas */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl flex-shrink-0 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                        Detail Pemesanan #{order.order_number}
                      </h1>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>LUNAS TERVERIFIKASI</span>
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
                      Pembayaran pesanan ini telah diverifikasi sah oleh admin 1sLabs.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to="/portal"
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all"
                  >
                    <span>Buka Layanan Hosting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {order.domain && (
                    <a
                      href={`https://${order.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>Kunjungi Website</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>
              </div>

              {/* 4 Quick Stat Summary Cards */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Paket Hosting:</span>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {order.plan_name_snapshot}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Total Pembayaran:</span>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPrice(order.price_snapshot)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Metode Pembayaran:</span>
                  <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>QRIS (Terverifikasi)</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Tanggal Transaksi:</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Dua Kolom: Rincian Layanan & Data Pembayaran Sah */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Kolom Kiri (7 Cols): Rincian Layanan & Faktur */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span>Rincian Layanan yang Dipesan</span>
                    </h2>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg">
                      {order.type === 'renewal' ? 'Perpanjangan 1 Tahun' : 'Pemesanan Baru'}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-gray-500">Paket Hosting</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{order.plan_name_snapshot}</span>
                    </div>

                    <div className="py-3 flex justify-between items-center">
                      <span className="text-gray-500">Periode Layanan</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{order.period_snapshot}</span>
                    </div>

                    {order.domain && (
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-gray-500">Domain Layanan</span>
                        <a
                          href={`https://${order.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1"
                        >
                          <span>{order.domain}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {order.service_code && (
                      <div className="py-3 flex justify-between items-center">
                        <span className="text-gray-500">Kode Layanan</span>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {order.service_code}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const rawAmount = parseFloat(order.price_snapshot.toString()) || 0;
                      const isBase = [850000, 1000000, 1200000].includes(Math.round(rawAmount));
                      const dpp = isBase ? rawAmount : Math.round(rawAmount / 1.11);
                      const ppn = Math.round(dpp * 0.11);
                      return (
                        <>
                          <div className="py-3 flex justify-between items-center">
                            <span className="text-gray-500">Harga Paket (DPP)</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(dpp)}</span>
                          </div>
                          <div className="py-3 flex justify-between items-center">
                            <span className="text-gray-500 flex items-center space-x-1.5">
                              <span>PPN (Pajak Pertambahan Nilai)</span>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-mono font-bold">11%</span>
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(ppn)}</span>
                          </div>
                        </>
                      );
                    })()}

                    <div className="py-4 flex justify-between items-center text-sm bg-emerald-50/50 dark:bg-emerald-950/20 -mx-6 px-6 sm:-mx-8 sm:px-8 mt-2 rounded-2xl">
                      <span className="font-bold text-gray-900 dark:text-white">Total Tagihan Lunas</span>
                      <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatPrice(order.price_snapshot)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan (5 Cols): Data Verifikasi & Akses Layanan */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-5">
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Data Verifikasi Pembayaran</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank / e-Wallet:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{order.sender_bank || 'QRIS 1sLabs'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nama Pengirim:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{order.sender_account_name || user?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status Validasi:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sah & Terverifikasi</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 space-y-2.5">
                      <Link
                        to="/portal"
                        className="w-full py-3 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-xs sm:text-sm text-center flex items-center justify-center space-x-2 transition-all shadow-xs"
                      >
                        <span>Kelola Hosting di Customer Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      {order.service_code && !order.domain && (
                        <Link
                          to={`/services/${order.service_code}/setup-domain`}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Atur Domain Hosting Sekarang</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             PENDING PAYMENT / VERIFICATION (SHOW QRIS & CONFIRMATION FORM)
             ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: QRIS Visual & Instructions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kode Pembayaran</span>
                    <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                      {order?.order_number}
                    </h1>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tagihan</span>
                    <div className="flex items-center justify-end space-x-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                        {order && formatPrice(order.price_snapshot)}
                      </span>
                      <button
                        onClick={handleCopyAmount}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs transition-colors"
                        title="Salin Angka"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* QRIS Code Image Box */}
                <div className="my-8 flex flex-col items-center">
                  <div className="p-4 bg-white rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-md inline-block max-w-[320px]">
                    <img
                      src={qrisInfo?.imageUrl || '/qris.jpeg'}
                      alt="Official QRIS 1sLabs"
                      className="w-full h-auto object-contain rounded-2xl"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-xs font-bold text-gray-900">{qrisInfo?.merchantName || '1sLabs'}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">NMID: ID1024346142728 / A01</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md">
                    {qrisInfo?.supportedApps.map((app, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-medium"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step by Step Instructions */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-1.5">
                    <Info className="w-4 h-4" />
                    <span>Petunjuk Pembayaran QRIS</span>
                  </h3>
                  <ol className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    {qrisInfo?.instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="font-bold text-gray-900 dark:text-white">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Proof Confirmation Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Package Summary */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  Rincian Layanan yang Dipesan
                </h2>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Paket Hosting:</span>
                    <span className="font-semibold">{order?.plan_name_snapshot}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Periode Layanan:</span>
                    <span className="font-semibold">{order?.period_snapshot}</span>
                  </div>
                  {order && (() => {
                    const rawAmount = parseFloat(order.price_snapshot.toString()) || 0;
                    const isBase = [850000, 1000000, 1200000].includes(Math.round(rawAmount));
                    const dpp = isBase ? rawAmount : Math.round(rawAmount / 1.11);
                    const ppn = Math.round(dpp * 0.11);
                    return (
                      <>
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-gray-500">Harga Paket (DPP):</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(dpp)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-gray-500 flex items-center space-x-1">
                            <span>PPN 11%:</span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1 py-0.2 rounded font-mono font-bold">11%</span>
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(ppn)}</span>
                        </div>
                      </>
                    );
                  })()}
                  {order?.domain && (
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">Domain Layanan:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{order.domain}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Tipe Pesanan:</span>
                    <span className="font-semibold">{order?.type === 'renewal' ? 'Perpanjangan' : 'Pemesanan Baru'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Status Pembayaran:</span>
                    <span className={`font-semibold ${
                      order?.status === 'paid' ? 'text-emerald-600' :
                      order?.status === 'pending_verification' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {order?.status === 'paid' ? 'LUNAS' :
                       order?.status === 'pending_verification' ? 'MENUNGGU VERIFIKASI' : 'BELUM DIBAYAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proof Confirmation Form */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Konfirmasi Pembayaran Anda
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                  Unggah tangkapan layar struk mutasi (JPG, PNG, WebP, atau PDF) agar admin dapat memverifikasi pembayaran dan mengaktifkan akun hosting.
                </p>

                {submitSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                    {submitSuccess}
                  </div>
                )}

                <form onSubmit={handleConfirmSubmit} className="space-y-4">
                  {/* Proof upload file */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Foto Struk / Bukti Transfer
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white rounded-2xl p-4 text-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50"
                    >
                      {proofPreview ? (
                        <div className="space-y-2">
                          <img
                            src={proofPreview}
                            alt="Bukti Transfer Preview"
                            className="max-h-40 mx-auto rounded-xl object-contain"
                          />
                          <p className="text-[11px] text-gray-500">Klik untuk mengganti foto</p>
                        </div>
                      ) : order?.proof_image ? (
                        <div className="space-y-2">
                          <img
                            src={order.proof_image.startsWith('http') ? order.proof_image : (order.proof_image.startsWith('/api') ? order.proof_image : `/api${order.proof_image.startsWith('/') ? '' : '/'}${order.proof_image}`)}
                            alt="Bukti Transfer Tersimpan"
                            className="max-h-40 mx-auto rounded-xl object-contain"
                          />
                          <p className="text-[11px] text-gray-500">Bukti transfer sudah diunggah. Klik untuk mengganti.</p>
                        </div>
                      ) : (
                        <div className="py-4">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">Pilih File Bukti Pembayaran</p>
                          <p className="text-[11px] text-gray-500 mt-1">Format JPG, PNG, atau WebP (Maks. 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank / App Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Nama Bank atau e-Wallet Pengirim
                    </label>
                    <input
                      type="text"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      placeholder="Contoh: BCA / GoPay / Livin Mandiri"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  {/* Sender Account Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Nama Pemilik Rekening Pengirim
                    </label>
                    <input
                      type="text"
                      value={senderAccountName}
                      onChange={(e) => setSenderAccountName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan untuk verifikator admin"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Bukti Transfer...</span>
                      </>
                    ) : (
                      <>
                        <span>Saya Sudah Bayar (Kirim Konfirmasi)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
