import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  Calendar,
  Layers,
  CreditCard,
  FileText,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { api, CustomerDetail } from '../../../services/api';

export const CustomerManagementView: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Customer Detail Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'profile' | 'orders' | 'services' | 'invoices' | 'emails'>('profile');

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.admin.getCustomers({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      if (res && res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const openCustomerDetail = async (id: number) => {
    setSelectedCustomerId(id);
    setDetailTab('profile');
    try {
      setIsDetailLoading(true);
      const res = await api.admin.getCustomerDetail(id);
      if (res && res.success) {
        setCustomerDetail(res.customer);
      }
    } catch (err) {
      console.error('Failed to load customer detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!customerDetail) return;
    if (!window.confirm(`Ubah status pelanggan ${customerDetail.name} menjadi '${newStatus}'?`)) return;

    try {
      const res = await api.admin.updateCustomerStatus(customerDetail.id, newStatus);
      if (res.success) {
        alert(res.message);
        setCustomerDetail({ ...customerDetail, status: newStatus });
        loadCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status pelanggan.');
    }
  };

  const exportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Verified', 'Orders Count', 'Services Count', 'Total Spent', 'Registered At'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || '-'}"`,
      c.status,
      c.email_verified ? 'Yes' : 'No',
      c.orders_count,
      c.services_count,
      c.total_spent,
      c.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `1slabs_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatIDR = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Kelola Pelanggan (Customer Management)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Total {customers.length} akun pelanggan terdaftar di platform 1sLabs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, WhatsApp..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-zinc-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={loadCustomers}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
            title="Refresh pelanggan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
                <th className="py-3.5 px-6">Pelanggan</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-center">Pesanan</th>
                <th className="py-3.5 px-4 text-center">Layanan</th>
                <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                <th className="py-3.5 px-4">Registrasi</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    Tidak ditemukan data pelanggan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{c.name}</p>
                          <p className="text-[11px] text-zinc-400">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-zinc-600 font-mono text-[11px]">
                        {c.phone || '-'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-800">
                      {c.orders_count}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-800">
                      {c.services_count}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                      {formatIDR(c.total_spent)}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString('id-ID')}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openCustomerDetail(c.id)}
                        className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                      >
                        Profil Lengkap
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base font-mono">
                  {customerDetail?.name ? customerDetail.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {customerDetail?.name || 'Profil Pelanggan'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {customerDetail?.email} &bull; Terdaftar sejak{' '}
                    {customerDetail ? new Date(customerDetail.created_at).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="px-6 border-b border-zinc-200 flex space-x-4 shrink-0 text-xs font-medium bg-zinc-50/50">
              {[
                { key: 'profile', label: 'Ringkasan & Status' },
                { key: 'orders', label: `Pesanan (${customerDetail?.orders?.length || 0})` },
                { key: 'services', label: `Layanan (${customerDetail?.services?.length || 0})` },
                { key: 'invoices', label: `Invoice (${customerDetail?.invoices?.length || 0})` },
                { key: 'emails', label: `Riwayat Email (${customerDetail?.email_logs?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key as any)}
                  className={`py-3 border-b-2 transition-all cursor-pointer ${
                    detailTab === tab.key
                      ? 'border-zinc-900 text-zinc-900 font-bold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {isDetailLoading ? (
                <div className="py-20 text-center text-zinc-400 text-xs">
                  Memuat rincian lengkap pelanggan...
                </div>
              ) : !customerDetail ? (
                <div className="py-20 text-center text-zinc-400 text-xs">
                  Gagal memuat profil pelanggan.
                </div>
              ) : (
                <>
                  {/* TAB 1: Profile & Status Control */}
                  {detailTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                          <p className="text-[11px] text-zinc-400 font-medium">Total Pengeluaran</p>
                          <p className="text-base font-bold font-mono text-zinc-900 mt-1">
                            {formatIDR(customerDetail.total_spent)}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                          <p className="text-[11px] text-zinc-400 font-medium">Status Email</p>
                          <p className="text-sm font-bold text-zinc-900 mt-1">
                            {customerDetail.email_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                          <p className="text-[11px] text-zinc-400 font-medium">Status Akun</p>
                          <p className="text-sm font-bold capitalize text-zinc-900 mt-1">
                            {customerDetail.status}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                          <p className="text-[11px] text-zinc-400 font-medium">WhatsApp / Telepon</p>
                          <p className="text-sm font-mono font-bold text-zinc-900 mt-1">
                            {customerDetail.phone || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-zinc-200 space-y-3 bg-zinc-50/40">
                        <h4 className="text-xs font-bold text-zinc-900">
                          Ubah Status Akses Akun Pelanggan
                        </h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          Menangguhkan akun akan mencegah pelanggan melakukan login ke customer portal atau mengelola hosting mereka.
                        </p>
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => handleUpdateStatus('active')}
                            disabled={customerDetail.status === 'active'}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                          >
                            Aktifkan (Active)
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('suspended')}
                            disabled={customerDetail.status === 'suspended'}
                            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 cursor-pointer"
                          >
                            Tangguhkan (Suspend)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Orders */}
                  {detailTab === 'orders' && (
                    <div className="space-y-3">
                      {customerDetail.orders.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-8 text-center">Pelanggan belum pernah membuat pesanan.</p>
                      ) : (
                        customerDetail.orders.map((o) => (
                          <div key={o.id} className="p-4 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs bg-zinc-50/40">
                            <div>
                              <p className="font-mono font-bold text-zinc-900">#{o.order_number}</p>
                              <p className="text-zinc-500 mt-0.5">{o.plan_name_snapshot} &bull; Domain: {o.domain || '-'}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">{new Date(o.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-zinc-900">{formatIDR(o.price_snapshot)}</span>
                              <p className="text-[10px] font-bold uppercase mt-1 text-zinc-500">{o.status}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: Services */}
                  {detailTab === 'services' && (
                    <div className="space-y-3">
                      {customerDetail.services.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-8 text-center">Tidak ada layanan hosting aktif.</p>
                      ) : (
                        customerDetail.services.map((s) => (
                          <div key={s.id} className="p-4 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs bg-zinc-50/40">
                            <div>
                              <p className="font-mono font-bold text-zinc-900">{s.service_code}</p>
                              <p className="text-zinc-600 mt-0.5 font-bold">{s.domain || 'Belum pasang domain'}</p>
                              <p className="text-[11px] text-zinc-400 mt-1">Paket: {s.plan_name}</p>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {s.status}
                              </span>
                              <p className="text-[10px] text-zinc-400 mt-1">
                                Kadaluarsa: {s.expires_at ? new Date(s.expires_at).toLocaleDateString('id-ID') : '-'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: Invoices */}
                  {detailTab === 'invoices' && (
                    <div className="space-y-3">
                      {customerDetail.invoices.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-8 text-center">Belum ada invoice untuk pelanggan ini.</p>
                      ) : (
                        customerDetail.invoices.map((inv) => (
                          <div key={inv.id} className="p-4 rounded-2xl border border-zinc-200 flex items-center justify-between text-xs bg-zinc-50/40">
                            <div>
                              <p className="font-mono font-bold text-zinc-900">{inv.invoice_number}</p>
                              <p className="text-zinc-500 mt-0.5">{inv.plan_name}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">{new Date(inv.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-zinc-900">{formatIDR(inv.amount)}</span>
                              <a
                                href={`/invoice/${inv.invoice_number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-[11px] text-blue-600 font-semibold hover:underline mt-1"
                              >
                                Lihat Faktur &rarr;
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: Email Communication History */}
                  {detailTab === 'emails' && (
                    <div className="space-y-3">
                      {customerDetail.email_logs.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-8 text-center">Belum ada riwayat email terkirim ke alamat ini.</p>
                      ) : (
                        customerDetail.email_logs.map((log) => (
                          <div key={log.id} className="p-3.5 rounded-2xl border border-zinc-200 text-xs bg-zinc-50/40">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900">{log.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-mono mt-1">
                              Template: {log.template_name} &bull; {new Date(log.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
