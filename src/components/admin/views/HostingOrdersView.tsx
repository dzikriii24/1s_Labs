import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  Globe,
  DollarSign,
  Eye,
  FileText
} from 'lucide-react';
import { api } from '../../../services/api';

export const HostingOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.getAll(statusFilter !== 'all' ? { status: statusFilter } : undefined);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter((ord) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (ord.order_number && ord.order_number.toLowerCase().includes(q)) ||
      (ord.domain && ord.domain.toLowerCase().includes(q)) ||
      (ord.customer_name && ord.customer_name.toLowerCase().includes(q)) ||
      (ord.customer_email && ord.customer_email.toLowerCase().includes(q)) ||
      (ord.user_name && ord.user_name.toLowerCase().includes(q)) ||
      (ord.user_email && ord.user_email.toLowerCase().includes(q))
    );
  });

  const formatRupiah = (val?: any) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!num && num !== 0) return 'Rp0';
    return `Rp${Math.round(num).toLocaleString('id-ID')}`;
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Lunas (Paid)
          </span>
        );
      case 'pending':
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Menunggu Pembayaran
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Pesanan Hosting Pelanggan (Hosting Orders)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Rekam jejak seluruh pesanan paket hosting cloud, invoice tagihan, status pembayaran, dan domain terkait.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          title="Refresh pesanan"
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
            placeholder="Cari nomor pesanan (#ORD-...), domain, atau pelanggan..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'paid', 'pending', 'unpaid', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">Nomor Pesanan</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Paket Layanan</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Total Tagihan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tanggal Pesanan</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat daftar pesanan...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan data pesanan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-zinc-900">
                      {ord.order_number || `#ORD-${ord.id}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-900 font-medium">
                        {ord.customer_name || ord.user_name || 'Pelanggan'}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {ord.customer_email || ord.user_email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800">
                      {ord.plan_name || 'Hosting Plan'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                      {ord.domain || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-zinc-900">
                      {formatRupiah(ord.total_amount || ord.price)}
                    </td>
                    <td className="py-3.5 px-4">{getOrderStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                      {ord.created_at
                        ? new Date(ord.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                      >
                        Inspeksi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Rincian Pesanan: {selectedOrder.order_number || `#ORD-${selectedOrder.id}`}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Dibuat pada {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Status Pesanan</div>
                  <div className="mt-1">{getOrderStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Pembayaran</div>
                  <div className="text-lg font-bold font-mono text-zinc-900 mt-0.5">
                    {formatRupiah(selectedOrder.total_amount || selectedOrder.price)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-zinc-200 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-zinc-900">
                  Spesifikasi Layanan
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Paket:</span>
                  <span className="text-zinc-900 font-semibold">{selectedOrder.plan_name || 'Standard Cloud'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Domain Tujuan:</span>
                  <span className="font-mono text-zinc-900 font-bold">{selectedOrder.domain || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Siklus Penagihan:</span>
                  <span className="text-zinc-800">{selectedOrder.billing_cycle || 'Tahunan (1 Tahun)'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500">Pelanggan:</span>
                  <span className="text-zinc-900 font-medium">
                    {selectedOrder.customer_name || selectedOrder.user_name} ({selectedOrder.customer_email || selectedOrder.user_email})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
