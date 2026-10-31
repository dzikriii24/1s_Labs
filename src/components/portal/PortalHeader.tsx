import React from 'react';
import {
  Menu,
  RefreshCw,
  Plus,
  Server,
  Globe,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PortalHeaderProps {
  currentTab: string;
  onMobileMenuToggle: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  userName?: string;
  userEmail?: string;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentTab,
  onMobileMenuToggle,
  onRefreshData,
  isRefreshing,
  userName,
  userEmail
}) => {
  const getTabMeta = (tab: string) => {
    switch (tab) {
      case 'overview':
        return { title: 'Overview', desc: 'Ringkasan performa hosting, domain, dan aplikasi Node.js Anda.' };
      case 'freeplan':
        return { title: 'Free Plan', desc: 'Program gratis 1 subdomain .1slabs.my.id (1 tahun) & cloud hosting 14 hari.' };
      case 'domains':
        return { title: 'My Domains', desc: 'Kelola domain, subdomain, catatan DNS, dan sertifikat SSL.' };
      case 'services':
        return { title: 'Cloud Hosting', desc: 'Kelola file, database MySQL, akun FTP, dan kuota resource hosting.' };
      case 'detail':
        return { title: 'Hosting Control Panel', desc: 'Kelola file manager, database, FTP, dan analitik server.' };
      case 'nodejs':
        return { title: 'Node.js Applications', desc: 'Deploy RESTful API backend, pantau status live, dan inspect logs.' };
      case 'invoices':
        return { title: 'Tagihan & Invoices', desc: 'Daftar faktur pemesanan dan riwayat tagihan layanan Anda.' };
      case 'orders':
        return { title: 'Riwayat Transaksi', desc: 'Catatan seluruh transaksi pesanan dan aktivasi layanan.' };
      case 'profile':
        return { title: 'Pengaturan Akun', desc: 'Ubah informasi profil pengguna dan perbarui kata sandi akun.' };
      default:
        return { title: 'Customer Portal', desc: 'Panel pengelolaan mandiri infrastruktur hosting 1sLabs.' };
    }
  };

  const meta = getTabMeta(currentTab);

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Tab Breadcrumb */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            <span>Portal</span>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{meta.title}</span>
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white hidden sm:block tracking-tight">
            {meta.title}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live Server Indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">103.119.237.132</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">&bull; Online</span>
        </div>

        {/* Global Refresh Data Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
          title="Segarkan data portal"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-900 dark:text-white' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* New Hosting Order CTA */}
        <Link
          to="/#hosting"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pesan Hosting</span>
        </Link>
      </div>
    </header>
  );
};

