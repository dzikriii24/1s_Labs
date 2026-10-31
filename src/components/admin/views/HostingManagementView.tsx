import React, { useEffect, useState } from 'react';
import {
  Server,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  Database,
  Globe,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Activity,
  ArrowRight,
  CreditCard,
  Send,
  Zap,
  Repeat
} from 'lucide-react';
import { api, HostingService } from '../../../services/api';

interface HostingManagementViewProps {
  onNavigate?: (tab: string) => void;
  viewMode?: 'services' | 'subscriptions';
}

export const HostingManagementView: React.FC<HostingManagementViewProps> = ({
  onNavigate,
  viewMode = 'services'
}) => {
  const [services, setServices] = useState<HostingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<HostingService | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isSubscriptionMode = viewMode === 'subscriptions';

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getServices({ search });
      if (res.success) {
        setServices(res.services || []);
      }
    } catch (err) {
      console.error('Failed to load hosting services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredServices = services.filter((srv) => {
    if (statusFilter !== 'all' && srv.status !== statusFilter) return false;
    return true;
  });

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === 'active').length;
  const pendingServices = services.filter((s) => s.status === 'pending' || s.status === 'awaiting_domain').length;
  const suspendedServices = services.filter((s) => s.status === 'suspended').length;
  const expiredServices = services.filter((s) => s.status === 'expired').length;

  const calculateDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Aktif (Active)
          </span>
        );
      case 'pending':
      case 'awaiting_domain':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Menunggu Domain
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3" />
            Ditangguhkan
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            <XCircle className="w-3 h-3" />
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              {isSubscriptionMode ? <Repeat className="w-5 h-5" /> : <Server className="w-5 h-5" />}
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {isSubscriptionMode
                  ? 'Langganan & Masa Aktif Hosting (Hosting Subscriptions)'
                  : 'Layanan Hosting Pelanggan (Customer Services)'}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isSubscriptionMode
                  ? 'Manajemen siklus penagihan, masa aktif layanan, tanggal perpanjangan (renewal), dan monitoring sisa hari expired.'
                  : 'Pusat provisioning dan pengelolaan akun cPanel aktif, pemetaan domain utama, kuota storage, dan kredensial hosting pelanggan.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate(isSubscriptionMode ? 'customer-services' : 'hosting-subscriptions')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <span>{isSubscriptionMode ? 'Buka Customer Services' : 'Buka Hosting Subscriptions'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={fetchServices}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh layanan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-mono font-semibold">Total Layanan</div>
          <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">{totalServices}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Seluruh pelanggan</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-xs text-emerald-600 uppercase tracking-wider font-mono font-semibold">Aktif Operasional</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{activeServices}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Akun cPanel berjalan</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-xs text-amber-600 uppercase tracking-wider font-mono font-semibold">Menunggu Setup</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingServices}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Domain belum diatur</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-xs">
          <div className="text-xs text-red-600 uppercase tracking-wider font-mono font-semibold">Ditangguhkan</div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1">{suspendedServices}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Akses disuspend</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono font-semibold">Kedaluwarsa</div>
          <div className="text-2xl font-bold font-mono text-zinc-600 mt-1">{expiredServices}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Perlu perpanjangan</div>
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
            placeholder="Cari domain, nama pelanggan, kode layanan..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'active', 'pending', 'suspended', 'expired'].map((st) => (
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

      {/* Services Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">Kode & Domain</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Paket Hosting</th>
                <th className="py-3.5 px-4">Status</th>
                {isSubscriptionMode ? (
                  <>
                    <th className="py-3.5 px-4">Siklus Penagihan</th>
                    <th className="py-3.5 px-4">Kedaluwarsa</th>
                    <th className="py-3.5 px-4">Sisa Masa Aktif</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4">cPanel Username</th>
                    <th className="py-3.5 px-4">Server IP</th>
                    <th className="py-3.5 px-4">Storage (Disk)</th>
                  </>
                )}
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat layanan hosting...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    Tidak ditemukan layanan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv) => {
                  const daysRemaining = calculateDaysRemaining(srv.expires_at);
                  return (
                    <tr key={srv.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 font-mono font-bold text-xs">
                            <Server className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                              {srv.domain ? (
                                <a
                                  href={`https://${srv.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-1 text-zinc-900"
                                >
                                  {srv.domain}
                                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                                </a>
                              ) : (
                                <span className="text-zinc-400 italic">Belum disetting</span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                              <span>{srv.service_code}</span>
                              <button
                                onClick={() => copyText(srv.service_code, srv.service_code)}
                                className="text-zinc-400 hover:text-zinc-700"
                                title="Salin kode layanan"
                              >
                                {copiedId === srv.service_code ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-zinc-900 font-medium">{srv.customer_name || 'Pelanggan'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{srv.customer_email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-lg">
                          {srv.plan_name || 'Business Cloud'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(srv.status)}
                      </td>

                      {isSubscriptionMode ? (
                        <>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-700 font-medium">
                            Tahunan (1 Tahun)
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                            {srv.expires_at
                              ? new Date(srv.expires_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            {daysRemaining !== null ? (
                              daysRemaining > 30 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {daysRemaining} hari lagi
                                </span>
                              ) : daysRemaining > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  {daysRemaining} hari (segera habis)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                                  Kedaluwarsa
                                </span>
                              )
                            ) : (
                              <span className="text-zinc-400 font-mono">-</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-4 font-mono text-zinc-800 font-semibold">
                            {srv.cpanel_username || (
                              <span className="text-zinc-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-600">
                            103.119.237.132
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                            {srv.disk_usage_mb || 0} MB / {srv.disk_limit_mb || 5000} MB
                          </td>
                        </>
                      )}

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedService(srv)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                        >
                          Detail Layanan
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

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {selectedService.domain || selectedService.service_code}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {selectedService.service_code} &bull; {selectedService.plan_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[11px] text-zinc-400 font-medium block">Pelanggan</span>
                  <span className="text-zinc-900 font-bold block mt-1">{selectedService.customer_name}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">{selectedService.customer_email}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[11px] text-zinc-400 font-medium block">Status Layanan</span>
                  <div className="mt-1">{getStatusBadge(selectedService.status)}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2.5">
                <h4 className="font-bold text-zinc-900 text-xs">Kredensial & Konfigurasi Server</h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-600 font-mono text-[11px]">
                  <div>cPanel Username: <strong className="text-zinc-900">{selectedService.cpanel_username || '-'}</strong></div>
                  <div>Server IP: <strong className="text-zinc-900">103.119.237.132</strong></div>
                  <div>Nameserver 1: <strong className="text-zinc-900">ns1.1slabs.my.id</strong></div>
                  <div>Nameserver 2: <strong className="text-zinc-900">ns2.1slabs.my.id</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 bg-white space-y-2">
                <h4 className="font-bold text-zinc-900 text-xs">Masa Aktif & Siklus Perpanjangan</h4>
                <div className="flex justify-between items-center text-zinc-600 text-[11px]">
                  <span>Tanggal Kedaluwarsa:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {selectedService.expires_at ? new Date(selectedService.expires_at).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 text-[11px]">
                  <span>Sisa Hari Aktif:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {calculateDaysRemaining(selectedService.expires_at) || 0} hari
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-zinc-100 mt-5">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl cursor-pointer"
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
