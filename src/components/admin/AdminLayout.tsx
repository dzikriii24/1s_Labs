import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminSidebar, AdminMenuKey } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAuth } from '../../contexts/AuthContext';
import { api, AdminNotificationItem } from '../../services/api';

import { OverviewDashboardView } from './views/OverviewDashboardView';
import { AnalyticsDashboardView } from './views/AnalyticsDashboardView';
import { CustomerManagementView } from './views/CustomerManagementView';
import { HostingManagementView } from './views/HostingManagementView';
import { HostingOrdersView } from './views/HostingOrdersView';
import { HostingPlansView } from './views/HostingPlansView';
import { ServerMonitoringView } from './views/ServerMonitoringView';
import { ResourceUsageView } from './views/ResourceUsageView';
import { DomainManagementView } from './views/DomainManagementView';
import { SslCertificatesView } from './views/SslCertificatesView';
import { RevenueOverviewView } from './views/RevenueOverviewView';
import { TransactionsView } from './views/TransactionsView';
import { InvoiceManagementView } from './views/InvoiceManagementView';
import { PaymentProofsVaultView } from './views/PaymentProofsVaultView';
import { ServiceReportGeneratorView } from './views/ServiceReportGeneratorView';
import { EmailManagementView } from './views/EmailManagementView';
import { EmailTemplateEditorView } from './views/EmailTemplateEditorView';
import { GeneralSettingsView } from './views/GeneralSettingsView';
import { ServerConfigView } from './views/ServerConfigView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { AdminManagementView } from './views/AdminManagementView';
import { FreePlanClaimsView } from './views/FreePlanClaimsView';
import { NodeJsApplicationsAdminView } from './views/NodeJsApplicationsAdminView';

export const AdminLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminMenuKey) || 'dashboard';

  const [activeTab, setActiveTab] = useState<AdminMenuKey>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notifications and badge counts
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);

  const { user, logout } = useAuth();

  const loadHeaderBadges = async () => {
    try {
      const [notifRes, pendingRes] = await Promise.all([
        api.admin.getNotifications(),
        api.admin.getPayments({ status: 'pending_verification' })
      ]);
      if (notifRes.success && notifRes.notifications) {
        setNotifications(notifRes.notifications);
      }
      if (pendingRes.success && pendingRes.payments) {
        setPendingVerificationsCount(pendingRes.payments.length);
      }
    } catch (err) {
      console.warn('Failed to load notification badges in AdminLayout', err);
    }
  };

  useEffect(() => {
    loadHeaderBadges();
  }, [refreshKey]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AdminMenuKey;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleSelectTab = (tab: AdminMenuKey | string) => {
    const validTab = tab as AdminMenuKey;
    setActiveTab(validTab);
    setSearchParams({ tab: validTab });
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    await loadHeaderBadges();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OverviewDashboardView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'analytics':
        return <AnalyticsDashboardView key={refreshKey} />;
      case 'freeplan-claims':
        return <FreePlanClaimsView key={refreshKey} />;
      case 'nodejs-manager':
        return <NodeJsApplicationsAdminView key={refreshKey} />;
      case 'customers':
      case 'customer-list' as any:
        return <CustomerManagementView key={refreshKey} />;
      case 'customer-services':
        return <HostingManagementView key={`${refreshKey}-srv`} onNavigate={handleSelectTab} viewMode="services" />;
      case 'hosting-subscriptions':
        return <HostingManagementView key={`${refreshKey}-sub`} onNavigate={handleSelectTab} viewMode="subscriptions" />;
      case 'hosting-orders':
        return <HostingOrdersView key={refreshKey} />;
      case 'hosting-plans':
        return <HostingPlansView key={refreshKey} />;
      case 'server-monitoring':
        return <ServerMonitoringView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'resource-usage':
        return <ResourceUsageView key={refreshKey} />;
      case 'domains':
      case 'domain-list' as any:
        return <DomainManagementView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'ssl-certs' as any:
      case 'ssl-certificates':
      case 'ssl-monitoring':
        return <SslCertificatesView key={refreshKey} />;
      case 'revenue':
      case 'revenue-overview' as any:
        return <RevenueOverviewView key={`${refreshKey}-rev`} viewMode="overview" />;
      case 'financial-reports':
        return <RevenueOverviewView key={`${refreshKey}-rep`} viewMode="reports" />;
      case 'transactions':
        return <TransactionsView key={refreshKey} />;
      case 'invoices':
      case 'invoice-management' as any:
        return <InvoiceManagementView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'proof-vault':
      case 'payment-proofs' as any:
        return <PaymentProofsVaultView key={refreshKey} />;
      case 'service-reports':
        return <ServiceReportGeneratorView key={refreshKey} />;
      case 'emails':
      case 'email-management' as any:
      case 'email-logs' as any:
        return <EmailManagementView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'email-templates':
        return <EmailTemplateEditorView key={refreshKey} />;
      case 'settings':
      case 'general-settings' as any:
        return <GeneralSettingsView key={refreshKey} />;
      case 'server-config':
        return <ServerConfigView key={refreshKey} />;
      case 'activity-logs':
        return <ActivityLogsView key={refreshKey} />;
      case 'admin-management' as any:
        return <AdminManagementView key={refreshKey} />;
      default:
        return <OverviewDashboardView key={refreshKey} onNavigate={handleSelectTab} />;
    }
  };

  const unreadNotifCount = notifications.filter(
    (n) => n.level === 'critical' || n.level === 'warning'
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`admin-sidebar-wrapper print:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          currentMenu={activeTab}
          onSelectMenu={handleSelectTab}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          pendingVerificationsCount={pendingVerificationsCount}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`admin-main-wrapper flex-1 flex flex-col transition-all duration-300 print:pl-0 print:m-0 print:w-full ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header */}
        <div className="admin-header-wrapper print:hidden">
          <AdminHeader
            currentMenu={activeTab}
            onSelectMenu={handleSelectTab}
            onRefreshData={handleGlobalRefresh}
            isRefreshing={isRefreshing}
            onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            adminName={user?.name || 'Administrator'}
            adminEmail={user?.email || 'admin@1slabs.my.id'}
            onLogout={logout}
            notifications={notifications}
            unreadNotificationsCount={unreadNotifCount}
          />
        </div>

        {/* View Surface */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};
