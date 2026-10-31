import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { api } from '../../../services/api';

export const TransactionsView: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending_verification' | 'paid' | 'all'>('pending_verification');

  // Verification modal state
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [zoomProof, setZoomProof] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPayments(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      );
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!selectedPayment) return;
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.admin.verifyPayment(selectedPayment.id, {
        action,
        reason: rejectReason.trim(),
        admin_notes: adminNotes.trim()
      });

      if (res.success) {
        alert(res.message || `Pembayaran berhasil di-${action === 'approve' ? 'setujui dan layanan diaktifkan' : 'tolak'}.`);
        setSelectedPayment(null);
        setRejectReason('');
        setAdminNotes('');
        await fetchPayments();
      } else {
        alert(res.message || 'Tindakan verifikasi gagal.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memverifikasi pembayaran.');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.id.toString().includes(q) ||
      (p.order_id && p.order_id.toString().includes(q)) ||
      (p.user_email && p.user_email.toLowerCase().includes(q)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(q))
    );
  });

  const formatRupiah = (val?: number) => {
    if (!val && val !== 0) return 'Rp0';
    return `Rp${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Verifikasi Pembayaran & Riwayat Transaksi
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Audit bukti transfer QRIS pelanggan, persetujuan pembayaran manual, dan inisiasi provisioning instan akun hosting.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          title="Refresh pembayaran"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID transaksi, email pelanggan, order..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('pending_verification')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending_verification'
                ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Menunggu Verifikasi
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Disetujui / Lunas
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Semua Riwayat
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">ID Transaksi</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4">Bukti Transfer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tanggal Masuk</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan transaksi pembayaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPending = p.status === 'pending_verification';
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-zinc-900">
                        #TX-{p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-900 font-medium">{p.user_email || 'Pelanggan'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">ID Akun: {p.user_id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                        {p.order_id ? `#ORD-${p.order_id}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-zinc-900">
                        {formatRupiah(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.proof_image ? (
                          <button
                            onClick={() => setZoomProof(p.proof_image)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">Tanpa Foto</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        ) : p.status === 'pending_verification' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> Menunggu Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verifikasi
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-3 py-1 text-xs font-semibold border border-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification & Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Verifikasi Pembayaran #{selectedPayment.id}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">Pelanggan: {selectedPayment.user_email}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID:</span>
                  <span className="text-zinc-900 font-bold">{selectedPayment.order_id || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nominal Transfer:</span>
                  <span className="text-emerald-700 font-bold text-sm">
                    {formatRupiah(selectedPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode:</span>
                  <span className="text-zinc-900 uppercase font-bold">{selectedPayment.payment_method || 'QRIS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className="capitalize font-bold text-zinc-900">{selectedPayment.status}</span>
                </div>
              </div>

              {selectedPayment.proof_image && (
                <div>
                  <span className="text-xs font-semibold text-zinc-700 block mb-1">Bukti Transfer Pelanggan:</span>
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-100 max-h-60 flex items-center justify-center p-2">
                    <img
                      src={selectedPayment.proof_image}
                      alt="Proof"
                      className="max-h-56 object-contain cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
                      onClick={() => setZoomProof(selectedPayment.proof_image)}
                    />
                  </div>
                </div>
              )}

              {selectedPayment.status === 'pending_verification' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Catatan Admin (Opsional)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Contoh: Sesuai mutasi BCA QRIS"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Alasan Penolakan (Wajib jika ditolak)
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Contoh: Foto bukti buram atau nominal tidak sesuai"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>

                {selectedPayment.status === 'pending_verification' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleVerify('reject')}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tolak Bukti
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify('approve')}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      {isVerifying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Setujui & Aktifkan Hosting
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Zoom Modal */}
      {zoomProof && (
        <div
          onClick={() => setZoomProof(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
        >
          <img
            src={zoomProof}
            alt="Proof Zoom"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white"
          />
        </div>
      )}
    </div>
  );
};
