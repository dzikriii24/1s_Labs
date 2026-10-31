import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer
} from 'lucide-react';
import { api, FinanceOverviewData } from '../../../services/api';
import notify from '../../../lib/notify';

interface RevenueOverviewViewProps {
  viewMode?: 'overview' | 'reports';
}

export const RevenueOverviewView: React.FC<RevenueOverviewViewProps> = ({
  viewMode = 'overview'
}) => {
  const [data, setData] = useState<FinanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  const isReportMode = viewMode === 'reports';

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getFinanceOverview();
      if (res.success) {
        const fData = (res as any).data || (res as any).revenue || res;
        setData(fData);
      }
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const formatRupiah = (val?: number) => {
    if (!val && val !== 0) return 'Rp0';
    return `Rp${val.toLocaleString('id-ID')}`;
  };

  const filteredTransactions = React.useMemo(() => {
    if (!data?.recent_transactions) return [];
    if (reportPeriod === 'all') return data.recent_transactions;
    const now = new Date();
    return data.recent_transactions.filter((tx: any) => {
      if (!tx.created_at) return true;
      const txDate = new Date(tx.created_at);
      if (reportPeriod === 'this_month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (reportPeriod === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      }
      return true;
    });
  }, [data?.recent_transactions, reportPeriod]);

  const handleExportCsv = () => {
    const listToExport = filteredTransactions.length > 0 ? filteredTransactions : data?.recent_transactions;
    if (!listToExport || listToExport.length === 0) {
      notify.warning('Tidak ada transaksi untuk diekspor.');
      return;
    }
    const headers = ['ID', 'Order Ref', 'Nominal', 'Metode Pembayaran', 'Status', 'Tanggal', 'Nama Pelanggan', 'Email Pelanggan'];
    const rows = listToExport.map((t: any) => [
      t.payment_number || `#TX-${t.id}`,
      t.order_number || t.order_id || '-',
      t.amount || 0,
      t.payment_method || 'QRIS',
      t.status || 'paid',
      t.created_at || '',
      t.customer_name || 'Pelanggan',
      t.user_email || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.map((x) => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `1slabs_laporan_keuangan_${reportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              {isReportMode ? <FileText className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {isReportMode
                  ? 'Laporan Keuangan & Buku Kas (Financial Reports)'
                  : 'Ikhtisar Arus Kas & Pendapatan (Revenue Overview)'}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isReportMode
                  ? 'Buku kas transaksi tervalidasi, audit pembayaran QRIS, rekonsiliasi kas masuk, dan ekspor dokumen keuangan.'
                  : 'Metrik pendapatan terverifikasi real-time, volume transaksi sukses, dan kontribusi layanan hosting terhadap kas 1sLabs.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          {isReportMode && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          )}
          <button
            onClick={fetchFinance}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh data keuangan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Total Pendapatan</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-2">
            {formatRupiah((data?.kpi as any)?.net_revenue ?? data?.kpi?.total_revenue)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Total lunas & sah</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2">
            {formatRupiah((data?.kpi as any)?.daily_revenue || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Kas masuk hari ini</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">7 Hari Terakhir</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2">
            {formatRupiah((data?.kpi as any)?.weekly_revenue || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">1 minggu berjalan</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2">
            {formatRupiah(data?.kpi?.monthly_revenue || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Bulan kalender berjalan</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Tahun Ini</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900 mt-2">
            {formatRupiah((data?.kpi as any)?.annual_revenue || (data as any)?.annualRevenue || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Tahun berjalan</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">Menunggu Lunas</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono text-amber-600 mt-2">
            {formatRupiah((data?.kpi as any)?.outstanding_amount || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{data?.kpi?.outstanding_invoices_count || 0} tagihan belum dibayar</div>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              {isReportMode ? 'Jurnal Audit Pembukuan Kas Masuk' : 'Riwayat Transaksi Terakhir'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar transaksi pembayaran invoice yang tercatat pada sistem keuangan 1sLabs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setReportPeriod('this_month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  reportPeriod === 'this_month'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod('last_month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  reportPeriod === 'last_month'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  reportPeriod === 'all'
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Semua
              </button>
            </div>

            <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1.5 rounded-lg">
              {filteredTransactions.length} Transaksi
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">ID & Order</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Tanggal Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-sans">
                    Belum ada riwayat transaksi pembayaran untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-zinc-900">
                        {tx.payment_number || `#TX-${tx.id}`}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Order Ref: #{tx.order_number || tx.order_id || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-900">{tx.customer_name || 'Pelanggan'}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{tx.user_email || tx.customer_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                        {tx.payment_method || 'QRIS BCA'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 text-xs">
                      {formatRupiah(tx.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> {tx.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono text-[11px] text-zinc-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
