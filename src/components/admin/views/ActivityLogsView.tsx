import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { api, ActivityLogItem } from '../../../services/api';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getActivityLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        limit: 100
      });
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const actor = (l.actor_name || l.admin_email || '').toLowerCase();
    const action = (l.action || '').toLowerCase();
    const target = (l.target || '').toLowerCase();
    return actor.includes(q) || action.includes(q) || target.includes(q);
  });

  const handleExportCsv = () => {
    if (logs.length === 0) {
      alert('Tidak ada log untuk diekspor.');
      return;
    }
    const headers = ['ID', 'Actor Name', 'Role', 'Action', 'Target', 'IP Address', 'Result', 'Timestamp'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.actor_name || l.admin_email || 'System'}"`,
      l.actor_role || 'admin',
      `"${l.action}"`,
      `"${l.target || '-'}"`,
      l.ip_address || '-',
      l.result || 'success',
      l.created_at || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((x) => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `1slabs_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Log Audit Aktivitas Sistem (System Audit Trail)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Log audit administratif tamper-evident. Mencatat persetujuan pembayaran, provisioning cPanel, operasi SSL, dan perubahan konfigurasi sistem.
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
            <span>Ekspor Audit CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh log aktivitas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktor, tipe aksi, target resource..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Menampilkan <span className="text-zinc-900 font-bold bg-zinc-100 px-2 py-0.5 rounded">{filteredLogs.length}</span> audit events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">Event ID</th>
                <th className="py-3.5 px-4">Aktor Pelaksana</th>
                <th className="py-3.5 px-4">Tipe Aksi</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Alamat IP</th>
                <th className="py-3.5 px-4">Hasil</th>
                <th className="py-3.5 px-4">Waktu Kejadian</th>
                <th className="py-3.5 px-5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700 font-mono">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Mengambil log audit sistem...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-sans">
                    Belum ada riwayat aktivitas sistem yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-zinc-900">
                      #{l.id}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-zinc-900">
                        {l.actor_name || l.admin_email || 'Administrator'}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono capitalize">
                        {l.actor_role || 'Super Admin'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-800 font-medium">
                      {l.target || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                      {l.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.result === 'success' || !l.result
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {l.result || 'success'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                      {l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(l)}
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

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-zinc-900">Inspeksi Rincian Audit Event #{selectedLog.id}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-mono space-y-2 mb-4">
              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Aksi:</span>
                <span className="text-zinc-900 font-bold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Target:</span>
                <span className="text-zinc-800">{selectedLog.target || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Aktor:</span>
                <span className="text-zinc-800">{selectedLog.actor_name} ({selectedLog.actor_role}) &bull; IP: {selectedLog.ip_address}</span>
              </div>
              {selectedLog.details && (
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Rincian Metadata / Payload:</span>
                  <pre className="p-3 bg-white border border-zinc-200 rounded-xl overflow-x-auto text-[11px] text-zinc-800 mt-1 whitespace-pre-wrap">
                    {typeof selectedLog.details === 'object'
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : String(selectedLog.details)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
