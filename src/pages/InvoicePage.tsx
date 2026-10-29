import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api, Invoice } from '../services/api';

export const InvoicePage: React.FC = () => {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceNumber) return;
      try {
        setLoading(true);
        const res = await api.invoices.getByNumber(invoiceNumber);
        if (res.success && res.invoice) {
          setInvoice(res.invoice);
          setCompany(res.company);
        } else {
          setError('Invoice tidak ditemukan atau belum diverifikasi.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat dokumen invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
        <p className="text-sm text-gray-500">Menyiapkan faktur resmi invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md text-center shadow-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500 mb-6">{error || 'Dokumen invoice tidak valid.'}</p>
          <Link
            to="/portal"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Customer Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-950 py-8 px-4 font-sans text-gray-900 dark:text-gray-100">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-[850px] mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          to="/portal"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Customer Portal</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak atau Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Sheet */}
      <div className="max-w-[850px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-14 shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none relative overflow-hidden">
        {/* Paid Watermark (Print/Display) */}
        <div className="absolute right-12 top-28 pointer-events-none opacity-5 dark:opacity-10 select-none">
          <span className="text-8xl font-black tracking-widest text-emerald-600 rotate-[-15deg] block border-8 border-emerald-600 px-6 py-2 rounded-2xl">
            LUNAS
          </span>
        </div>

        {/* Header Branding & Invoice Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <img
                src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                alt="1sLabs Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {company?.tagline || 'High-Performance Web Hosting & Infrastructure Platform'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bandung, Jawa Barat, Indonesia • info@1slabs.my.id
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>LUNAS / PAID</span>
            </span>
            <h1 className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {invoice.invoice_number}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              Order Ref: {invoice.order_number}
            </p>
          </div>
        </div>

        {/* Billed To & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-gray-200 dark:border-gray-800 text-xs">
          <div>
            <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Ditagihkan Kepada (Customer):
            </span>
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              {invoice.customer_name}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-0.5">{invoice.customer_email}</p>
            {invoice.customer_phone && (
              <p className="text-gray-600 dark:text-gray-300 mt-0.5">WhatsApp: {invoice.customer_phone}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1.5">
            <div>
              <span className="text-gray-400">Tanggal Terbit: </span>
              <span className="font-semibold">{invoice.created_at ? invoice.created_at.slice(0, 10) : '-'}</span>
            </div>
            <div>
              <span className="text-gray-400">Tanggal Pembayaran: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {invoice.paid_at ? invoice.paid_at.slice(0, 10) : (invoice.created_at ? invoice.created_at.slice(0, 10) : '-')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Metode Verifikasi: </span>
              <span className="font-semibold">QRIS Resmi 1sLabs (Verifikasi Sistem)</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        {(() => {
          const rawAmount = parseFloat(invoice.amount.toString()) || 0;
          const isBaseCatalogPrice = [850000, 1000000, 1200000].includes(Math.round(rawAmount));
          const dpp = isBaseCatalogPrice ? rawAmount : Math.round(rawAmount / 1.11);
          const ppn = Math.round(dpp * 0.11);
          const totalPaid = dpp + ppn;

          return (
            <>
              <div className="py-8">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Deskripsi Layanan</th>
                      <th className="pb-3 font-semibold">Periode</th>
                      <th className="pb-3 font-semibold text-right">Harga (Sebelum PPN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr>
                      <td className="py-4">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {invoice.plan_name}
                        </p>
                        <p className="text-gray-500 mt-0.5">
                          Domain Terkait: <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">{invoice.domain || invoice.current_service_domain || 'Dikonfigurasi via portal'}</span>
                        </p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          Spesifikasi: NVMe High-Speed Storage, Auto-SSL Let's Encrypt, phpMyAdmin & Portal Mandiri 1sLabs
                        </p>
                      </td>
                      <td className="py-4 text-gray-600 dark:text-gray-300">{invoice.period || '/ tahun (12 Bulan)'}</td>
                      <td className="py-4 font-bold text-right text-sm text-gray-900 dark:text-white">
                        {formatPrice(dpp)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary with PPN 11% */}
              <div className="pt-4 pb-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start gap-6">
                {/* Official Seal / Signature Stamp */}
                <div className="flex items-center space-x-4 border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl max-w-sm">
                  <img
                    src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                    alt="Official Seal 1sLabs"
                    className="w-16 h-16 object-contain rounded-xl flex-shrink-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Disahkan Resmi oleh 1sLabs
                    </span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      Faktur ini sah dan diterbitkan secara digital tanpa tanda tangan basah fisik.
                    </span>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="w-full sm:w-80 space-y-2 text-xs self-end">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dasar Pengenaan Pajak (DPP):</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(dpp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center space-x-1">
                      <span>PPN 11%:</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded font-mono font-bold">11%</span>
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {formatPrice(ppn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Biaya Transaksi QRIS:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp 0 (Gratis)</span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800 text-base font-extrabold text-gray-900 dark:text-white">
                    <span>Total Lunas:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatPrice(totalPaid)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Legal & Stamp Footer */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Dokumen ini merupakan bukti pembayaran elektronik resmi yang sah dari 1sLabs (PT 1sLabs Solusi Digital).</span>
          </div>

          <div className="font-mono text-gray-500 text-right">
            Verification ID: {invoice.invoice_number}-VERIFIED-11PPN
          </div>
        </div>
      </div>
    </div>
  );
};
