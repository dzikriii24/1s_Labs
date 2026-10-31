import React from 'react';
import {
  Globe,
  Server,
  Cpu,
  Gift,
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { HostingService, DomainRecord, NodeJsApp, FreePlanClaim } from '../../services/api';

interface OverviewTabProps {
  services: HostingService[];
  domains: DomainRecord[];
  nodeApps: NodeJsApp[];
  freePlanStatus: {
    eligible: boolean;
    alreadyClaimed: boolean;
    claim: FreePlanClaim | null;
  } | null;
  onNavigateToTab: (tab: string, param?: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  services,
  domains,
  nodeApps,
  freePlanStatus,
  onNavigateToTab
}) => {
  const activeServices = services.filter(s => s.status === 'active');
  const activeDomains = domains.filter(d => d.status === 'active');
  const runningApps = nodeApps.filter(a => a.status === 'running');
  const expiringSoonCount = services.filter(s => s.is_expiring_soon).length + domains.filter(d => d.is_expiring_soon).length;

  return (
    <div className="space-y-6">
      {/* Expiring Soon Alert */}
      {expiringSoonCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <strong className="block font-bold">Peringatan Masa Aktif Layanan</strong>
            <span>
              Terdapat {expiringSoonCount} layanan atau domain yang akan berakhir dalam waktu dekat. Segera lakukan perpanjangan untuk mencegah penangguhan akses otomatis.
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('invoices')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
          >
            Lihat Tagihan
          </button>
        </div>
      )}

      {/* Hero Welcome / Free Plan Callout - Matches 1sLabs brand aesthetic (neutral dark theme, clean typography, no AI slop) */}
      {!freePlanStatus?.alreadyClaimed && (
        <div className="bg-neutral-900 dark:bg-gray-900 border border-neutral-800 dark:border-gray-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Klaim Subdomain (.1slabs.my.id) & Cloud Hosting Gratis
            </h2>
            <p className="text-sm text-neutral-300 dark:text-neutral-400 leading-relaxed">
              Dapatkan 1 subdomain gratis selama 1 tahun dan cloud hosting trial 14 hari dengan integrasi otomatis cPanel dan Node.js API support.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('freeplan')}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm transition shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Klaim Free Plan Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Domains */}
        <div
          onClick={() => onNavigateToTab('domains')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-gray-400 dark:hover:border-gray-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Domain Terdaftar</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{domains.length}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            {activeDomains.length} Aktif
          </span>
        </div>

        {/* Hosting */}
        <div
          onClick={() => onNavigateToTab('services')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-gray-400 dark:hover:border-gray-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cloud Hosting</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{services.length}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            {activeServices.length} Aktif
          </span>
        </div>

        {/* Node.js APIs */}
        <div
          onClick={() => onNavigateToTab('nodejs')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-gray-400 dark:hover:border-gray-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Node.js API</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{nodeApps.length}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            {runningApps.length} Running
          </span>
        </div>

        {/* Free Plan Status */}
        <div
          onClick={() => onNavigateToTab('freeplan')}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs hover:border-gray-400 dark:hover:border-gray-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status Free Plan</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white mt-3">
            {freePlanStatus?.alreadyClaimed ? 'Sudah Diklaim' : 'Belum Diklaim'}
          </p>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1 inline-block">
            {freePlanStatus?.alreadyClaimed ? '1x Seumur Hidup' : 'Klaim Sekarang \u2192'}
          </span>
        </div>
      </div>

      {/* Active Hosting Services Strip */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-900 dark:text-white" />
            Layanan Cloud Hosting Aktif
          </h3>
          <button
            onClick={() => onNavigateToTab('services')}
            className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            Lihat Semua ({services.length}) &rarr;
          </button>
        </div>

        {services.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">Belum ada layanan hosting aktif.</p>
        ) : (
          <div className="space-y-3">
            {services.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {s.domain || s.service_code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold">
                      {s.plan_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                    Kode: <code>{s.service_code}</code> &bull; Berakhir: {new Date(s.expires_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToTab('services', s.service_code)}
                  className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Kelola File & DB
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Node.js APIs Strip */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gray-900 dark:text-white" />
            Node.js Backend APIs
          </h3>
          <button
            onClick={() => onNavigateToTab('nodejs')}
            className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            Buka Manager ({nodeApps.length}) &rarr;
          </button>
        </div>

        {nodeApps.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">Belum ada aplikasi Node.js yang dibuat.</p>
        ) : (
          <div className="space-y-3">
            {nodeApps.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {a.app_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      v{a.nodejs_version}
                    </span>
                  </div>
                  <a
                    href={a.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {a.app_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  a.status === 'running'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-gray-500 bg-gray-200 dark:bg-gray-700'
                }`}>
                  {a.status === 'running' ? 'Running' : 'Stopped'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
