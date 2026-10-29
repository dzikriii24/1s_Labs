import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Server,
  CreditCard,
  Users,
  Settings,
  Layers,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  LogOut,
  Edit,
  X,
  HardDrive,
  Database,
  Copy,
  Check,
  Terminal,
  Folder,
  ShieldCheck,
  Activity,
  Cpu,
  Cloud,
  Receipt,
  FileText,
  Calendar,
  Globe,
  Home,
  Info
} from 'lucide-react';
import { api, AdminStats, HostingService, HostingPlan } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'payment_history' | 'orders' | 'services' | 'plans' | 'customers'>('payments');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyAdminText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Payments for Verification (pending)
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedVerificationPayment, setSelectedVerificationPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Customer Payment History (all paid payments)
  const [paidPayments, setPaidPayments] = useState<any[]>([]);
  const [paymentHistorySearch, setPaymentHistorySearch] = useState('');
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<any | null>(null);

  // Orders History (ONLY paid orders)
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');

  // Services State (Read-only observation)
  const [services, setServices] = useState<HostingService[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [viewingServiceDetail, setViewingServiceDetail] = useState<HostingService | null>(null);

  // Plans State
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanTarget, setEditPlanTarget] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [editPlanPeriod, setEditPlanPeriod] = useState('/ tahun');
  const [editPlanDescription, setEditPlanDescription] = useState('');
  const [editPlanStorage, setEditPlanStorage] = useState('');
  const [editPlanDatabases, setEditPlanDatabases] = useState('');
  const [editPlanBandwidth, setEditPlanBandwidth] = useState('');
  const [editPlanSsl, setEditPlanSsl] = useState('');
  const [editPlanBackup, setEditPlanBackup] = useState('');
  const [editPlanEmail, setEditPlanEmail] = useState('');
  const [editPlanFeatures, setEditPlanFeatures] = useState('');
  const [editPlanIsRecommended, setEditPlanIsRecommended] = useState(false);
  const [editPlanIsActive, setEditPlanIsActive] = useState(true);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Customers State
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login?redirect=/admin');
      } else if (!isAdmin) {
        navigate('/portal');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsRes,
        pendingPaymentsRes,
        allPaidPaymentsRes,
        servicesRes,
        plansRes,
        customersRes,
        ordersRes
      ] = await Promise.all([
        api.admin.getStats(),
        api.admin.getPayments({ status: 'pending_verification' }),
        api.admin.getPayments({ status: 'paid' }),
        api.admin.getServices({ search: serviceSearch }),
        api.admin.getPlans(),
        api.admin.getCustomers(),
        api.orders.getAll({ status: 'paid' })
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (pendingPaymentsRes.success) setPendingPayments(pendingPaymentsRes.payments);
      if (allPaidPaymentsRes.success) setPaidPayments(allPaidPaymentsRes.payments);
      if (servicesRes.success) setServices(servicesRes.services);
      if (plansRes.success) setPlans(plansRes.plans);
      if (customersRes.success) setCustomers(customersRes.customers);
      if (ordersRes.success) setPaidOrders(ordersRes.orders || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const handleVerifyPayment = async (action: 'approve' | 'reject') => {
    if (!selectedVerificationPayment) return;
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Alasan penolakan pembayaran wajib diisi.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.admin.verifyPayment(selectedVerificationPayment.id, {
        action,
        reason: rejectReason.trim()
      });

      if (res.success) {
        alert(res.message);
        setSelectedVerificationPayment(null);
        setRejectReason('');
        await loadAllAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses tindakan verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenEditPlan = (p: HostingPlan) => {
    setSelectedPlan(p);
    setEditPlanName(p.name || '');
    setEditPlanTarget(p.target || '');
    setEditPlanPrice(p.price !== undefined ? p.price.toString() : '');
    setEditPlanPeriod(p.period || '/ tahun');
    setEditPlanDescription(p.description || '');
    setEditPlanStorage(p.storage_gb !== undefined ? p.storage_gb.toString() : '30');
    setEditPlanDatabases(p.databases_count !== undefined ? p.databases_count.toString() : '10');
    setEditPlanBandwidth(p.bandwidth || 'Unmetered Monthly Bandwidth');
    setEditPlanSsl(p.ssl_type || 'Free SSL Certificate (Auto-SSL)');
    setEditPlanBackup(p.backup_frequency || 'Weekly Cloud');
    setEditPlanEmail(p.email_accounts || 'Akun Email Domain Mandiri');
    setEditPlanFeatures(Array.isArray(p.features) ? p.features.join('\n') : '');
    setEditPlanIsRecommended(Boolean(p.is_recommended));
    setEditPlanIsActive(Boolean(p.is_active));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSavingPlan(true);
    try {
      const parsedFeatures = editPlanFeatures
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const res = await api.admin.updatePlan(selectedPlan.id, {
        ...selectedPlan,
        name: editPlanName.trim(),
        target: editPlanTarget.trim(),
        price: editPlanPrice.trim(),
        period: editPlanPeriod.trim(),
        description: editPlanDescription.trim(),
        storage_gb: parseInt(editPlanStorage, 10),
        databases_count: parseInt(editPlanDatabases, 10),
        bandwidth: editPlanBandwidth.trim(),
        ssl_type: editPlanSsl.trim(),
        backup_frequency: editPlanBackup.trim(),
        email_accounts: editPlanEmail.trim(),
        features: parsedFeatures,
        is_recommended: editPlanIsRecommended ? 1 : 0,
        is_active: editPlanIsActive ? 1 : 0
      });

      if (res.success) {
        alert(res.message || 'Paket hosting berhasil diperbarui.');
        setSelectedPlan(null);
        await loadAllAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data paket hosting.');
    } finally {
      setIsSavingPlan(false);
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

  // Filter lists
  const filteredPaidPayments = paidPayments.filter(p => {
    if (!paymentHistorySearch) return true;
    const term = paymentHistorySearch.toLowerCase();
    return (
      p.order_number?.toLowerCase().includes(term) ||
      p.payment_number?.toLowerCase().includes(term) ||
      p.customer_name?.toLowerCase().includes(term) ||
      p.customer_email?.toLowerCase().includes(term)
    );
  });

  const filteredPaidOrders = paidOrders.filter(o => {
    if (!orderSearch) return true;
    const term = orderSearch.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(term) ||
      o.customer_name?.toLowerCase().includes(term) ||
      o.customer_email?.toLowerCase().includes(term) ||
      o.plan_name?.toLowerCase().includes(term)
    );
  });

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const term = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  });

  if (authLoading || (loading && !stats)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500">Memuat Panel Administrasi 1sLabs...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[1300px] w-full mx-auto my-8">
        {/* Admin Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Otoritas Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Pusat Manajemen Hosting & Verifikasi
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Verifikasi bukti transfer QRIS, audit riwayat pembayaran pelanggan, serta monitoring infrastruktur server secara terpusat.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllAdminData}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
              title="Perbarui Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 shadow-xs flex items-center space-x-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Website Utama</span>
            </Link>
          </div>
        </div>

        {/* Real Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
              <span>Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats?.pendingPayments || 0}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">Bukti transfer QRIS</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
              <span>Pendapatan Terverifikasi</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">
              {stats ? formatPrice(stats.totalRevenue) : 'Rp 0'}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats?.paidPayments || 0} pembayaran lunas
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
              <span>Pesanan Lunas</span>
              <Receipt className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {paidOrders.length}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Transaksi berhasil
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
              <span>Layanan Terpantau</span>
              <Server className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats?.activeServices || 0}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {stats?.totalCustomers || 0} akun pelanggan
            </span>
          </div>
        </div>

        {/* Analytics & System Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Donut Chart Distribusi Status Layanan */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-emerald-500" />
                <span>Distribusi Layanan Hosting</span>
              </span>
              <span className="text-[11px] font-mono text-gray-500">{services.length} Total</span>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) * (1 - Math.min((stats?.activeServices || 0) / Math.max(services.length, 1), 1))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
                    {stats?.activeServices || 0}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Aktif</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Aktif: <strong className="text-gray-900 dark:text-white">{stats?.activeServices || 0}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Menunggu Domain: <strong className="text-gray-900 dark:text-white">{stats?.awaitingServices || 0}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Setup Awal: <strong className="text-gray-900 dark:text-white">{services.filter(s => s.status === 'pending_provisioning').length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Donut Chart Status Pembayaran */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span>Status Pembayaran Customer</span>
              </span>
              <span className="text-[11px] font-mono text-gray-500">{(stats?.paidPayments || 0) + (stats?.pendingPayments || 0)} Total</span>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-800" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#6366f1"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(2 * Math.PI * 40) * (1 - Math.min((stats?.paidPayments || 0) / Math.max((stats?.paidPayments || 0) + (stats?.pendingPayments || 0), 1), 1))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">
                    {stats?.paidPayments || 0}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Lunas</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Lunas: <strong className="text-gray-900 dark:text-white">{stats?.paidPayments || 0}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Verifikasi: <strong className="text-gray-900 dark:text-white">{stats?.pendingPayments || 0}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">Pesanan Lunas: <strong className="text-gray-900 dark:text-white">{paidOrders.length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Server Infrastructure & Cloud Backup Status */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Infrastruktur & Server Backend</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                Online
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 font-sans">Node.js / Passenger:</span>
                <span className="font-semibold text-gray-900 dark:text-white">v22.12.0 LTS</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 font-sans">Database Engine:</span>
                <span className="font-semibold text-gray-900 dark:text-white">MariaDB 10.11 LTS</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800/60">
                <span className="text-gray-500 font-sans">Backup Cron Harian:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">02:00 WIB (0 2 * * *)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-sans">Nameserver Resmi:</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">ns1/ns2.serverphp.my.id</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="flex overflow-x-auto space-x-2 pb-2 mb-8 border-b border-gray-200 dark:border-gray-800 no-scrollbar">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'payments'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Verifikasi QRIS ({pendingPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payment_history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'payment_history'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Riwayat Pembayaran Customer ({paidPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'orders'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Riwayat Pemesanan (Lunas) ({paidOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'services'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Pemantauan Layanan Hosting ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'plans'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog Paket ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === 'customers'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pelanggan ({customers.length})</span>
          </button>
        </div>

        {/* TAB 1: PAYMENTS VERIFICATION (PENDING) */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Verifikasi Pembayaran QRIS Masuk
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bukti transfer yang menunggu persetujuan administrator untuk aktivasi layanan hosting.
                </p>
              </div>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Tidak Ada Pembayaran Menunggu Verifikasi
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Semua bukti transfer QRIS pelanggan telah berhasil diverifikasi atau belum diunggah.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nomor Order / Pay</th>
                      <th className="pb-3 font-semibold">Pelanggan</th>
                      <th className="pb-3 font-semibold">Paket & Tipe</th>
                      <th className="pb-3 font-semibold">Nominal</th>
                      <th className="pb-3 font-semibold">Bukti Transfer</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pendingPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4">
                          <span className="font-mono font-semibold block">{p.order_number}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{p.payment_number}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-semibold block">{p.customer_name}</span>
                          <span className="text-[11px] text-gray-500">{p.customer_email}</span>
                          {p.customer_phone && (
                            <span className="text-[10px] text-gray-400 block font-mono">WA: {p.customer_phone}</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="font-medium">{p.plan_name_snapshot}</span>
                          <span className="text-[10px] text-gray-500 block">
                            {p.order_type === 'renewal' ? 'Perpanjangan' : 'Pemesanan Baru'}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-gray-900 dark:text-white">
                          {formatPrice(p.amount)}
                        </td>
                        <td className="py-4">
                          {p.proof_image ? (
                            <a
                              href={p.proof_image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              <span>Lihat Bukti</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Belum diunggah</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            PERLU VERIFIKASI
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedVerificationPayment(p)}
                            className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            Tinjau & Verifikasi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RIWAYAT PEMBAYARAN CUSTOMER */}
        {activeTab === 'payment_history' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Riwayat Pembayaran Customer (Lunas & Terverifikasi)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar transaksi pembayaran resmi pelanggan yang telah diverifikasi lunas oleh sistem atau admin.
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paymentHistorySearch}
                  onChange={(e) => setPaymentHistorySearch(e.target.value)}
                  placeholder="Cari order, pelanggan, email..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {filteredPaidPayments.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">
                Belum ada data pembayaran lunas yang sesuai kriteria pencarian.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nomor Transaksi / Order</th>
                      <th className="pb-3 font-semibold">Pelanggan</th>
                      <th className="pb-3 font-semibold">Paket & Periode</th>
                      <th className="pb-3 font-semibold">Nominal Lunas</th>
                      <th className="pb-3 font-semibold">Metode / Bukti</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Rincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPaidPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4">
                          <span className="font-mono font-bold text-gray-900 dark:text-white block">{p.order_number}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{p.payment_number}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-semibold block">{p.customer_name}</span>
                          <span className="text-[11px] text-gray-500">{p.customer_email}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-medium text-gray-900 dark:text-white">{p.plan_name_snapshot}</span>
                          <span className="text-[10px] text-gray-400 block">{p.period_snapshot || '1 Bulan'}</span>
                        </td>
                        <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(p.amount)}
                        </td>
                        <td className="py-4">
                          <span className="block font-medium">{p.payment_method || 'QRIS'}</span>
                          {p.proof_image ? (
                            <a
                              href={p.proof_image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-0.5 mt-0.5"
                            >
                              <span>Bukti TF</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            LUNAS
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedPaymentDetail(p)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors flex items-center space-x-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Rincian Pembayaran</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RIWAYAT PEMESANAN (HANYA YANG SUDAH LUNAS) */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Riwayat Pemesanan Layanan (Hanya Lunas)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daftar seluruh pesanan paket hosting yang telah berstatus lunas dan aktif.
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari nomor pesanan, nama customer..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {filteredPaidOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">
                Belum ada pesanan berstatus lunas yang ditemukan.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nomor Pesanan</th>
                      <th className="pb-3 font-semibold">Pelanggan</th>
                      <th className="pb-3 font-semibold">Paket Hosting</th>
                      <th className="pb-3 font-semibold">Periode</th>
                      <th className="pb-3 font-semibold">Total Tagihan</th>
                      <th className="pb-3 font-semibold">Tanggal Pemesanan</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Faktur / Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPaidOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4">
                          <span className="font-mono font-bold text-gray-900 dark:text-white block">
                            {o.order_number}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {o.type === 'renewal' ? 'Perpanjangan Layanan' : 'Pemesanan Hosting Baru'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-semibold block">{o.customer_name}</span>
                          <span className="text-[11px] text-gray-500">{o.customer_email}</span>
                          {o.customer_phone && (
                            <span className="text-[10px] text-gray-400 block font-mono">WA: {o.customer_phone}</span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="font-semibold text-gray-900 dark:text-white">{o.plan_name}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {o.period || o.period_snapshot || '1 Bulan'}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(o.total_amount)}
                        </td>
                        <td className="py-4 text-gray-500">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                        <td className="py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            LUNAS
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            to={`/invoice/${o.order_number}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span>Lihat Faktur</span>
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

        {/* TAB 4: PEMANTAUAN LAYANAN HOSTING (READ-ONLY MONITORING) */}
        {activeTab === 'services' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Pemantauan Layanan Hosting Pelanggan
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitoring status server, domain terpasang, serta lokasi folder public_html server secara real-time.
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl text-[11px] text-blue-800 dark:text-blue-300 flex items-center space-x-2 max-w-md">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  Konfigurasi server dan penggantian domain dikelola secara mandiri oleh pelanggan dari portal pelanggan.
                </span>
              </div>
            </div>

            {services.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">Belum ada layanan hosting aktif.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Kode Layanan</th>
                      <th className="pb-3 font-semibold">Domain</th>
                      <th className="pb-3 font-semibold">Direktori Server cPanel</th>
                      <th className="pb-3 font-semibold">Pelanggan</th>
                      <th className="pb-3 font-semibold">Paket</th>
                      <th className="pb-3 font-semibold">Masa Aktif</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4 font-mono font-semibold">{s.service_code}</td>
                        <td className="py-4">
                          <span className="font-semibold block">{s.domain || '(Belum diset pelanggan)'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">IP: {s.server_ip}</span>
                        </td>
                        <td className="py-4">
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-gray-400 font-sans uppercase">cPanel:</span>
                              <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                                /public_html/{s.domain || s.service_code}
                              </strong>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-gray-400 font-sans uppercase">VPS:</span>
                              <span className="text-gray-500 text-[10px] truncate max-w-[170px]" title={`/home/u1zh8984/public_html/${s.domain || s.service_code}`}>
                                /home/u1zh8984/public_html/{s.domain || s.service_code}
                              </span>
                              <button
                                onClick={() => copyAdminText(`/home/u1zh8984/public_html/${s.domain || s.service_code}`, `path-${s.id}`)}
                                className="p-0.5 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                title="Salin Path Server"
                              >
                                {copiedText === `path-${s.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span>{s.customer_name}</span>
                          <span className="text-[11px] text-gray-500 block">{s.customer_email}</span>
                        </td>
                        <td className="py-4 font-medium">{s.plan_name}</td>
                        <td className="py-4">
                          <span>{s.expires_at ? s.expires_at.slice(0, 10) : '-'}</span>
                          <span className="text-[10px] text-gray-400 block">Sisa {s.days_remaining} hari</span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            s.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            s.status === 'awaiting_domain' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                            s.status === 'pending_provisioning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {s.status === 'active' ? 'AKTIF' :
                             s.status === 'awaiting_domain' ? 'MENUNGGU DOMAIN' :
                             s.status === 'pending_provisioning' ? 'PROVISIONING' : s.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setViewingServiceDetail(s)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail Layanan</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">
              Katalog & Konfigurasi Paket Hosting
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div key={p.id} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-gray-500 font-mono">{p.slug}</span>
                      <div className="flex items-center space-x-1.5">
                        {p.is_recommended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            Recommended
                          </span>
                        ) : null}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                          {p.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{p.name}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">{p.target}</p>
                    <p className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                      {formatPrice(p.price)} <span className="text-xs text-gray-500 font-normal">{p.period}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 py-3 border-t border-gray-100 dark:border-gray-800">
                      <div>Storage: <strong>{p.storage_gb === -1 ? 'Unlimited' : `${p.storage_gb} GB NVMe`}</strong></div>
                      <div>Databases: <strong>{p.databases_count === -1 ? 'Unlimited' : `${p.databases_count} DB`}</strong></div>
                      <div>Fasilitas: <strong>{p.features?.length || 0} item fitur</strong></div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="w-full py-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Kelola & Ubah Data Paket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMERS LIST */}
        {activeTab === 'customers' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Daftar Seluruh Pelanggan Terdaftar
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Informasi akun pelanggan, statistik total order, layanan aktif, dan akumulasi belanja.
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama, email, whatsapp..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-gray-500 py-12 text-center">Belum ada pelanggan terdaftar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nama Pelanggan</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Nomor WhatsApp</th>
                      <th className="pb-3 font-semibold">Total Pesanan</th>
                      <th className="pb-3 font-semibold">Layanan Dimiliki</th>
                      <th className="pb-3 font-semibold">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-4 font-semibold text-gray-900 dark:text-white">{c.name}</td>
                        <td className="py-4 text-gray-600 dark:text-gray-300">{c.email}</td>
                        <td className="py-4 font-mono">{c.phone || '-'}</td>
                        <td className="py-4">{c.orders_count} pesanan</td>
                        <td className="py-4 font-semibold">{c.services_count} layanan</td>
                        <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(c.total_spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: RINCIAN PEMBAYARAN CUSTOMER (DETAIL VIEW-ONLY UNTUK ADMIN) */}
        <AnimatePresence>
          {selectedPaymentDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Rincian Pembayaran Customer
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {selectedPaymentDetail.order_number} / {selectedPaymentDetail.payment_number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPaymentDetail(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs mb-6">
                  {/* Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        Status Pembayaran: LUNAS & TERVERIFIKASI
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                      ID: #{selectedPaymentDetail.id}
                    </span>
                  </div>

                  {/* Customer & Order Information Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Nama Pelanggan:</span>
                      <strong className="text-gray-900 dark:text-white font-medium">{selectedPaymentDetail.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Email Pelanggan:</span>
                      <strong className="text-gray-900 dark:text-white font-medium">{selectedPaymentDetail.customer_email}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Nomor WhatsApp:</span>
                      <strong className="font-mono">{selectedPaymentDetail.customer_phone || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Paket Hosting Dipesan:</span>
                      <strong className="text-gray-900 dark:text-white">{selectedPaymentDetail.plan_name_snapshot}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Metode Pembayaran:</span>
                      <strong className="text-gray-900 dark:text-white">{selectedPaymentDetail.payment_method || 'QRIS Dinamis'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Total Lunas Dibayar:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        {formatPrice(selectedPaymentDetail.amount)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Bank / e-Wallet Pengirim:</span>
                      <strong>{selectedPaymentDetail.sender_bank_or_wallet || 'QRIS / Bank Transfer'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Nama Rekening Pengirim:</span>
                      <strong>{selectedPaymentDetail.sender_account_name || selectedPaymentDetail.customer_name}</strong>
                    </div>
                  </div>

                  {/* Verification timestamp and admin note */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl space-y-1 text-[11px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Waktu Transaksi Dibuat:</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200">
                        {selectedPaymentDetail.created_at ? new Date(selectedPaymentDetail.created_at).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Verifikasi Selesai:</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200">
                        {selectedPaymentDetail.verified_at ? new Date(selectedPaymentDetail.verified_at).toLocaleString('id-ID') : 'Otomatis / Terverifikasi'}
                      </span>
                    </div>
                    {selectedPaymentDetail.verified_by_name && (
                      <div className="flex justify-between">
                        <span>Diverifikasi Oleh:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedPaymentDetail.verified_by_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Proof Image Preview */}
                  <div>
                    <span className="font-semibold block mb-2 text-gray-700 dark:text-gray-300">
                      Tangkapan Layar Bukti Transfer:
                    </span>
                    {selectedPaymentDetail.proof_image ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-2 bg-gray-50 dark:bg-gray-800 text-center">
                        <img
                          src={selectedPaymentDetail.proof_image}
                          alt="Bukti Transfer"
                          className="max-h-60 mx-auto rounded-xl object-contain"
                        />
                        <a
                          href={selectedPaymentDetail.proof_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                        >
                          <span>Buka Ukuran Penuh</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center rounded-2xl text-gray-500">
                        Tidak ada file bukti transfer terlampir (diverifikasi via mutasi otomatis).
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    to={`/invoice/${selectedPaymentDetail.order_number}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Lihat Faktur Resmi (PPN 11%)</span>
                  </Link>

                  <button
                    onClick={() => setSelectedPaymentDetail(null)}
                    className="py-2 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-xs"
                  >
                    Tutup Rincian
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 2: VERIFIKASI PEMBAYARAN PENDING (ACTION APPROVE/REJECT) */}
        <AnimatePresence>
          {selectedVerificationPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Verifikasi Pembayaran ({selectedVerificationPayment.order_number})
                  </h3>
                  <button
                    onClick={() => setSelectedVerificationPayment(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs mb-6">
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <div>
                      <span className="text-gray-500 block">Nama Customer:</span>
                      <strong className="text-gray-900 dark:text-white">{selectedVerificationPayment.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Email Customer:</span>
                      <strong className="text-gray-900 dark:text-white">{selectedVerificationPayment.customer_email}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Paket Dipesan:</span>
                      <strong>{selectedVerificationPayment.plan_name_snapshot}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Jumlah Tagihan:</span>
                      <strong className="text-emerald-600 text-sm">{formatPrice(selectedVerificationPayment.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Bank / e-Wallet Pengirim:</span>
                      <strong>{selectedVerificationPayment.sender_bank_or_wallet || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Nama Rekening Pengirim:</span>
                      <strong>{selectedVerificationPayment.sender_account_name || '-'}</strong>
                    </div>
                  </div>

                  {/* Proof Image Preview */}
                  <div>
                    <span className="font-semibold block mb-2 text-gray-700 dark:text-gray-300">
                      Tangkapan Layar Bukti Transfer:
                    </span>
                    {selectedVerificationPayment.proof_image ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-2 bg-gray-50 dark:bg-gray-800 text-center">
                        <img
                          src={selectedVerificationPayment.proof_image}
                          alt="Bukti Transfer"
                          className="max-h-64 mx-auto rounded-xl object-contain"
                        />
                        <a
                          href={selectedVerificationPayment.proof_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline"
                        >
                          <span>Buka Ukuran Penuh</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center rounded-2xl text-gray-500">
                        Tidak ada file bukti transfer terlampir.
                      </div>
                    )}
                  </div>

                  {/* Rejection reason input */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Alasan Penolakan (Hanya diisi bila menolak):
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Contoh: Nominal transfer kurang, atau mutasi bank belum masuk."
                      className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleVerifyPayment('reject')}
                    disabled={isVerifying}
                    className="flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold"
                  >
                    Tolak Pembayaran
                  </button>

                  <button
                    onClick={() => handleVerifyPayment('approve')}
                    disabled={isVerifying}
                    className="flex-1 py-2.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-1"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span>Setujui Pembayaran (Lunas)</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: DETAIL LAYANAN HOSTING (READ-ONLY INSPECTION UNTUK ADMIN) */}
        <AnimatePresence>
          {viewingServiceDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Detail Layanan Hosting
                      </h3>
                      <p className="text-[11px] font-mono text-gray-500">
                        {viewingServiceDetail.service_code}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewingServiceDetail(null)} className="p-1 rounded-lg text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Status Banner */}
                  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Status Layanan:</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                        {viewingServiceDetail.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      Sisa {viewingServiceDetail.days_remaining} Hari
                    </span>
                  </div>

                  {/* Customer and Domain Specs */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Pemilik Akun:</span>
                      <strong className="text-gray-900 dark:text-white">{viewingServiceDetail.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Email:</span>
                      <strong className="text-gray-900 dark:text-white">{viewingServiceDetail.customer_email}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Domain Utama:</span>
                      <strong className="text-blue-600 dark:text-blue-400 font-mono">
                        {viewingServiceDetail.domain || '(Belum diset oleh pelanggan)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Paket Hosting:</span>
                      <strong className="text-gray-900 dark:text-white">{viewingServiceDetail.plan_name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Server IP:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">{viewingServiceDetail.server_ip}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Akun cPanel:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {viewingServiceDetail.cpanel_username || 'u1zh8984'}
                      </span>
                    </div>
                  </div>

                  {/* Physical Directory & Server Paths for Admin Audit */}
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100 dark:border-emerald-900/60">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        <span>Lokasi Direktori Fisik di Server / cPanel</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                        u1zh8984
                      </span>
                    </div>

                    <div className="space-y-2 font-mono text-[11px] pt-1">
                      <div>
                        <span className="text-gray-500 block text-[10px] font-sans">Document Root cPanel:</span>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-900">
                          <strong className="text-emerald-700 dark:text-emerald-300">
                            /public_html/{viewingServiceDetail.domain || viewingServiceDetail.service_code}
                          </strong>
                          <button
                            type="button"
                            onClick={() => copyAdminText(`/public_html/${viewingServiceDetail.domain || viewingServiceDetail.service_code}`, 'modal-cpanel-path')}
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white ml-2"
                            title="Salin Path cPanel"
                          >
                            {copiedText === 'modal-cpanel-path' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 block text-[10px] font-sans">Absolute Path di Linux VPS:</span>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-900">
                          <span className="text-gray-700 dark:text-gray-300 truncate text-[10px]">
                            /home/u1zh8984/public_html/{viewingServiceDetail.domain || viewingServiceDetail.service_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyAdminText(`/home/u1zh8984/public_html/${viewingServiceDetail.domain || viewingServiceDetail.service_code}`, 'modal-server-path')}
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white ml-2 flex-shrink-0"
                            title="Salin Path Server"
                          >
                            {copiedText === 'modal-server-path' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clarification Callout regarding User Responsibility */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Aturan Konfigurasi Server:</strong> Konfigurasi awal domain dan perubahan domain merupakan hak prerogatif pelanggan dari portal pelanggan (1 kali setup awal & fitur Ganti Domain). Admin hanya memantau kesehatan server.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingServiceDetail(null)}
                    className="py-2 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 4: EDIT PLAN */}
        <AnimatePresence>
          {selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
                  <div className="flex items-center space-x-2.5">
                    <Server className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Kelola &amp; Ubah Paket: {selectedPlan.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono">
                        Slug: {selectedPlan.slug} • ID: #{selectedPlan.id}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPlan(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                  {/* Row 1: Plan Name & Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Nama Paket Hosting
                      </label>
                      <input
                        type="text"
                        required
                        value={editPlanName}
                        onChange={(e) => setEditPlanName(e.target.value)}
                        placeholder="Contoh: Starter Hosting"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Target Segmen / Sub-Judul
                      </label>
                      <input
                        type="text"
                        required
                        value={editPlanTarget}
                        onChange={(e) => setEditPlanTarget(e.target.value)}
                        placeholder="Contoh: Ideal for Landing Pages & Profiles"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 2: Price & Period */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Harga Dasar (IDR / Rupiah Sebelum PPN)
                      </label>
                      <input
                        type="number"
                        required
                        value={editPlanPrice}
                        onChange={(e) => setEditPlanPrice(e.target.value)}
                        placeholder="Contoh: 850000"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Preview: {formatPrice(editPlanPrice || 0)}
                      </span>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Periode Penagihan
                      </label>
                      <input
                        type="text"
                        required
                        value={editPlanPeriod}
                        onChange={(e) => setEditPlanPeriod(e.target.value)}
                        placeholder="Contoh: / tahun"
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Contoh: &quot;/ tahun&quot; atau &quot;/ bulan&quot;
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Deskripsi Ringkasan Paket
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editPlanDescription}
                      onChange={(e) => setEditPlanDescription(e.target.value)}
                      placeholder="Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional."
                      className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs leading-relaxed"
                    />
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Deskripsi ini tampil pada kartu katalog beranda dan halaman spesifikasi teknis.
                    </span>
                  </div>

                  {/* Row 4: Storage & Database Hardware Quotas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Penyimpanan NVMe SSD (GB, isi -1 jika Unlimited)
                      </label>
                      <input
                        type="number"
                        required
                        value={editPlanStorage}
                        onChange={(e) => setEditPlanStorage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Jumlah Database MySQL (isi -1 jika Unlimited)
                      </label>
                      <input
                        type="number"
                        required
                        value={editPlanDatabases}
                        onChange={(e) => setEditPlanDatabases(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 5: Bandwidth & SSL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Bandwidth Bulanan
                      </label>
                      <input
                        type="text"
                        value={editPlanBandwidth}
                        onChange={(e) => setEditPlanBandwidth(e.target.value)}
                        placeholder="Contoh: Unmetered Monthly Bandwidth"
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Sertifikat SSL
                      </label>
                      <input
                        type="text"
                        value={editPlanSsl}
                        onChange={(e) => setEditPlanSsl(e.target.value)}
                        placeholder="Contoh: Free SSL Certificate (Auto-SSL)"
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 6: Backup & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Pencadangan (Backup)
                      </label>
                      <input
                        type="text"
                        value={editPlanBackup}
                        onChange={(e) => setEditPlanBackup(e.target.value)}
                        placeholder="Contoh: Backup Otomatis Mingguan (Weekly Cloud)"
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                        Email Bisnis
                      </label>
                      <input
                        type="text"
                        value={editPlanEmail}
                        onChange={(e) => setEditPlanEmail(e.target.value)}
                        placeholder="Contoh: Akun Email Domain Mandiri"
                        className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 7: Features Checklist (Multi-line) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-gray-700 dark:text-gray-300">
                        Daftar Fasilitas Termasuk (Satu baris per poin fitur):
                      </label>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                        {editPlanFeatures.split('\n').filter(s => s.trim().length > 0).length} Poin Fasilitas
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={editPlanFeatures}
                      onChange={(e) => setEditPlanFeatures(e.target.value)}
                      placeholder={"30 GB High-Speed NVMe SSD Storage\n10 MySQL Databases\nUnmetered Monthly Bandwidth\nFree SSL Certificate (Auto-SSL)\nAkses cPanel & File Manager Mandiri\nBantuan Setup & Deployment Gratis\nDukungan Teknis via WhatsApp Standar\nGaransi Uptime Server 99.9%"}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono leading-relaxed"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                      <strong>Tips:</strong> Tekan Enter untuk membuat poin baru. Setiap baris teks akan otomatis dirender sebagai ikon centang checklist fasilitas di beranda dan halaman rincian.
                    </p>
                  </div>

                  {/* Row 8: Status Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPlanIsRecommended}
                        onChange={(e) => setEditPlanIsRecommended(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white block">Badge Recommended</span>
                        <span className="text-[10px] text-gray-500 block">Tandai sebagai paket paling populer</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPlanIsActive}
                        onChange={(e) => setEditPlanIsActive(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white block">Status Aktif</span>
                        <span className="text-[10px] text-gray-500 block">Tampilkan paket di katalog website</span>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPlan}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold shadow-xs flex items-center justify-center space-x-2"
                    >
                      {isSavingPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan Perubahan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simpan Perubahan Paket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
