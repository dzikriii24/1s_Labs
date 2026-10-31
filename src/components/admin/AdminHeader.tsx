import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  LogOut,
  ChevronDown,
  User,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { AdminMenuKey } from './AdminSidebar';
import { AdminNotificationItem } from '../../services/api';

export interface AdminHeaderProps {
  currentMenu: AdminMenuKey;
  onSelectMenu: (menu: AdminMenuKey) => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onMobileMenuToggle: () => void;
  adminName?: string;
  adminEmail?: string;
  onLogout?: () => void;
  notifications?: AdminNotificationItem[];
  unreadNotificationsCount?: number;
}

const MENU_TITLES: Record<AdminMenuKey | string, { group: string; title: string }> = {
  dashboard: { group: 'OVERVIEW', title: 'Dashboard Overview' },
  analytics: { group: 'OVERVIEW', title: 'Analytics Dashboard' },
  customers: { group: 'CUSTOMERS', title: 'Customer Management' },
  'customer-services': { group: 'CUSTOMERS', title: 'Customer Services' },
  'hosting-subscriptions': { group: 'CUSTOMERS', title: 'Hosting Subscriptions' },
  'hosting-plans': { group: 'HOSTING MANAGEMENT', title: 'Hosting Plans' },
  'hosting-orders': { group: 'HOSTING MANAGEMENT', title: 'Hosting Orders' },
  'server-monitoring': { group: 'HOSTING MANAGEMENT', title: 'Server Monitoring' },
  'resource-usage': { group: 'HOSTING MANAGEMENT', title: 'Resource Usage & Processes' },
  domains: { group: 'DOMAIN & SECURITY', title: 'Domain Management' },
  'ssl-certificates': { group: 'DOMAIN & SECURITY', title: 'SSL Certificates' },
  'ssl-monitoring': { group: 'DOMAIN & SECURITY', title: 'SSL Monitoring & Diagnostics' },
  revenue: { group: 'FINANCE', title: 'Revenue Overview' },
  transactions: { group: 'FINANCE', title: 'Transactions & Verifications' },
  'financial-reports': { group: 'FINANCE', title: 'Financial Reports' },
  invoices: { group: 'FINANCE', title: 'Invoice Management' },
  'service-reports': { group: 'FINANCE', title: 'Service Report Generator' },
  inquiries: { group: 'COMMUNICATION', title: 'Manajemen Inquiry & Konsultasi' },
  emails: { group: 'COMMUNICATION', title: 'Email Management & Logs' },
  'email-templates': { group: 'COMMUNICATION', title: 'Email Template Customization' },
  settings: { group: 'SYSTEM', title: 'General Settings' },
  'server-config': { group: 'SYSTEM', title: 'Server Configuration' },
  'activity-logs': { group: 'SYSTEM', title: 'System Activity Logs' },
  'admin-management': { group: 'SYSTEM', title: 'Admin Team & RBAC' }
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentMenu,
  onSelectMenu,
  onRefreshData,
  isRefreshing = false,
  onMobileMenuToggle,
  adminName = 'Administrator',
  adminEmail = 'admin@1slabs.my.id',
  onLogout = () => {},
  notifications = [],
  unreadNotificationsCount = 0
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('oneslabs_dismissed_notifs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleDismissNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = [...dismissedNotifIds, id];
    setDismissedNotifIds(updated);
    try {
      localStorage.setItem('oneslabs_dismissed_notifs', JSON.stringify(updated));
    } catch {}
  };

  const handleClearAllNotifs = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...dismissedNotifIds, ...allIds]));
    setDismissedNotifIds(updated);
    try {
      localStorage.setItem('oneslabs_dismissed_notifs', JSON.stringify(updated));
    } catch {}
  };

  const visibleNotifications = notifications.filter((n) => !dismissedNotifIds.includes(n.id));
  const activeUnreadCount = visibleNotifications.filter(
    (n) => n.level === 'critical' || n.level === 'warning'
  ).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentInfo = MENU_TITLES[currentMenu] || { group: 'ADMIN', title: 'Platform Control' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          title="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-zinc-400 font-mono font-medium hidden sm:inline">
            1sLabs Admin
          </span>
          <span className="text-zinc-300 hidden sm:inline">/</span>
          <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
            {currentInfo.group}
          </span>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-900 truncate max-w-[180px] sm:max-w-none">
            {currentInfo.title}
          </span>
        </div>
      </div>

      {/* Right Action Icons: Refresh, Notifications, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Refresh Current Data Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
          title="Segarkan data backend"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`} />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors relative cursor-pointer"
            title="Pusat Notifikasi Sistem"
          >
            <Bell className="w-4 h-4" />
            {activeUnreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-zinc-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-xs text-zinc-900">Pusat Notifikasi</h4>
                  {activeUnreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      {activeUnreadCount} Baru
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {visibleNotifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifs}
                      className="text-[11px] font-medium text-zinc-500 hover:text-rose-600 transition-colors"
                      title="Hapus semua notifikasi"
                    >
                      Hapus Semua
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors ml-1"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto py-2 space-y-2">
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-medium text-zinc-700">Semua Sistem Terkendali</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Tidak ada peringatan atau tindakan tertunda.</p>
                  </div>
                ) : (
                  visibleNotifications.map((n) => {
                    const isCrit = n.level === 'critical';
                    const isWarn = n.level === 'warning';
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.type === 'payment') onSelectMenu('transactions');
                          else if (n.type === 'hosting_expiration') onSelectMenu('customer-services');
                          else if (n.type === 'email_failure') onSelectMenu('emails');
                          setIsNotifOpen(false);
                        }}
                        className="group p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-100/70 transition-colors cursor-pointer relative"
                      >
                        <div className="flex items-start space-x-2.5">
                          {isCrit ? (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0 pr-5">
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                              {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDismissNotif(e, n.id)}
                            className="text-zinc-300 hover:text-rose-500 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                            title="Hapus notifikasi ini"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xs font-mono shadow-xs">
              {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-zinc-900 dark:text-white leading-tight truncate max-w-[120px]">
                {adminName || 'Admin'}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-zinc-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                <p className="text-xs font-bold text-zinc-900">{adminName}</p>
                <p className="text-[11px] text-zinc-400 truncate">{adminEmail}</p>
              </div>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onSelectMenu('settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 flex items-center space-x-2"
              >
                <Shield className="w-4 h-4 text-zinc-400" />
                <span>Pengaturan Sistem</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onSelectMenu('activity-logs');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-zinc-400" />
                <span>Log Aktivitas Anda</span>
              </button>

              <div className="my-1 border-t border-zinc-100" />

              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
