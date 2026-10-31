import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Layers,
  CreditCard,
  Package,
  ShoppingBag,
  Activity,
  Cpu,
  Globe,
  ShieldCheck,
  Lock,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Mail,
  MessageSquare,
  SlidersHorizontal,
  Settings,
  Server,
  History,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  FolderArchive
} from 'lucide-react';

export type AdminMenuKey =
  | 'dashboard'
  | 'analytics'
  | 'freeplan-claims'
  | 'customers'
  | 'customer-services'
  | 'hosting-subscriptions'
  | 'hosting-plans'
  | 'hosting-orders'
  | 'nodejs-manager'
  | 'server-monitoring'
  | 'resource-usage'
  | 'domains'
  | 'ssl-certificates'
  | 'ssl-monitoring'
  | 'revenue'
  | 'transactions'
  | 'financial-reports'
  | 'invoices'
  | 'proof-vault'
  | 'service-reports'
  | 'inquiries'
  | 'emails'
  | 'email-templates'
  | 'settings'
  | 'server-config'
  | 'activity-logs';

interface MenuGroup {
  title: string;
  items: {
    key: AdminMenuKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

interface AdminSidebarProps {
  currentMenu: AdminMenuKey;
  onSelectMenu: (menu: AdminMenuKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingVerificationsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isCollapsed,
  onToggleCollapse,
  pendingVerificationsCount = 0
}) => {
  const menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'analytics', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { key: 'customers', label: 'Customer Management', icon: Users },
        { key: 'customer-services', label: 'Layanan Hosting (Services)', icon: Layers },
        { key: 'hosting-subscriptions', label: 'Langganan & Masa Aktif', icon: CreditCard }
      ]
    },
    {
      title: 'HOSTING MANAGEMENT',
      items: [
        { key: 'freeplan-claims', label: 'Free Plan Claims', icon: Sparkles },
        { key: 'nodejs-manager', label: 'Node.js Applications', icon: Cpu },
        { key: 'hosting-plans', label: 'Hosting Plans', icon: Package },
        { key: 'hosting-orders', label: 'Hosting Orders', icon: ShoppingBag },
        { key: 'server-monitoring', label: 'Server Monitoring', icon: Activity },
        { key: 'resource-usage', label: 'Resource Usage', icon: Server }
      ]
    },
    {
      title: 'DOMAIN & SECURITY',
      items: [
        { key: 'domains', label: 'Domain Management', icon: Globe },
        { key: 'ssl-certificates', label: 'SSL Certificates', icon: ShieldCheck },
        { key: 'ssl-monitoring', label: 'SSL Monitoring', icon: Lock }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { key: 'revenue', label: 'Revenue Overview', icon: TrendingUp },
        {
          key: 'transactions',
          label: 'Transactions',
          icon: Receipt,
          badge: pendingVerificationsCount > 0 ? String(pendingVerificationsCount) : undefined
        },
        { key: 'financial-reports', label: 'Financial Reports', icon: FileSpreadsheet },
        { key: 'invoices', label: 'Invoice Management', icon: FileText },
        { key: 'proof-vault', label: 'Brankas Bukti (Vault)', icon: FolderArchive },
        { key: 'service-reports', label: 'Service Reports', icon: ClipboardList }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { key: 'inquiries', label: 'Inquiry & Konsultasi', icon: MessageSquare },
        { key: 'emails', label: 'Email Management', icon: Mail },
        { key: 'email-templates', label: 'Email Templates', icon: SlidersHorizontal }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { key: 'settings', label: 'General Settings', icon: Settings },
        { key: 'server-config', label: 'Server Configuration', icon: Server },
        { key: 'activity-logs', label: 'Activity Logs', icon: History }
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
        <a href="/" className="flex items-center space-x-2.5 overflow-hidden">
          <img
            src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
            alt="1sLabs"
            className="h-7 w-auto object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono">
                Admin
              </span>
            </div>
          )}
        </a>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
                const isActive = currentMenu === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectMenu(item.key)}
                    className={`w-full flex items-center rounded-xl transition-all font-medium text-xs group relative ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
                    } ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white dark:text-zinc-950' : ''}`} />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left tracking-tight">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Card */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                103.119.237.132
              </span>
            </div>
            <a
              href="https://1slabs.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              title="Kunjungi Website Publik"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Server Operational" />
          </div>
        )}
      </div>
    </aside>
  );
};
