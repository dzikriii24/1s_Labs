import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  Store,
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
  ChevronDown,
  ExternalLink,
  Sparkles,
  FolderArchive,
  Target,
  Bot,
  Zap,
  Database,
  Search,
  Send,
  Inbox,
  CalendarCheck,
  BookOpen
} from 'lucide-react';

export type AdminMenuKey =
  | 'dashboard'
  | 'analytics'
  | 'marketing'
  | 'marketing-overview'
  | 'marketing-indonesia'
  | 'marketing-international'
  | 'marketing-prospects'
  | 'marketing-research'
  | 'marketing-ai-agent'
  | 'marketing-sources'
  | 'marketing-contacts'
  | 'marketing-campaigns'
  | 'marketing-inbox'
  | 'marketing-followups'
  | 'marketing-analytics'
  | 'marketing-settings'
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
  | 'feedback'
  | 'inquiries'
  | 'emails'
  | 'email-templates'
  | 'docs-management'
  | 'settings'
  | 'server-config'
  | 'activity-logs'
  | 'admin-management';

interface SubMenuItem {
  key: AdminMenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SubSection {
  sectionTitle: string;
  subItems: SubMenuItem[];
}

interface MenuItem {
  key: AdminMenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subSections?: SubSection[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
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
  const isMarketingMenu = currentMenu.startsWith('marketing');
  const [marketingExpanded, setMarketingExpanded] = useState<boolean>(true);

  // Auto-expand marketing submenu if active
  useEffect(() => {
    if (isMarketingMenu) {
      setMarketingExpanded(true);
    }
  }, [isMarketingMenu]);

  const menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'analytics', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'GROWTH & INTELLIGENCE',
      items: [
        {
          key: 'marketing',
          label: 'Marketing',
          icon: Target,
          badge: 'AI',
          subSections: [
            {
              sectionTitle: 'SMALL BUSINESS INTELLIGENCE',
              subItems: [
                { key: 'marketing-overview', label: 'Overview', icon: LayoutDashboard },
                { key: 'marketing-indonesia', label: 'Indonesia Business', icon: Store, badge: 'UMKM' },
                { key: 'marketing-international', label: 'International Business', icon: Globe, badge: 'Global' },
                { key: 'marketing-contacts', label: 'Contact Management', icon: Users },
                { key: 'marketing-sources', label: 'Scraping & Discovery', icon: Layers },
                { key: 'marketing-ai-agent', label: 'AI Research', icon: Bot, badge: 'AI' }
              ]
            },
            {
              sectionTitle: 'OUTREACH & COMMS',
              subItems: [
                { key: 'marketing-campaigns', label: 'Email Campaigns', icon: Send, badge: '100/day' },
                { key: 'marketing-inbox', label: 'Responses', icon: Inbox }
              ]
            },
            {
              sectionTitle: 'CONFIG',
              subItems: [
                { key: 'marketing-settings', label: 'Marketing Settings', icon: Settings }
              ]
            }
          ]
        }
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
        { key: 'feedback', label: 'Feedback & Jadwal Meeting', icon: CalendarCheck },
        { key: 'inquiries', label: 'Inquiry & Konsultasi', icon: MessageSquare },
        { key: 'emails', label: 'Email Management', icon: Mail },
        { key: 'email-templates', label: 'Email Templates', icon: SlidersHorizontal },
        { key: 'docs-management', label: 'Pusat Dokumentasi', icon: BookOpen, badge: 'Docs' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { key: 'admin-management', label: 'User & Role Management', icon: Users, badge: 'RBAC' },
        { key: 'settings', label: 'General Settings', icon: Settings },
        { key: 'server-config', label: 'Server Configuration', icon: Server },
        { key: 'activity-logs', label: 'Activity Logs', icon: History }
      ]
    }
  ];

  const { user } = useAuth();
  const isMarketingUser = user?.role === 'marketing';
  const visibleMenuGroups = isMarketingUser
    ? menuGroups.filter(g => g.title === 'GROWTH & INTELLIGENCE' || g.title === 'COMMUNICATION')
    : menuGroups;

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
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
                isMarketingUser
                  ? 'bg-purple-900 text-purple-200 border border-purple-700'
                  : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
              }`}>
                {isMarketingUser ? 'Marketing' : 'Super Admin'}
              </span>
            </div>
          )}
        </a>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {visibleMenuGroups.map((group, groupIndex) => (
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
                const hasSub = !!item.subSections && item.subSections.length > 0;
                const isMarketingRoot = item.key === 'marketing';
                const isCurrentActive =
                  currentMenu === item.key ||
                  (isMarketingRoot && (currentMenu === 'marketing' || currentMenu === 'marketing-overview'));

                const isParentActive = isMarketingRoot && isMarketingMenu;

                return (
                  <div key={item.key} className="space-y-1">
                    {/* Main Menu Item Button */}
                    <button
                      onClick={() => {
                        if (hasSub) {
                          if (isCollapsed) {
                            onSelectMenu('marketing-overview');
                          } else {
                            setMarketingExpanded(!marketingExpanded);
                            if (!isMarketingMenu) {
                              onSelectMenu('marketing-overview');
                            }
                          }
                        } else {
                          onSelectMenu(item.key);
                        }
                      }}
                      className={`w-full flex items-center rounded-xl transition-all font-medium text-xs group relative cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-2.5'
                      } ${
                        isCurrentActive && !hasSub
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                          : isParentActive
                          ? 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-950 dark:text-white font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isCurrentActive ? 'text-white dark:text-zinc-950' : isParentActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      />
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

                      {!isCollapsed && hasSub && (
                        <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform ml-1">
                          {marketingExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}

                      {isCollapsed && item.badge && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>

                    {/* Submenu sections (Expanded under Marketing) */}
                    {!isCollapsed && hasSub && marketingExpanded && item.subSections && (
                      <div className="ml-4 pl-2.5 border-l-2 border-zinc-200 dark:border-zinc-800/80 space-y-3.5 my-1.5 transition-all">
                        {item.subSections.map((sec, sIdx) => (
                          <div key={sIdx} className="space-y-1">
                            <div className="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              {sec.sectionTitle}
                            </div>
                            <div className="space-y-0.5">
                              {sec.subItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive =
                                  currentMenu === sub.key ||
                                  (sub.key === 'marketing-overview' && currentMenu === 'marketing');

                                return (
                                  <button
                                    key={sub.key}
                                    onClick={() => onSelectMenu(sub.key)}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                                      isSubActive
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <SubIcon
                                        className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105 ${
                                          isSubActive ? 'text-white dark:text-zinc-950' : 'text-zinc-500'
                                        }`}
                                      />
                                      <span className="truncate tracking-tight">{sub.label}</span>
                                    </div>
                                    {sub.badge && (
                                      <span
                                        className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-md shrink-0 ${
                                          isSubActive
                                            ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900'
                                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
