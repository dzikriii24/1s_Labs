import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldCheck,
  User,
  Globe,
  Server,
  Loader2
} from 'lucide-react';
import { api, FreePlanClaim } from '../../../services/api';

export const FreePlanClaimsView: React.FC = () => {
  const [claims, setClaims] = useState<FreePlanClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getFreePlanClaims();
      if (res.success) {
        setClaims(res.claims);
      }
    } catch (err: any) {
      console.error('Fetch free plan claims error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleRunCron = async () => {
    setIsRunningCron(true);
    setCronMessage(null);
    try {
      const res = await api.admin.runInfrastructureCron();
      setCronMessage(`Cron sukses dijalankan. Ditangguhkan: ${res.results?.suspended_hostings || 0} hosting, ${res.results?.suspended_domains || 0} domain.`);
      await fetchClaims();
    } catch (err: any) {
      setCronMessage('Gagal menjalankan cron: ' + err.message);
    } finally {
      setIsRunningCron(false);
    }
  };

  const filtered = claims.filter(c =>
    c.domain.toLowerCase().includes(search.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    (c.user_name && c.user_name.toLowerCase().includes(search.toLowerCase())) ||
    (c.user_email && c.user_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Free Plan Management & Claims
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Daftar seluruh pengguna yang mengklaim program Free Subdomain (1 tahun) dan Free Hosting (14 hari).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCron}
            disabled={isRunningCron}
            className="px-3.5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningCron ? 'animate-spin' : ''}`} />
            {isRunningCron ? 'Menjalankan Cron...' : 'Jalankan Auto-Suspension Cron'}
          </button>

          <button
            onClick={fetchClaims}
            className="p-2 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition"
            title="Segarkan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {cronMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          {cronMessage}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Total Klaim</span>
          <p className="text-2xl font-black text-zinc-900 mt-1">{claims.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Layanan Aktif</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {claims.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Hosting Expired</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {claims.filter(c => new Date(c.hosting_expires_at) < new Date()).length}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Suspended</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {claims.filter(c => c.status === 'suspended').length}
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
          placeholder="Cari domain, user, atau email..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900"
        />
      </div>

      {/* Claims Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Memuat klaim free plan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl text-zinc-500 text-xs">
          Belum ada data klaim Free Plan yang cocok.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Domain (.1slabs.my.id)</th>
                  <th className="py-3 px-4">Kode Layanan</th>
                  <th className="py-3 px-4">Tanggal Klaim</th>
                  <th className="py-3 px-4">Expired Hosting (14h)</th>
                  <th className="py-3 px-4">Expired Domain (1th)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => {
                  const isHostExp = new Date(c.hosting_expires_at) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">{c.user_name || 'User #' + c.user_id}</div>
                        <div className="text-[11px] text-zinc-400">{c.user_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://${c.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          https://{c.domain}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-800">
                        {c.service_code || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(c.claimed_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${isHostExp ? 'text-amber-600' : 'text-zinc-800'}`}>
                          {new Date(c.hosting_expires_at).toLocaleDateString('id-ID')}
                          {isHostExp && ' (Habis)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-700">
                        {new Date(c.domain_expires_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

