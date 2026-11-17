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
import { LaravelApplicationsAdminView } from './views/LaravelApplicationsAdminView';
import { InquiriesManagementView } from './views/InquiriesManagementView';
import { FeedbackManagementView } from './views/FeedbackManagementView';
import { DocsManagementView } from './views/DocsManagementView';
import { MarketingView } from './views/marketing/MarketingView';
import { HRManagementView } from './views/hr/HRManagementView';
import { ArticlesManagementView } from './views/content/ArticlesManagementView';
import { SeoIntelligenceTab } from './views/content/SeoIntelligenceTab';
import { ContentStrategyTab } from './views/content/ContentStrategyTab';
import { EditorialKanbanTab } from './views/content/EditorialKanbanTab';
import { TechnicalSeoTab } from './views/content/TechnicalSeoTab';
import { AutomationHubView, AutomationSubtabKey } from './views/automation/AutomationHubView';
import notify from '../../lib/notify';

export const AdminLayout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const isMarketingUser = user?.role === 'marketing';

  const isMarketingAllowedTab = (tab: string) => {
    return (
      tab.startsWith('marketing') ||
      tab.startsWith('hr') ||
      tab.startsWith('blog-') ||
      tab.startsWith('ai-automation') ||
      ['feedback', 'inquiries', 'emails', 'email-templates', 'docs-management'].includes(tab)
    );
  };

  const urlTab = searchParams.get('tab');
  const initialTab = isMarketingUser
    ? (urlTab && isMarketingAllowedTab(urlTab) ? (urlTab as AdminMenuKey) : 'marketing')
    : ((urlTab as AdminMenuKey) || 'dashboard');

  const [activeTab, setActiveTab] = useState<AdminMenuKey>(initialTab);
  const initialEditParam = searchParams.get('editId');
  const [blogEditId, setBlogEditId] = useState<number | null | undefined>(
    initialEditParam === 'new'
      ? null
      : initialEditParam && /^\d+$/.test(initialEditParam)
        ? parseInt(initialEditParam, 10)
        : undefined
  );

  const openBlogEditor = (articleId: number | null = null) => {
    setBlogEditId(articleId);
    setActiveTab('blog-articles');
    setSearchParams({
      tab: 'blog-articles',
      editId: articleId ? String(articleId) : 'new'
    });
  };

  const closeBlogEditor = () => {
    setBlogEditId(undefined);
    setActiveTab('blog-articles');
    setSearchParams({ tab: 'blog-articles' });
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notifications and badge counts
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);

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

  // Sync tab and blog editId with URL search parameter & enforce marketing access
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as AdminMenuKey;
    if (isMarketingUser) {
      if (!tabFromUrl || !isMarketingAllowedTab(tabFromUrl)) {
        setActiveTab('marketing');
        setSearchParams({ tab: 'marketing' });
        return;
      }
    }
    if (tabFromUrl) {
      setActiveTab((prev) => (prev === tabFromUrl ? prev : tabFromUrl));
    }

    const editParam = searchParams.get('editId');
    const parsedEditId =
      editParam === 'new'
        ? null
        : editParam && /^\d+$/.test(editParam)
          ? parseInt(editParam, 10)
          : undefined;
    setBlogEditId((prev) => (prev === parsedEditId ? prev : parsedEditId));
  }, [searchParams, isMarketingUser]);

  const handleSelectTab = (tab: AdminMenuKey | string) => {
    const validTab = tab as AdminMenuKey;
    if (isMarketingUser && !isMarketingAllowedTab(validTab)) {
      notify.warning('Sebagai tim Marketing, akses Anda difokuskan pada Growth & Intelligence serta Communication.');
      return;
    }
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
      case 'hr':
      case 'hr-dashboard':
      case 'hr-candidates':
      case 'hr-pipeline':
      case 'hr-campaigns':
      case 'hr-inbox':
      case 'hr-interviews':
      case 'hr-positions': {
        const sub = (
          activeTab === 'hr' || activeTab === 'hr-dashboard'
            ? 'dashboard'
            : activeTab.replace('hr-', '')
        ) as any;
        return (
          <HRManagementView
            key={refreshKey}
            initialSubtab={sub}
            onNavigateSubtab={(newSub) => handleSelectTab(`hr-${newSub}` as AdminMenuKey)}
            onNavigate={handleSelectTab}
          />
        );
      }
      case 'marketing':
      case 'marketing-overview':
      case 'marketing-discovery':
      case 'marketing-companies':
      case 'marketing-email-discovery':
      case 'marketing-review':
      case 'marketing-indonesia':
      case 'marketing-international':
      case 'marketing-prospects':
      case 'marketing-research':
      case 'marketing-ai-agent':
      case 'marketing-sources':
      case 'marketing-contacts':
      case 'marketing-campaigns':
      case 'marketing-inbox':
      case 'marketing-followups':
      case 'marketing-analytics':
      case 'marketing-settings': {
        const sub = (
          activeTab === 'marketing' || activeTab === 'marketing-overview'
            ? 'overview'
            : activeTab.replace('marketing-', '')
        ) as any;
        return (
          <MarketingView
            key={refreshKey}
            initialSubtab={sub}
            onNavigateSubtab={(newSub) => handleSelectTab(`marketing-${newSub}` as AdminMenuKey)}
          />
        );
      }
      case 'freeplan-claims':
        return <FreePlanClaimsView key={refreshKey} />;
      case 'nodejs-manager':
        return <NodeJsApplicationsAdminView key={refreshKey} />;
      case 'laravel-manager':
        return <LaravelApplicationsAdminView key={refreshKey} />;
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
      case 'feedback':
      case 'meeting-feedback' as any:
        return <FeedbackManagementView key={refreshKey} />;
      case 'inquiries':
      case 'inquiry-management' as any:
        return <InquiriesManagementView key={refreshKey} />;
      case 'emails':
      case 'email-management' as any:
      case 'email-logs' as any:
        return <EmailManagementView key={refreshKey} onNavigate={handleSelectTab} />;
      case 'email-templates':
        return <EmailTemplateEditorView key={refreshKey} />;
      case 'docs-management':
      case 'docs' as any:
        return <DocsManagementView key={refreshKey} />;
      case 'blog-articles':
        return (
          <ArticlesManagementView
            key={refreshKey}
            editArticleId={blogEditId}
            onOpenEditor={(id) => openBlogEditor(id ?? null)}
            onCloseEditor={() => closeBlogEditor()}
          />
        );
      case 'blog-seo':
        return <SeoIntelligenceTab key={refreshKey} onOpenEditor={(id) => openBlogEditor(id)} />;
      case 'blog-strategy':
        return <ContentStrategyTab key={refreshKey} onOpenEditor={(id) => openBlogEditor(id)} />;
      case 'blog-kanban':
        return <EditorialKanbanTab key={refreshKey} onOpenEditor={(id) => openBlogEditor(id ?? null)} />;
      case 'blog-technical':
        return <TechnicalSeoTab key={refreshKey} />;
      case 'ai-automation':
      case 'ai-automation-overview':
      case 'ai-automation-generate':
      case 'ai-automation-batch':
      case 'ai-automation-review':
      case 'ai-automation-scheduler':
      case 'ai-automation-strategy':
      case 'ai-automation-published':
      case 'ai-automation-seo':
      case 'ai-automation-knowledge':
      case 'ai-automation-settings': {
        const sub = (
          activeTab === 'ai-automation' || activeTab === 'ai-automation-overview'
            ? 'overview'
            : activeTab.replace('ai-automation-', '')
        ) as AutomationSubtabKey;
        return (
          <AutomationHubView
            key={refreshKey}
            initialSubtab={sub}
            onNavigateSubtab={(newSub) => handleSelectTab(`ai-automation-${newSub}` as AdminMenuKey)}
            onOpenBlogEditor={(id) => openBlogEditor(id ?? null)}
          />
        );
      }
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

  const isBlogEditorOpen = activeTab === 'blog-articles' && blogEditId !== undefined;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {!isBlogEditorOpen && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {!isBlogEditorOpen && (
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
      )}

      {/* Main Content Area */}
      <div
        className={`admin-main-wrapper flex-1 flex flex-col transition-all duration-300 print:pl-0 print:m-0 print:w-full ${
          isBlogEditorOpen ? '' : sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header */}
        {!isBlogEditorOpen && (
          <div className="admin-header-wrapper print:hidden">
            <AdminHeader
              currentMenu={activeTab}
              onSelectMenu={handleSelectTab}
              onRefreshData={handleGlobalRefresh}
              isRefreshing={isRefreshing}
              onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              adminName={user?.name || 'Administrator'}
              adminEmail={user?.email || 'admin@1slabs.my.id'}
              adminRole={user?.role}
              onLogout={logout}
              notifications={notifications}
              unreadNotificationsCount={unreadNotifCount}
            />
          </div>
        )}

        {/* View Surface */}
        <main
          className={
            isBlogEditorOpen
              ? 'flex-1 p-0 m-0 max-w-none w-full'
              : 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full'
          }
        >
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};
