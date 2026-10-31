import React, { useEffect, useState } from 'react';
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Check,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { api, DomainItem } from '../../../services/api';

interface DomainManagementViewProps {
  onNavigate?: (tab: string) => void;
}

export const DomainManagementView: React.FC<DomainManagementViewProps> = ({ onNavigate }) => {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sslFilter, setSslFilter] = useState('all');
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [dnsResults, setDnsResults] = useState<{ [domain: string]: any }>({});
  const [triggeringAutoSsl, setTriggeringAutoSsl] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getDomains();
      if (res.success && res.domains) {
        setDomains(res.domains);
      }
    } catch (err) {
      console.error('Failed to load domains', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleVerifyDns = async (domain: string) => {
    setVerifyingDomain(domain);
    try {
      const res = await api.admin.verifyDomainDns(domain);
      setDnsResults((prev) => ({ ...prev, [domain]: res }));
    } catch (err: any) {
      setDnsResults((prev) => ({
        ...prev,
        [domain]: { success: false, error: err.message || 'Query DNS gagal' }
      }));
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleRunAutoSsl = async () => {
    if (!confirm('Jalankan pemeriksaan AutoSSL cPanel untuk seluruh domain yang terdaftar?')) {
      return;
    }
    setTriggeringAutoSsl(true);
    try {
      const res = await api.admin.runAutoSsl();
      alert(res.message || 'Pemeriksaan AutoSSL berhasil diinisiasi.');
      await fetchDomains();
    } catch (err: any) {
      alert(err.message || 'Gagal memulai pemeriksaan AutoSSL.');
    } finally {
      setTriggeringAutoSsl(false);
    }
  };

  const filteredDomains = domains.filter((d) => {
    if (sslFilter !== 'all' && d.ssl_status !== sslFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.domain.toLowerCase().includes(q) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
      (d.cpanel_username && d.cpanel_username.toLowerCase().includes(q))
    );
  });

  const getSslBadge = (status?: string, issuer?: string) => {
    if (status === 'active') {
      const isSelfSigned = issuer && issuer.toLowerCase().includes('self');
      if (isSelfSigned) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Self-Signed
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          Active (Trusted)
        </span>
      );
    }
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
        <ShieldAlert className="w-3 h-3" />
        Belum Terpasang
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Manajemen Domain & Status DNS
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Pemantauan domain pelanggan, verifikasi A-Record IP server (103.119.237.132), dan sertifikat SSL Let&apos;s Encrypt / cPanel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAutoSsl}
            disabled={triggeringAutoSsl}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${triggeringAutoSsl ? 'animate-spin' : ''}`} />
            <span>{triggeringAutoSsl ? 'Memeriksa AutoSSL...' : 'Jalankan AutoSSL'}</span>
          </button>
          <button
            onClick={fetchDomains}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh domain"
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
            placeholder="Cari domain, nama pelanggan, username cPanel..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'active', 'expired', 'not_installed'].map((st) => (
            <button
              key={st}
              onClick={() => setSslFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                sslFilter === st
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {st === 'all' ? 'Semua SSL' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">Nama Domain</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Akun cPanel</th>
                <th className="py-3.5 px-4">Sertifikat SSL</th>
                <th className="py-3.5 px-4">Kedaluwarsa SSL</th>
                <th className="py-3.5 px-4">Status DNS (A-Record)</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading && domains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Mengambil data domain terkelola...
                  </td>
                </tr>
              ) : filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan domain yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredDomains.map((dom) => {
                  const dnsCheck = dnsResults[dom.domain];
                  const isPointed = dnsCheck?.isPointed ?? dnsCheck?.points_to_server;
                  const resolvedIp = dnsCheck?.resolvedIps?.[0] || dnsCheck?.resolved_ip || dnsCheck?.serverIp || '103.119.237.132';

                  return (
                    <tr key={dom.domain} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="font-bold text-zinc-900">{dom.domain}</span>
                          <a
                            href={`https://${dom.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-zinc-900 font-medium">{dom.customer_name || 'Pelanggan'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{dom.customer_email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-800 font-semibold">
                        {dom.cpanel_username || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        {getSslBadge(dom.ssl_status, dom.ssl_issuer)}
                        {dom.ssl_issuer && (
                          <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[140px] mt-0.5">
                            {dom.ssl_issuer}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                        {dom.ssl_expiration
                          ? new Date(dom.ssl_expiration).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono">
                        {dnsCheck ? (
                          isPointed ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Pointed ({resolvedIp})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200" title={resolvedIp}>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Different IP ({resolvedIp})
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleVerifyDns(dom.domain)}
                            disabled={verifyingDomain === dom.domain}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg border border-zinc-200 cursor-pointer font-sans font-medium transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingDomain === dom.domain ? 'animate-spin' : ''}`} />
                            Cek DNS
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleVerifyDns(dom.domain)}
                          disabled={verifyingDomain === dom.domain}
                          className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
