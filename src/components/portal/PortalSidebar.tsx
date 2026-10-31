import React from 'react';
import {
  Layers,
  Gift,
  Globe,
  Server,
  Cpu,
  FileText,
  CreditCard,
  User,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type PortalTabKey =
  | 'overview'
  | 'freeplan'
  | 'domains'
  | 'services'
  | 'nodejs'
  | 'invoices'
  | 'orders'
  | 'profile'
  | 'detail';

interface MenuGroup {
  title: string;
  items: {
    key: PortalTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badgeText?: string;
    badgeColor?: string;
  }[];
}

interface PortalSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  counts: {
    domains: number;
    services: number;
    nodeApps: number;
    invoices: number;
    orders: number;
    freePlanClaimed: boolean;
  };
  user: {
    name?: string;
    email?: string;
  } | null;
  onLogout: () => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  counts,
  user,
  onLogout
}) => {
  const menuGroups: MenuGroup[] = [
    {
      title: 'DASHBOARD',
      items: [
        { key: 'overview', label: 'Overview', icon: Layers },
        {
          key: 'freeplan',
          label: 'Free Plan',
          icon: Gift,
          badgeText: counts.freePlanClaimed ? 'Aktif' : 'Gratis',
          badgeColor: counts.freePlanClaimed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
        }
      ]
    },
    {
      title: 'HOSTING & CLOUD',
      items: [
        { key: 'domains', label: 'My Domains', icon: Globe, count: counts.domains },
        { key: 'services', label: 'Cloud Hosting', icon: Server, count: counts.services },
        { key: 'nodejs', label: 'Node.js APIs', icon: Cpu, count: counts.nodeApps }
      ]
    },
    {
      title: 'BILLING & KEUANGAN',
      items: [
        { key: 'invoices', label: 'Tagihan & Invoice', icon: FileText, count: counts.invoices },
        { key: 'orders', label: 'Riwayat Transaksi', icon: CreditCard, count: counts.orders }
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { key: 'profile', label: 'Pengaturan Akun', icon: User }
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-zinc-800 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <Link to="/portal?tab=overview" className="flex items-center space-x-2.5 overflow-hidden">
          <img
            src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
            alt="1sLabs"
            className="h-7 w-auto object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono">
                Portal
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {!isCollapsed ? (
              <h4 className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
                {group.title}
              </h4>
            ) : (
              <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
            )}

            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key || (item.key === 'services' && currentTab === 'detail');

                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key)}
                    className={`w-full flex items-center rounded-xl transition-all font-medium text-xs group relative cursor-pointer ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
                    } ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white dark:text-zinc-950' : ''
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left tracking-tight">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && typeof item.count === 'number' && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-md ${
                          isActive
                            ? 'bg-zinc-700 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}

                    {!isCollapsed && item.badgeText && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-zinc-200 text-zinc-800'}`}
                      >
                        {item.badgeText}
                      </span>
                    )}

                    {isCollapsed && typeof item.count === 'number' && item.count > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Hosting Order Button */}
        {!isCollapsed && (
          <div className="pt-2">
            <Link
              to="/#hosting"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pesan Hosting Baru</span>
            </Link>
          </div>
        )}
      </div>

      {/* User Info & Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2.5 px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : '1S'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                  {user?.name || 'Customer'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate font-mono">
                  {user?.email || 'customer@1slabs.my.id'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 px-1">
              <a
                href="/"
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition"
              >
                <span>Lihat Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={onLogout}
                className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
              title="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

