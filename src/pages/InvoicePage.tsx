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
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-950 py-8 px-4 font-sans text-gray-900 dark:text-gray-100 print:min-h-0 print:py-0 print:px-0 print:bg-white print:text-zinc-900">
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
      <div className="max-w-[850px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-14 shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:bg-white print:text-zinc-900 print:max-w-none print:w-full relative overflow-hidden">
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
              <p className="text-gray-600 dark:text-gray-300 mt-0.5 flex items-center space-x-1.5">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">WhatsApp:</span>
                <span className="font-mono">{invoice.customer_phone}</span>
              </p>
            )}
            <p className="text-gray-400 text-[11px] mt-1 font-mono">
              Status Akun: Terverifikasi Email & WhatsApp
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div>
              <span className="text-gray-400">Tanggal Terbit: </span>
              <span className="font-semibold">{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
            </div>
            <div>
              <span className="text-gray-400">Tanggal Pembayaran: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {invoice.verified_at
                  ? new Date(invoice.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : (invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Metode Verifikasi: </span>
              <span className="font-semibold">
                {invoice.payment_method ? invoice.payment_method.toUpperCase() : 'TRANSFER / QRIS'}
              </span>
            </div>
            {invoice.billing_start_date && invoice.billing_end_date && (
              <div className="pt-1 text-emerald-700 dark:text-emerald-300">
                <span className="text-gray-400">Masa Aktif Layanan: </span>
                <span className="font-semibold">
                  {new Date(invoice.billing_start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' — '}
                  {new Date(invoice.billing_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        {(() => {
          let parsedData: { items?: any[]; dp_amount?: number; balance_due?: number; payment_proof_url?: string } | null = null;
          if (invoice.items_json) {
            try {
              const raw = typeof invoice.items_json === 'string' ? JSON.parse(invoice.items_json) : invoice.items_json;
              if (Array.isArray(raw)) {
                parsedData = { items: raw };
              } else if (raw && typeof raw === 'object') {
                parsedData = raw;
              }
            } catch (e) {
              console.warn('Could not parse items_json', e);
            }
          }

          const hasCustomItems = parsedData?.items && parsedData.items.length > 0;
          const rawAmount = parseFloat(invoice.amount.toString()) || 0;
          const proofImage = parsedData?.payment_proof_url || (invoice as any).payment_proof_image;

          // Group by section if custom items exist
          const sectionsMap: { [section: string]: any[] } = {};
          if (hasCustomItems) {
            parsedData!.items!.forEach((it: any) => {
              const sec = it.section || it.category || 'Rincian Layanan';
              if (!sectionsMap[sec]) sectionsMap[sec] = [];
              sectionsMap[sec].push(it);
            });
          }

          const subtotalAmount = parseFloat(invoice.subtotal?.toString() || invoice.amount.toString()) || rawAmount;
          const discountAmount = parseFloat(invoice.discount_amount?.toString() || '0') || 0;
          const taxAmount = parseFloat(invoice.tax_amount?.toString() || '0') || 0;
          const grandTotal = rawAmount;
          const dpAmount = parsedData?.dp_amount ?? 0;
          const balanceDue = parsedData?.balance_due ?? (dpAmount > 0 ? Math.max(0, grandTotal - dpAmount) : 0);

          const activeDomain = invoice.domain || (invoice as any).order_domain || invoice.current_service_domain || 'Belum terhubung';

          return (
            <>
              <div className="py-8">
                {hasCustomItems ? (
                  <div className="space-y-6">
                    {Object.entries(sectionsMap).map(([sectionName, secItems], sIdx) => (
                      <div key={sIdx} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                          <span className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 font-mono">
                            {sectionName}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {secItems.length} item
                          </span>
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:divide-gray-800/50 text-gray-400 text-[11px]">
                              <th className="py-2.5 px-4 font-semibold">Layanan & Spesifikasi</th>
                              <th className="py-2.5 px-3 font-semibold text-center w-16">Qty</th>
                              <th className="py-2.5 px-4 font-semibold text-right w-36">Harga Satuan</th>
                              <th className="py-2.5 px-4 font-semibold text-right w-36">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {secItems.map((it: any, iIdx: number) => (
                              <tr key={iIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-gray-900 dark:text-white text-xs">
                                    {it.name || it.item_name}
                                  </div>
                                  {it.description && (
                                    <div className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                                      {it.description}
                                    </div>
                                  )}
                                  {(it.proof_url || it.payment_proof_url || it.proofUrl) && (() => {
                                    const proofTarget = it.proof_url || it.payment_proof_url || it.proofUrl;
                                    const viewerLink = `/proof-viewer?url=${encodeURIComponent(proofTarget.startsWith('http') ? proofTarget : `https://1slabs.my.id${proofTarget}`)}`;
                                    return (
                                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          Bukti Terverifikasi
                                        </span>
                                        <a
                                          href={viewerLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
                                        >
                                          Lihat Bukti Transfer ↗
                                        </a>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-3 text-center text-gray-600 dark:text-gray-300 font-mono">
                                  {it.qty || it.quantity || 1}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-mono">
                                  {formatPrice(it.unit_price || it.unitPrice || 0)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white font-mono">
                                  {formatPrice(it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 font-medium">
                            <tr>
                              <td colSpan={3} className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-semibold text-xs">
                                Subtotal {sectionName}:
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white font-mono text-xs">
                                {formatPrice(
                                  secItems.reduce(
                                    (sum: number, it: any) =>
                                      sum + parseFloat((it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || it.unitPrice || 0)).toString()),
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Deskripsi Layanan</th>
                        <th className="pb-3 font-semibold">Periode Langganan</th>
                        <th className="pb-3 font-semibold text-right">Harga (Sebelum PPN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      <tr>
                        <td className="py-4">
                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                            Paket Web Hosting — {invoice.plan_name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-gray-500">Domain Resmi:</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-[11px]">
                              {activeDomain}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px] mt-1">
                            Spesifikasi: NVMe High-Speed Storage, Auto-SSL Let's Encrypt, phpMyAdmin & Portal Mandiri 1sLabs
                          </p>
                        </td>
                        <td className="py-4 text-gray-600 dark:text-gray-300">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {invoice.period || '1 Tahun (12 Bulan)'}
                            </span>
                            {invoice.billing_start_date && invoice.billing_end_date && (
                              <span className="text-[11px] text-gray-400 block mt-0.5 font-mono">
                                {invoice.billing_start_date.slice(0, 10)} s/d {invoice.billing_end_date.slice(0, 10)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-bold text-right text-sm text-gray-900 dark:text-white">
                          {formatPrice(subtotalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Calculation Summary with DP & Proof Support */}
              <div className="pt-4 pb-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start gap-6">
                {/* Official Seal / Signature Stamp */}
                <div className="space-y-3 max-w-sm">
                  <div className="flex items-center space-x-4 border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl">
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

                  {/* Payment Proof Button / Link */}
                  {proofImage && (() => {
                    const globalProofTarget = proofImage.startsWith('http') ? proofImage : `https://1slabs.my.id${proofImage}`;
                    const globalViewerLink = `/proof-viewer?url=${encodeURIComponent(globalProofTarget)}`;
                    return (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Bukti Pembayaran Terverifikasi</span>
                        </div>
                        <a
                          href={globalViewerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline"
                        >
                          Lihat Bukti Transfer ↗
                        </a>
                      </div>
                    );
                  })()}
                </div>

                {/* Amount Breakdown */}
                <div className="w-full sm:w-88 space-y-2 text-xs self-end">
                  {hasCustomItems && Object.keys(sectionsMap).length > 1 ? (
                    <div className="space-y-1.5 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-1">
                        Rincian Subtotal per Kategori:
                      </span>
                      {Object.entries(sectionsMap).map(([sName, sItems], idx) => {
                        const sSum = sItems.reduce(
                          (acc: number, it: any) =>
                            acc + parseFloat((it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || it.unitPrice || 0)).toString()),
                          0
                        );
                        return (
                          <div key={idx} className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Subtotal {sName}:</span>
                            <span className="font-semibold text-gray-900 dark:text-white font-mono">{formatPrice(sSum)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal Layanan:</span>
                      <span className="font-semibold text-gray-900 dark:text-white font-mono">{formatPrice(subtotalAmount)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon / Penyesuaian:</span>
                      <span className="font-semibold font-mono">- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center space-x-1">
                        <span>PPN:</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded font-mono font-bold">11%</span>
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                        {formatPrice(taxAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-900 dark:text-white">
                    <span>Total Tagihan (Project):</span>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>

                  {dpAmount > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Uang Muka / Pembayaran Awal (DP):</span>
                        <span className="font-mono font-bold">{formatPrice(dpAmount)} (Lunas)</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-800 text-base font-extrabold text-gray-900 dark:text-white">
                        <span>Sisa Tagihan (Pelunasan):</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatPrice(balanceDue)}
                        </span>
                      </div>
                    </>
                  )}

                  {dpAmount === 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-800 text-base font-extrabold text-gray-900 dark:text-white">
                      <span>Total Lunas:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* Legal & Stamp Footer */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Dokumen ini merupakan bukti pembayaran elektronik resmi yang sah dari 1sLabs</span>
          </div>

          <div className="font-mono text-gray-500 text-right">
            Verification ID: {invoice.invoice_number}-VERIFIED-11PPN
          </div>
        </div>
      </div>
    </div>
  );
};
