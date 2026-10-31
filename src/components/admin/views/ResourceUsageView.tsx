import React, { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Terminal,
  Cpu,
  Trash2,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api, ServerProcessItem } from '../../../services/api';

export const ResourceUsageView: React.FC = () => {
  const [processes, setProcesses] = useState<ServerProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<ServerProcessItem | null>(null);
  const [terminating, setTerminating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getLiveProcesses();
      if (res.success && res.processes) {
        setProcesses(res.processes);
      }
    } catch (err) {
      console.error('Failed to load server processes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchProcesses();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleTerminate = async () => {
    if (!selectedProcess) return;
    setTerminating(true);
    try {
      const res = await api.admin.terminateProcess(selectedProcess.pid, 'SIGTERM');
      if (res.success) {
        alert(res.message || `Proses PID ${selectedProcess.pid} berhasil dihentikan.`);
        setSelectedProcess(null);
        await fetchProcesses();
      } else {
        alert(res.message || 'Gagal menghentikan proses.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghentikan proses.');
    } finally {
      setTerminating(false);
    }
  };

  const filteredProcesses = processes.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.pid.toString().includes(q) ||
      (p.command && p.command.toLowerCase().includes(q)) ||
      (p.user && p.user.toLowerCase().includes(q)) ||
      (p.args && p.args.toLowerCase().includes(q))
    );
  });

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
                Penggunaan Resource & Proses Server (Live Processes)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Inspeksi proses server real-time di bawah application pool Passenger & Node.js dengan perlindungan whitelist daemon.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl font-medium">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh proses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="text-amber-950 font-bold">Kebijakan Safety First:</strong> Penghentian massal dilarang keras. Hanya hentikan proses jika Anda mengidentifikasi adanya memory leak atau thread background yang macet. Daemon penting (Passenger Watchdog, Apache proxy, dan SSH) dilindungi whitelist dan tidak dapat dihentikan.
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan PID, command, atau arguments..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Total Proses Berjalan: <span className="text-zinc-900 font-bold bg-zinc-100 px-2.5 py-1 rounded-lg">{processes.length}</span>
        </div>
      </div>

      {/* Process Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">PID</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">CPU %</th>
                <th className="py-3.5 px-4">Memory %</th>
                <th className="py-3.5 px-4">Durasi Waktu</th>
                <th className="py-3.5 px-4">Perintah / Script</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700 font-mono">
              {loading && processes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Mengambil daftar proses server real-time...
                  </td>
                </tr>
              ) : filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan proses yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((proc) => {
                  const isProtected =
                    proc.command?.toLowerCase().includes('watchdog') ||
                    proc.command?.toLowerCase().includes('sshd') ||
                    proc.user === 'root';

                  return (
                    <tr key={proc.pid} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-zinc-900">
                        {proc.pid}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {proc.user}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          parseFloat(String(proc.cpu)) > 50
                            ? 'bg-red-100 text-red-800'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {proc.cpu}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          parseFloat(String(proc.memory)) > 30
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {proc.memory}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {proc.elapsed_time || proc.time || '-'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={`${proc.command} ${proc.args || ''}`}>
                        <span className="text-zinc-900 font-semibold">{proc.command}</span>
                        {proc.args && <span className="text-zinc-400 ml-1.5">{proc.args}</span>}
                      </td>
                      <td className="py-3.5 px-5 text-right font-sans">
                        {isProtected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 italic">
                            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedProcess(proc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Kill
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

      {/* Termination Confirmation Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Konfirmasi Penghentian Proses
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  PID {selectedProcess.pid} &bull; User {selectedProcess.user}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono mb-5 space-y-1">
              <p className="text-zinc-500">Command:</p>
              <p className="font-bold text-zinc-900 break-all">{selectedProcess.command} {selectedProcess.args}</p>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed mb-6">
              Menghentikan proses (SIGTERM) akan memutus koneksi aktif yang sedang ditangani oleh proses ini. Lanjutkan hanya jika proses ini mengalami stuck atau kebocoran memori.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedProcess(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
              >
                {terminating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Hentikan Proses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
