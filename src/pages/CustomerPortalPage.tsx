import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Globe,
  Database,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  FileText,
  CreditCard,
  User,
  LogOut,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Activity,
  Calendar,
  Sparkles,
  Loader2,
  Mail,
  Zap,
  Terminal,
  Settings,
  HelpCircle,
  Plus,
  Folder,
  Copy,
  Check,
  FileCheck,
  Gift,
  Cloud,
  Cpu,
  PieChart,
  BarChart3,
  Wifi,
  X
} from 'lucide-react';
import { api, HostingService, Order, Invoice, DomainRecord, NodeJsApp, FreePlanClaim } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { FileManagerTab } from '../components/hosting/FileManagerTab';
import { FtpManagementTab } from '../components/hosting/FtpManagementTab';
import { DatabaseManagementTab } from '../components/hosting/DatabaseManagementTab';
import { AnalyticsTab } from '../components/hosting/AnalyticsTab';
import { OverviewTab } from '../components/portal/OverviewTab';
import { FreePlanTab } from '../components/portal/FreePlanTab';
import { DomainsTab } from '../components/portal/DomainsTab';
import { NodeJsAppsTab } from '../components/portal/NodeJsAppsTab';
import { PortalSidebar } from '../components/portal/PortalSidebar';
import { PortalHeader } from '../components/portal/PortalHeader';


export const CustomerPortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'overview';
  const selectedServiceCode = searchParams.get('service');

  const [services, setServices] = useState<HostingService[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [nodeApps, setNodeApps] = useState<NodeJsApp[]>([]);
  const [freePlanStatus, setFreePlanStatus] = useState<{
    eligible: boolean;
    alreadyClaimed: boolean;
    claim: FreePlanClaim | null;
  } | null>(null);

  const [selectedService, setSelectedService] = useState<HostingService | null>(null);
  const [serviceSubTab, setServiceSubTab] = useState<'overview' | 'files' | 'ftp' | 'databases' | 'analytics'>('overview');

  // Profile edit state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Renewal processing state
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [copiedNs, setCopiedNs] = useState<number | null>(null);
  const [copiedIp, setCopiedIp] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Order cancellation state
  const [isCancellingOrder, setIsCancellingOrder] = useState<string | null>(null);

  // Change domain modal state
  const [isChangeDomainModalOpen, setIsChangeDomainModalOpen] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [isChangingDomain, setIsChangingDomain] = useState(false);
  const [changeDomainError, setChangeDomainError] = useState<string | null>(null);
  const [changeDomainSuccess, setChangeDomainSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout states for Sidebar & Header
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user, logout, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/portal');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [srvRes, ordRes, invRes, domRes, nodeRes, fpRes] = await Promise.all([
        api.services.getAll(),
        api.orders.getAll(),
        api.invoices.getAll(),
        api.domains.list().catch(() => ({ success: true, domains: [] })),
        api.nodejs.listApps().catch(() => ({ success: true, applications: [] })),
        api.freePlan.getStatus().catch(() => ({ success: true, eligible: true, alreadyClaimed: false, claim: null }))
      ]);

      if (srvRes.success) setServices(srvRes.services);
      if (ordRes.success) setOrders(ordRes.orders);
      if (invRes.success) setInvoices(invRes.invoices);
      if (domRes.success) setDomains(domRes.domains);
      if (nodeRes.success) setNodeApps(nodeRes.applications);
      if (fpRes.success) setFreePlanStatus(fpRes);

      // If a service code is selected in URL, load its full detail
      if (selectedServiceCode) {
        const found = srvRes.services?.find(s => s.service_code === selectedServiceCode);
        if (found) {
          const detailRes = await api.services.getByCode(selectedServiceCode);
          if (detailRes.success && detailRes.service) {
            setSelectedService(detailRes.service);
          }
        }
      } else if (srvRes.services && srvRes.services.length > 0 && activeTabParam === 'detail') {
        const first = srvRes.services[0];
        const detailRes = await api.services.getByCode(first.service_code);
        if (detailRes.success) setSelectedService(detailRes.service);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data portal pelanggan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, selectedServiceCode]);

  const selectService = async (serviceCode: string) => {
    setSearchParams({ tab: 'detail', service: serviceCode });
    try {
      const res = await api.services.getByCode(serviceCode);
      if (res.success) setSelectedService(res.service);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRenewal = async (srv: HostingService) => {
    try {
      setRenewingId(srv.id);
      const res = await api.orders.create({
        plan_id: srv.plan_id,
        type: 'renewal',
        related_service_id: srv.id,
        customer_notes: `Perpanjangan masa aktif 1 tahun untuk domain: ${srv.domain || srv.service_code}`
      });

      if (res.success && res.order) {
        navigate(`/payment/${res.order.orderNumber}`);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan perpanjangan.');
    } finally {
      setRenewingId(null);
    }
  };

  const handleCancelOrder = async (orderNumber: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan pesanan #${orderNumber}? Pesanan yang dibatalkan tidak dapat diproses lagi.`)) {
      return;
    }
    try {
      setIsCancellingOrder(orderNumber);
      const res = await api.orders.cancel(orderNumber);
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pesanan.');
    } finally {
      setIsCancellingOrder(null);
    }
  };

  const handleChangeDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !newDomainInput.trim()) return;

    try {
      setIsChangingDomain(true);
      setChangeDomainError(null);
      setChangeDomainSuccess(null);

      const res = await api.services.changeDomain(selectedService.service_code, {
        domain: newDomainInput.trim()
      });

      if (res.success) {
        setChangeDomainSuccess(res.message);
        setSelectedService(prev => prev ? { ...prev, domain: res.domain } : null);
        await loadData();
        setTimeout(() => {
          setIsChangeDomainModalOpen(false);
          setChangeDomainSuccess(null);
        }, 1800);
      }
    } catch (err: any) {
      setChangeDomainError(err.message || 'Gagal mengubah domain layanan.');
    } finally {
      setIsChangingDomain(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);

    try {
      const payload: any = {
        name: profileName,
        phone: profilePhone
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.auth.updateProfile(payload);
      if (res.success) {
        updateUser(res.user);
        setProfileMsg({ type: 'success', text: 'Profil Anda berhasil diperbarui.' });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResendPortalVerification = async () => {
    if (!user?.email) return;
    setIsResendingVerification(true);
    try {
      const res = await api.auth.resendVerification(user.email);
      alert(res.message || 'Tautan verifikasi baru berhasil dikirim ke email Anda.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (authLoading || (loading && services.length === 0 && orders.length === 0)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500">Membuka Customer Portal 1sLabs...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (user && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between py-4 px-4 sm:px-8 font-sans">
        <Header />
        <main className="max-w-[700px] w-full mx-auto my-16">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Akses Ditolak: Portal Khusus Pelanggan
              </h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Portal hosting pelanggan khusus diperuntukkan bagi akun <strong>Customer</strong> untuk mengelola domain, file, dan database secara mandiri. Sebagai Administrator, silakan gunakan panel pengawasan terpusat di Dashboard Admin.
              </p>
            </div>
            <div className="pt-2 flex justify-center space-x-3">
              <Link
                to="/admin"
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Dashboard Admin</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <PortalSidebar
          currentTab={activeTabParam}
          onSelectTab={(tab) => {
            setSearchParams({ tab });
            setMobileSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          counts={{
            domains: domains.length,
            services: services.length,
            nodeApps: nodeApps.length,
            invoices: invoices.length,
            orders: orders.length,
            freePlanClaimed: !!freePlanStatus?.alreadyClaimed
          }}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Top Header */}
        <PortalHeader
          currentTab={activeTabParam}
          onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onRefreshData={handleGlobalRefresh}
          isRefreshing={isRefreshing}
          userName={user?.name}
          userEmail={user?.email}
        />

        {/* View Surface */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Unverified Email Warning Banner */}
          {user && !user.email_verified && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Alamat Email Belum Terverifikasi
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                    Tautan aktivasi akun telah dikirimkan ke <strong>{user?.email}</strong>. Selesaikan verifikasi email untuk membuka akses penuh pemesanan paket hosting baru dan pembayaran.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendPortalVerification}
                disabled={isResendingVerification}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition-all whitespace-nowrap self-start sm:self-center disabled:opacity-50 cursor-pointer"
              >
                {isResendingVerification ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirimkan...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Kirim Ulang Email Verifikasi</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Breadcrumb Back Link when managing a service */}
          {activeTabParam === 'detail' && selectedService && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setSearchParams({ tab: 'services' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition cursor-pointer"
              >
                <span>&larr; Kembali ke Daftar Cloud Hosting</span>
              </button>
            </div>
          )}

        {/* TAB: OVERVIEW */}
        {activeTabParam === 'overview' && (
          <OverviewTab
            services={services}
            domains={domains}
            nodeApps={nodeApps}
            freePlanStatus={freePlanStatus}
            onNavigateToTab={(tab, param) => {
              if (param) setSearchParams({ tab, service: param });
              else setSearchParams({ tab });
            }}
          />
        )}

        {/* TAB: FREE PLAN */}
        {activeTabParam === 'freeplan' && (
          <FreePlanTab
            onNavigateToHosting={(code) => {
              if (code) setSearchParams({ tab: 'detail', service: code });
              else setSearchParams({ tab: 'services' });
            }}
            onNavigateToDomains={() => setSearchParams({ tab: 'domains' })}
            onNavigateToNodeJs={() => setSearchParams({ tab: 'nodejs' })}
          />
        )}

        {/* TAB: MY DOMAINS */}
        {activeTabParam === 'domains' && (
          <DomainsTab
            onNavigateToHosting={(code) => {
              if (code) setSearchParams({ tab: 'detail', service: code });
              else setSearchParams({ tab: 'services' });
            }}
            onNavigateToFreePlan={() => setSearchParams({ tab: 'freeplan' })}
          />
        )}

        {/* TAB: NODE.JS APPLICATIONS */}
        {activeTabParam === 'nodejs' && (
          <NodeJsAppsTab
            onNavigateToDomains={() => setSearchParams({ tab: 'domains' })}
          />
        )}

        {/* TAB: MY SERVICES */}
        {activeTabParam === 'services' && (
          <div>
            {services.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Belum Ada Layanan Hosting</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-6">
                  Anda belum memiliki layanan hosting aktif di 1sLabs. Mulai online-kan website bisnis Anda sekarang.
                </p>
                <Link
                  to="/#hosting"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs"
                >
                  <span>Lihat Katalog Hosting</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((srv) => (
                  <motion.div
                    key={srv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div>
                      {/* Status & Plan Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {srv.plan_name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          srv.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          srv.status === 'awaiting_domain' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          srv.status === 'pending_provisioning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {srv.status === 'active' ? 'Aktif' :
                           srv.status === 'awaiting_domain' ? 'Menunggu Domain' :
                           srv.status === 'pending_provisioning' ? 'Konfigurasi Server' :
                           srv.status === 'expired' ? 'Kedaluwarsa' : srv.status}
                        </span>
                      </div>

                      {/* Domain / Title (Clickable Web Link) */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          {srv.domain ? (
                            <a
                              href={`https://${srv.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center space-x-1.5 truncate group"
                              title={`Buka situs https://${srv.domain}`}
                            >
                              <span className="truncate">{srv.domain}</span>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </a>
                          ) : (
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                              Domain Belum Dikonfigurasi
                            </h3>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {srv.service_code}
                        </p>
                      </div>

                      {/* Specs snippet with Verified SSL */}
                      <div className="space-y-1.5 py-3 border-y border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between items-center">
                          <span>Sertifikat SSL:</span>
                          <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <span>Tersertifikasi (HTTPS)</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>NVMe Storage:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {srv.storage_gb === -1 ? 'Unlimited' : `${srv.storage_gb} GB`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Masa Aktif:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {srv.status === 'active' ? `Sisa ${srv.days_remaining} hari` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Berakhir Pada:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {srv.expires_at ? srv.expires_at.slice(0, 10) : 'Belum aktif'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-2">
                      {srv.status === 'awaiting_domain' ? (
                        <Link
                          to={`/services/${srv.service_code}/setup-domain`}
                          className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-all"
                        >
                          <span>Atur Domain Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : srv.days_remaining <= 30 && srv.status === 'active' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRenewal(srv)}
                            disabled={renewingId === srv.id}
                            className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${renewingId === srv.id ? 'animate-spin' : ''}`} />
                            <span>Perpanjang</span>
                          </button>
                          <button
                            onClick={() => selectService(srv.service_code)}
                            className="flex-1 py-2.5 px-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer"
                          >
                            <span>Kelola Hosting</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => selectService(srv.service_code)}
                          className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <span>Kelola Hosting</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICE DETAIL & HOSTINGER-LIKE CONTROL PANEL */}
        {activeTabParam === 'detail' && selectedService && (
          <div className="space-y-8">
            {/* Control Panel Hero Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex-shrink-0">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedService.domain ? (
                        <a
                          href={`https://${selectedService.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center space-x-2 text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title={`Buka situs https://${selectedService.domain}`}
                        >
                          <span>{selectedService.domain}</span>
                          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </a>
                      ) : (
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                          Domain Menunggu Konfigurasi
                        </h2>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedService.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        selectedService.status === 'awaiting_domain' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {selectedService.status === 'active' ? 'Aktif' :
                         selectedService.status === 'awaiting_domain' ? 'Menunggu Domain' :
                         selectedService.status === 'pending_provisioning' ? 'Sedang Dikonfigurasi' : selectedService.status}
                      </span>

                      {/* SSL Certified Badge */}
                      {selectedService.domain && (
                        <a
                          href={`https://www.sslshopper.com/ssl-checker.html#hostname=${selectedService.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Sertifikat SSL Let's Encrypt Wildcard Aktif - Klik untuk Cek"
                          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs"
                        >
                          <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>SSL Certified (HTTPS)</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paket: <strong className="text-gray-900 dark:text-white">{selectedService.plan_name}</strong> • Kode: {selectedService.service_code}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewDomainInput(selectedService.domain || '');
                      setChangeDomainError(null);
                      setChangeDomainSuccess(null);
                      setIsChangeDomainModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Ganti / Edit Domain</span>
                  </button>

                  <button
                    onClick={() => handleRenewal(selectedService)}
                    disabled={renewingId === selectedService.id}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${renewingId === selectedService.id ? 'animate-spin' : ''}`} />
                    <span>Perpanjang 1 Tahun</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Subscription & Days Remaining Section */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-gray-500 block mb-1">Status Keamanan SSL:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-flex items-center space-x-1 font-bold text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Tersertifikasi (HTTPS)</span>
                    </span>
                  </div>
                  {selectedService.domain && (
                    <a
                      href={`https://www.sslshopper.com/ssl-checker.html#hostname=${selectedService.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center space-x-0.5 mt-1 font-semibold"
                    >
                      <span>Cek di SSLShopper</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Masa Aktif Layanan:</span>
                  <div className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{selectedService.status === 'active' ? `Sisa ${selectedService.days_remaining} Hari` : 'Menunggu Konfigurasi'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Tanggal Mulai Aktif:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedService.activated_at ? selectedService.activated_at.slice(0, 10) : '-'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Tanggal Kedaluwarsa:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedService.expires_at ? selectedService.expires_at.slice(0, 10) : '-'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">IP Server Hosting:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {selectedService.server_ip || '103.119.237.132'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hostinger-Style Service Management Navigation Bar */}
            <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setServiceSubTab('overview')}
                className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${
                  serviceSubTab === 'overview'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Ringkasan & Resource</span>
              </button>

              <button
                onClick={() => setServiceSubTab('analytics')}
                className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${
                  serviceSubTab === 'analytics'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span>Analitik Web</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-full font-bold">Baru</span>
              </button>

              <button
                onClick={() => setServiceSubTab('files')}
                className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${
                  serviceSubTab === 'files'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500" />
                <span>File Manager</span>
              </button>

              <button
                onClick={() => setServiceSubTab('ftp')}
                className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${
                  serviceSubTab === 'ftp'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Server className="w-4 h-4 text-blue-500" />
                <span>Akun FTP / FTPS</span>
              </button>

              <button
                onClick={() => setServiceSubTab('databases')}
                className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${
                  serviceSubTab === 'databases'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Database MySQL</span>
              </button>
            </div>

            {/* TAB CONTENT: ANALYTICS */}
            {serviceSubTab === 'analytics' && (
              <AnalyticsTab
                serviceCode={selectedService.service_code}
                domain={selectedService.domain}
              />
            )}

            {/* TAB CONTENT: FILE MANAGER */}
            {serviceSubTab === 'files' && (
              <FileManagerTab
                serviceCode={selectedService.service_code}
                storageGb={selectedService.storage_gb}
                domain={selectedService.domain}
              />
            )}

            {/* TAB CONTENT: FTP MANAGEMENT */}
            {serviceSubTab === 'ftp' && (
              <FtpManagementTab
                serviceCode={selectedService.service_code}
                serverIp={selectedService.server_ip || '103.119.237.132'}
                domain={selectedService.domain}
              />
            )}

            {/* TAB CONTENT: DATABASE MANAGEMENT */}
            {serviceSubTab === 'databases' && (
              <DatabaseManagementTab
                serviceCode={selectedService.service_code}
                databasesCount={selectedService.databases_count}
                serverIp={selectedService.server_ip || '103.119.237.132'}
              />
            )}

            {/* TAB CONTENT: OVERVIEW */}
            {serviceSubTab === 'overview' && (
              <div className="space-y-6">
                {/* INFORMASI SERVER, DNS & NAMESERVER RESMI (MIGRASI FIX) */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs flex-shrink-0 mt-0.5">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                            Informasi Server & DNS
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Server: Merapi (Aktif)
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-1">
                          Konfigurasi Nameserver & IP Server Hosting
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Gunakan Nameserver resmi berikut untuk menghubungkan domain Anda ke hosting berkinerja tinggi 1sLabs.
                        </p>
                      </div>
                    </div>

                    {selectedService.domain && (
                      <a
                        href={`https://${selectedService.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 inline-flex items-center space-x-1.5 self-start transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span>Kunjungi Situs Web</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}
                  </div>

                  {/* Tabel Domain, IP & Nameserver Fix */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-2.5">Domain</th>
                          <th className="px-4 py-2.5">IP Server (A Record)</th>
                          <th className="px-4 py-2.5">Nameserver 1</th>
                          <th className="px-4 py-2.5">Nameserver 2</th>
                          <th className="px-4 py-2.5">Status SSL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-[11px]">
                        <tr>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white font-sans">
                            {selectedService.domain ? (
                              <a
                                href={`https://${selectedService.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1"
                              >
                                <span>{selectedService.domain}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              'domain-anda.com'
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                            <span className="inline-flex items-center space-x-2">
                              <span>103.119.237.132</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('103.119.237.132');
                                  setCopiedIp(true);
                                  setTimeout(() => setCopiedIp(false), 2000);
                                }}
                                className="px-2 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-sans transition-colors inline-flex items-center space-x-1"
                              >
                                {copiedIp ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                <span>{copiedIp ? 'Disalin' : 'Salin'}</span>
                              </button>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center space-x-2">
                              <span>ns1.domainmurah.net</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('ns1.domainmurah.net');
                                  setCopiedNs(1);
                                  setTimeout(() => setCopiedNs(null), 2000);
                                }}
                                className="px-2 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded font-sans transition-colors inline-flex items-center space-x-1"
                              >
                                {copiedNs === 1 ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                <span>{copiedNs === 1 ? 'Disalin' : 'Salin'}</span>
                              </button>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            <span className="inline-flex items-center space-x-2">
                              <span>ns2.domainmurah.net</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('ns2.domainmurah.net');
                                  setCopiedNs(2);
                                  setTimeout(() => setCopiedNs(null), 2000);
                                }}
                                className="px-2 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded font-sans transition-colors inline-flex items-center space-x-1"
                              >
                                {copiedNs === 2 ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                <span>{copiedNs === 2 ? 'Disalin' : 'Salin'}</span>
                              </button>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <a
                              href={selectedService.domain ? `https://www.sslshopper.com/ssl-checker.html#hostname=${selectedService.domain}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:opacity-80 transition-opacity"
                              title="Cek sertifikat SSL valid di SSLShopper"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Tersertifikasi</span>
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Quick Highlight Cards: SSL & Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Card 1: SSL Certification Details */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Status Sertifikat SSL (HTTPS)</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-semibold">
                          Aktif & Valid
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Situs Anda telah diamankan dengan enkripsi <strong>Let's Encrypt Wildcard SSL 256-bit</strong>. Semua trafik HTTP otomatis dialihkan ke HTTPS yang aman.
                      </p>
                      <div className="pt-1 flex items-center space-x-3 text-xs">
                        {selectedService.domain && (
                          <a
                            href={`https://www.sslshopper.com/ssl-checker.html#hostname=${selectedService.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold inline-flex items-center space-x-1"
                          >
                            <span>Cek Sertifikat di SSLShopper</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        {selectedService.domain && (
                          <a
                            href={`https://${selectedService.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center space-x-1"
                          >
                            <span>Kunjungi https://{selectedService.domain}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Web Analytics Quick Access */}
                    <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>Statistik Kunjungan & Klik Web</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 rounded font-semibold">
                          Real-time
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Pantau jumlah kunjungan halaman, pengunjung unik, dan klik tombol pada website Anda secara akurat dan real-time.
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setServiceSubTab('analytics')}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <span>Buka Tab Analitik & Tutorial Embed</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. VISUAL RESOURCE USAGE & DONUT CHARTS (Hostinger & cPanel Inspired) */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xs">
                  {/* Header & Status Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                            <span>Statistik & Pemantauan Resource Hosting (Real-time)</span>
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Alokasi kapasitas hardware dan kuota layanan aktif untuk domain{' '}
                            <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                              {selectedService.domain || selectedService.service_code}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Server Normal & Optimal</span>
                      </span>

                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>LiteSpeed Enterprise</span>
                      </span>
                    </div>
                  </div>

                  {/* 4 Donut / Radial Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Donut 1: Storage NVMe */}
                    <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between text-left space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all duration-200 shadow-xs">
                      {/* Top Label & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <HardDrive className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Kapasitas SSD NVMe</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          Gen4 Fast
                        </span>
                      </div>

                      {/* SVG Donut Chart */}
                      <div className="flex flex-col items-center justify-center my-1">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <defs>
                              <linearGradient id="storageDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="currentColor"
                              strokeWidth="10"
                              className="text-gray-200/70 dark:text-gray-700/40"
                              fill="transparent"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="url(#storageDonutGrad)"
                              strokeWidth="10"
                              strokeDasharray={2 * Math.PI * 46}
                              strokeDashoffset={(2 * Math.PI * 46) * (1 - 0.12)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono leading-none tracking-tight">12%</span>
                            <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">Terpakai</span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Details & Breakdown Bar */}
                      <div className="space-y-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                        {/* Segmented Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 rounded-l-full" style={{ width: '8%' }} title="File Website (8%)"></div>
                          <div className="h-full bg-violet-400" style={{ width: '3%' }} title="Database MySQL (3%)"></div>
                          <div className="h-full bg-sky-400" style={{ width: '1%' }} title="Sistem & Cache (1%)"></div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Total Kuota:</span>
                          <strong className="text-gray-900 dark:text-white font-mono font-bold">
                            {selectedService.storage_gb === -1 ? 'Unlimited' : `${selectedService.storage_gb} GB NVMe`}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Sisa Tersedia:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            {selectedService.storage_gb === -1 ? 'Bebas' : `${((selectedService.storage_gb || 10) * 0.88).toFixed(1)} GB`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Donut 2: Database MySQL */}
                    <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between text-left space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all duration-200 shadow-xs">
                      {/* Top Label & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <Database className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Database MySQL</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          MariaDB 10.11
                        </span>
                      </div>

                      {/* SVG Donut Chart */}
                      <div className="flex flex-col items-center justify-center my-1">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <defs>
                              <linearGradient id="dbDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="currentColor"
                              strokeWidth="10"
                              className="text-gray-200/70 dark:text-gray-700/40"
                              fill="transparent"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="url(#dbDonutGrad)"
                              strokeWidth="10"
                              strokeDasharray={2 * Math.PI * 46}
                              strokeDashoffset={(2 * Math.PI * 46) * (1 - 0.2)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono leading-none tracking-tight">
                              {selectedService.databases_count === -1 ? '1 / ∞' : `1 / ${selectedService.databases_count || 5}`}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">DB Aktif</span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Details & Breakdown Bar */}
                      <div className="space-y-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                        {/* Segmented Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: selectedService.databases_count === -1 ? '20%' : `${Math.round((1 / (selectedService.databases_count || 5)) * 100)}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Batas Kuota:</span>
                          <strong className="text-gray-900 dark:text-white font-mono font-bold">
                            {selectedService.databases_count === -1 ? 'Unlimited' : `${selectedService.databases_count} Database`}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Akses phpMyAdmin:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terhubung</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Donut 3: Bandwidth Bulanan */}
                    <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between text-left space-y-4 hover:border-sky-300 dark:hover:border-sky-800/60 transition-all duration-200 shadow-xs">
                      {/* Top Label & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                            <Wifi className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Bandwidth Jaringan</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100/80 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                          1 Gbps Port
                        </span>
                      </div>

                      {/* SVG Donut Chart */}
                      <div className="flex flex-col items-center justify-center my-1">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <defs>
                              <linearGradient id="bwDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0ea5e9" />
                                <stop offset="100%" stopColor="#2563eb" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="currentColor"
                              strokeWidth="10"
                              className="text-gray-200/70 dark:text-gray-700/40"
                              fill="transparent"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="url(#bwDonutGrad)"
                              strokeWidth="10"
                              strokeDasharray={2 * Math.PI * 46}
                              strokeDashoffset={(2 * Math.PI * 46) * (1 - 0.999)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none tracking-tight">1 Gbps</span>
                            <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">Unmetered</span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Details & Breakdown Bar */}
                      <div className="space-y-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                        {/* Segmented Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Kuota Bulanan:</span>
                          <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">
                            Unmetered
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Proteksi Anti-DDoS:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Layer 3/4/7 Aktif</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut 4: Uptime & Kinerja Server */}
                    <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 flex flex-col justify-between text-left space-y-4 hover:border-purple-300 dark:hover:border-purple-800/60 transition-all duration-200 shadow-xs">
                      {/* Top Label & Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Kinerja & Uptime</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100/80 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                          SLA 99.9%
                        </span>
                      </div>

                      {/* SVG Donut Chart */}
                      <div className="flex flex-col items-center justify-center my-1">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <defs>
                              <linearGradient id="uptimeDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="currentColor"
                              strokeWidth="10"
                              className="text-gray-200/70 dark:text-gray-700/40"
                              fill="transparent"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="46"
                              stroke="url(#uptimeDonutGrad)"
                              strokeWidth="10"
                              strokeDasharray={2 * Math.PI * 46}
                              strokeDashoffset={(2 * Math.PI * 46) * (1 - 0.999)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono leading-none tracking-tight">99.9%</span>
                            <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 mt-1 uppercase tracking-wider">Uptime</span>
                          </div>
                        </div>
                      </div>

                      {/* Usage Details & Breakdown Bar */}
                      <div className="space-y-2 pt-1 border-t border-gray-200/60 dark:border-gray-800">
                        {/* Segmented Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: '99%' }}></div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Sertifikat SSL:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>HTTPS Aktif</span>
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Isolasi Resource:</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">CloudLinux CageFS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server Infrastructure Quick Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block uppercase tracking-wider font-semibold">Node Cluster</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-medium mt-0.5 block truncate">
                        Cyber 1 DC Jakarta (ID-JKT01)
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block uppercase tracking-wider font-semibold">Web Server & HTTP</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-medium mt-0.5 block truncate">
                        LiteSpeed + HTTP/3 (QUIC)
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block uppercase tracking-wider font-semibold">Runtime PHP</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-medium mt-0.5 block truncate">
                        PHP 8.2 (lsphp82 Native)
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-400 text-[10px] block uppercase tracking-wider font-semibold">Snapshot Backup</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-medium mt-0.5 block truncate">
                        Daily Cloud Auto-Backup
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. DUA KOLOM: KONFIGURASI DNS & PINTASAN NATIVE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Technical Server Config (Updated Nameservers with Copy Buttons) */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center space-x-2">
                        <Terminal className="w-4 h-4 text-emerald-600" />
                        <span>Konfigurasi DNS & Informasi Server</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Gunakan data Nameserver resmi di bawah ini untuk menghubungkan domain dari registrar Anda:
                      </p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-500 font-medium">Nameserver 1:</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('ns1.domainmurah.net');
                              setCopiedNs(1);
                              setTimeout(() => setCopiedNs(null), 2000);
                            }}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:opacity-80 flex items-center space-x-1"
                          >
                            {copiedNs === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedNs === 1 ? 'Tersalin' : 'Salin NS 1'}</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200/80 dark:border-gray-700">
                          <code className="text-gray-900 dark:text-white font-mono font-bold text-xs">
                            ns1.domainmurah.net
                          </code>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md font-semibold">
                            Primary
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-500 font-medium">Nameserver 2:</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('ns2.domainmurah.net');
                              setCopiedNs(2);
                              setTimeout(() => setCopiedNs(null), 2000);
                            }}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:opacity-80 flex items-center space-x-1"
                          >
                            {copiedNs === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedNs === 2 ? 'Tersalin' : 'Salin NS 2'}</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200/80 dark:border-gray-700">
                          <code className="text-gray-900 dark:text-white font-mono font-bold text-xs">
                            ns2.domainmurah.net
                          </code>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-md font-semibold">
                            Secondary
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-500 font-medium">Alamat IP Server (A-Record):</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedService.server_ip || '103.119.237.132');
                              setCopiedIp(true);
                              setTimeout(() => setCopiedIp(false), 2000);
                            }}
                            className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center space-x-1"
                          >
                            {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedIp ? 'Tersalin' : 'Salin IP'}</span>
                          </button>
                        </div>
                        <div className="px-3.5 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 font-mono font-semibold text-gray-900 dark:text-white">
                          {selectedService.server_ip || '103.119.237.132'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                          <span className="text-gray-400 block text-[10px] uppercase">Web Server Engine</span>
                          <strong className="text-gray-900 dark:text-white block mt-0.5">LiteSpeed Enterprise</strong>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                          <span className="text-gray-400 block text-[10px] uppercase">PHP & Node.js</span>
                          <strong className="text-gray-900 dark:text-white block mt-0.5">PHP 8.2 & Node 22</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 100% White-Label Native Tools (NO external cPanel links, NO email bisnis) */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <span>Alat Kelola & Pintasan Hosting</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Akses mandiri ke seluruh modul hosting website Anda langsung dari antarmuka portal 1sLabs:
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setServiceSubTab('files')}
                        className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs flex items-center justify-between transition-all border border-gray-100 dark:border-gray-700/60 group shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                              1sLabs File Manager
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Upload, edit script kode, buat file/folder, dan kompresi arsip
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setServiceSubTab('databases')}
                        className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs flex items-center justify-between transition-all border border-gray-100 dark:border-gray-700/60 group shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                              1sLabs Database MySQL & Tabel
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Database explorer, eksekusi query SQL, buat tabel, impor & ekspor .sql
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setServiceSubTab('databases')}
                        className="w-full p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-2xl text-xs flex items-center justify-between transition-all border border-emerald-200/80 dark:border-emerald-800/60 group shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                                Cloud Backup & Restore Harian
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                                Otomatis 02:00 WIB
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                              Snapshot otomatis 14 hari, buat snapshot manual, dan restore 1-klik
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setServiceSubTab('ftp')}
                        className="w-full p-3.5 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs flex items-center justify-between transition-all border border-gray-100 dark:border-gray-700/60 group shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                              Akun FTP / FTPS
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Kelola kredensial akun FileZilla, Cyberduck, dan WinSCP
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Service Timeline History */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Riwayat & Aktivitas Layanan Hosting</span>
              </h3>

              {selectedService.events && selectedService.events.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                  {selectedService.events.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-black dark:bg-white border-2 border-white dark:border-gray-900"></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">{evt.title}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {evt.created_at ? evt.created_at.slice(0, 16) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Belum ada riwayat tercatat untuk layanan ini.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTabParam === 'orders' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Riwayat Seluruh Pemesanan
            </h2>

            {orders.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">Belum ada riwayat pesanan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nomor Pesanan</th>
                      <th className="pb-3 font-semibold">Paket Hosting</th>
                      <th className="pb-3 font-semibold">Total Biaya</th>
                      <th className="pb-3 font-semibold">Tanggal</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((o) => {
                      const isUnpaid = o.status === 'unpaid';
                      const createdTime = new Date(o.created_at).getTime();
                      const elapsedMs = Date.now() - createdTime;
                      const total24hMs = 24 * 60 * 60 * 1000;
                      const remainingMs = Math.max(0, total24hMs - elapsedMs);
                      const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
                      const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                      const isExpired = isUnpaid && remainingMs <= 0;

                      return (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <td className="py-4 font-mono font-semibold">{o.order_number}</td>
                          <td className="py-4">
                            <span className="font-medium text-gray-900 dark:text-white">{o.plan_name_snapshot}</span>
                            <span className="text-gray-400 text-[11px] block">{o.period_snapshot}</span>
                          </td>
                          <td className="py-4 font-semibold text-gray-900 dark:text-white">{formatPrice(o.price_snapshot)}</td>
                          <td className="py-4 text-gray-500">
                            <div>{o.created_at ? o.created_at.slice(0, 10) : '-'}</div>
                            {isUnpaid && !isExpired && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                                Batas: {hoursLeft}j {minutesLeft}m lagi
                              </span>
                            )}
                            {(isExpired || o.status === 'expired') && (
                              <span className="text-[10px] text-rose-500 font-mono block mt-0.5">
                                Melewati batas 24 jam
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              o.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                              o.status === 'pending_verification' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                              o.status === 'cancelled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                              isExpired || o.status === 'expired' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {o.status === 'paid' ? 'Lunas' :
                               o.status === 'pending_verification' ? 'Verifikasi Admin' :
                               o.status === 'cancelled' ? 'Dibatalkan' :
                               isExpired || o.status === 'expired' ? 'Kedaluwarsa' :
                               'Belum Dibayar'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isUnpaid && !isExpired ? (
                                <>
                                  <Link
                                    to={`/payment/${o.order_number}`}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-semibold text-xs transition-all shadow-xs"
                                  >
                                    <span>Bayar QRIS</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                  <button
                                    onClick={() => handleCancelOrder(o.order_number)}
                                    disabled={isCancellingOrder === o.order_number}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                    title="Batalkan pesanan ini"
                                  >
                                    <span>{isCancellingOrder === o.order_number ? 'Membatalkan...' : 'Batalkan'}</span>
                                  </button>
                                </>
                              ) : (
                                <Link
                                  to={`/payment/${o.order_number}`}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                                >
                                  <span>Rincian</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVOICES */}
        {activeTabParam === 'invoices' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Daftar Invoice Resmi
            </h2>

            {invoices.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">Belum ada invoice yang diterbitkan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nomor Invoice</th>
                      <th className="pb-3 font-semibold">Layanan</th>
                      <th className="pb-3 font-semibold">Nominal</th>
                      <th className="pb-3 font-semibold">Tanggal Terbit</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4 font-mono font-semibold">{inv.invoice_number}</td>
                        <td className="py-4">{inv.plan_name}</td>
                        <td className="py-4 font-semibold">{formatPrice(inv.amount)}</td>
                        <td className="py-4 text-gray-500">{inv.created_at ? inv.created_at.slice(0, 10) : '-'}</td>
                        <td className="py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            LUNAS
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            to={`/invoice/${inv.invoice_number}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium transition-all"
                          >
                            <span>Lihat & Cetak Invoice</span>
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE & SECURITY */}
        {activeTabParam === 'profile' && (
          <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Pengaturan Profil Akun
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Kelola informasi kontak dan pembaruan kata sandi akun pelanggan Anda.
            </p>

            {profileMsg && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center space-x-2 text-xs font-semibold ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Alamat Email (Akun Utama)
                  </label>
                  {user?.email_verified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Terverifikasi</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 inline-flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Belum Terverifikasi</span>
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-xl text-xs sm:text-sm text-gray-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Email akun terikat secara permanen dengan invoice dan sertifikat kepemilikan.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Nomor WhatsApp (Wajib Aktif)
                </label>
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="081234567890 atau +628123456789"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Nomor WhatsApp digunakan untuk konfirmasi status pembayaran transfer/QRIS dan pemberitahuan darurat hosting.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  Ganti Kata Sandi (Opsional)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kata Sandi Saat Ini</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kata Sandi Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: GANTI / EDIT DOMAIN */}
        <AnimatePresence>
          {isChangeDomainModalOpen && selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Ganti / Edit Domain Utama
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {selectedService.service_code}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChangeDomainModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {changeDomainError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{changeDomainError}</span>
                  </div>
                )}

                {changeDomainSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start space-x-2 text-emerald-700 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{changeDomainSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangeDomain} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-500 font-medium mb-1">
                      Domain Saat Ini:
                    </label>
                    <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-mono text-gray-800 dark:text-gray-200">
                      {selectedService.domain || '(Belum dikonfigurasi)'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                      Nama Domain Baru:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="contoh: domainbaru.com"
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      💡 <strong>Otomatisasi Server:</strong> Saat domain diganti, lokasi file website Anda di File Manager akan otomatis diarahkan ke <code className="text-gray-800 dark:text-gray-200 font-mono font-bold">/public_html/{newDomainInput || 'domainbaru.com'}</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    Pastikan domain baru telah diarahkan ke Nameserver: <strong>ns1.domainmurah.net</strong> dan <strong>ns2.domainmurah.net</strong> atau A Record ke IP <strong>{selectedService.server_ip || '103.119.237.132'}</strong>.
                  </div>

                  <div className="pt-2 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsChangeDomainModalOpen(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingDomain || !newDomainInput.trim()}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {isChangingDomain ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
