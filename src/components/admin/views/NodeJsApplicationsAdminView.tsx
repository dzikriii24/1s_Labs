import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Search,
  Activity,
  ExternalLink,
  Play,
  Square,
  Server,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api, NodeJsApp } from '../../../services/api';
import notify from '../../../lib/notify';

export const NodeJsApplicationsAdminView: React.FC = () => {
  const [apps, setApps] = useState<NodeJsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAdminNodeJsApps();
      if (res.success) {
        setApps(res.applications);
      }
    } catch (err: any) {
      console.error('Fetch admin nodejs apps error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleRestart = async (appId: number) => {
    setActionInProgressId(appId);
    try {
      await api.nodejs.action(appId, 'restart');
      notify.success('Aplikasi Node.js berhasil direstart.');
      await fetchApps();
    } catch (err: any) {
      notify.error('Gagal restart: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setActionInProgressId(null);
    }
  };

  const filtered = apps.filter(a =>
    a.app_name.toLowerCase().includes(search.toLowerCase()) ||
    a.domain.toLowerCase().includes(search.toLowerCase()) ||
    (a.owner_name && a.owner_name.toLowerCase().includes(search.toLowerCase())) ||
    (a.owner_email && a.owner_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Node.js Infrastructure & Applications
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Monitoring seluruh aplikasi backend Node.js yang berjalan di bawah CloudLinux Passenger daemon.
          </p>
        </div>

        <button
          onClick={fetchApps}
          className="p-2 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition"
          title="Segarkan data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Total Aplikasi</span>
          <p className="text-2xl font-black text-zinc-900 mt-1">{apps.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Running</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {apps.filter(a => a.status === 'running').length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">API Healthy</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {apps.filter(a => a.health_status === 'healthy').length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Degraded / Error</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {apps.filter(a => a.health_status === 'error').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari aplikasi, domain, atau pemilik..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Memuat daftar aplikasi Node.js...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl text-zinc-500 text-xs">
          Belum ada aplikasi Node.js yang dibuat oleh pengguna.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Nama Aplikasi</th>
                  <th className="py-3 px-4">Domain & Endpoint</th>
                  <th className="py-3 px-4">Pemilik</th>
                  <th className="py-3 px-4">Versi & Mode</th>
                  <th className="py-3 px-4">App Root</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      {app.app_name}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={app.app_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        {app.app_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900">{app.owner_name || 'User #' + app.user_id}</div>
                      <div className="text-[11px] text-zinc-400">{app.owner_email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      v{app.nodejs_version} &bull; <span className="capitalize">{app.app_mode}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                      ~/{app.app_root}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          app.status === 'running' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.status}
                        </span>
                        <span className={`text-[10px] font-semibold ${
                          app.health_status === 'healthy' ? 'text-emerald-600' : 'text-zinc-400'
                        }`}>
                          {app.health_status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRestart(app.id)}
                        disabled={actionInProgressId === app.id}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold transition"
                      >
                        {actionInProgressId === app.id ? 'Restarting...' : 'Restart'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

