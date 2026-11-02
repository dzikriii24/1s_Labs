import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  Filter,
  Plus,
  Upload,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Instagram,
  MessageCircle,
  Star,
  Archive,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sliders,
  X
} from 'lucide-react';
import { api, MarketingCompany, MarketingContact } from '../../../../services/api';
import Swal from 'sweetalert2';
import { notify } from '../../../../lib/notify';
import { CreateBusinessModal } from './CreateBusinessModal';
import { AddContactModal } from './AddContactModal';
import { BulkImportModal } from './BulkImportModal';
import { ProspectDetailModal } from './ProspectDetailModal';

export const IndonesiaBusinessTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'without_contacts' | 'recovery'>('all');

  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedScale, setSelectedScale] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedContactedStatus, setSelectedContactedStatus] = useState<'all' | 'contacted' | 'not_contacted'>('all');
  const [selectedContactFilter, setSelectedContactFilter] = useState<'all' | 'no_contacts' | 'no_email' | 'has_email' | 'has_whatsapp' | 'complete'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCompanyForContact, setSelectedCompanyForContact] = useState<MarketingCompany | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<MarketingCompany | null>(null);

  // Contact Recovery Queue State
  const [recoveryFilter, setRecoveryFilter] = useState<'no_contacts' | 'no_email' | 'no_phone' | 'no_website' | 'partially_enriched'>('no_contacts');
  const [recoveryLimit, setRecoveryLimit] = useState(15);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState<any | null>(null);

  // Quick stats
  const [stats, setStats] = useState<{
    totalSmallBiz: number;
    withContacts: number;
    withoutContacts: number;
    withWhatsapp: number;
    highPotential: number;
    contactedCount: number;
    notContactedCount: number;
  }>({
    totalSmallBiz: 0,
    withContacts: 0,
    withoutContacts: 0,
    withWhatsapp: 0,
    highPotential: 0,
    contactedCount: 0,
    notContactedCount: 0
  });

  const fetchStats = async () => {
    try {
      const res = await api.marketing.getStats();
      if (res && res.success) {
        const data = (res.counts || res.stats || {}) as any;
        setStats({
          totalSmallBiz: data.total_small_business || data.total_indonesia || data.total_prospects || 0,
          withContacts: data.with_contacts_indonesia || data.with_contacts || Math.max(0, (data.total_prospects || 0) - (data.without_contacts || 0)),
          withoutContacts: data.without_contacts_indonesia || data.without_contacts || 0,
          withWhatsapp: data.with_whatsapp_indonesia || data.with_whatsapp_count || 0,
          highPotential: data.high_potential_indonesia || data.high_potential_count || 0,
          contactedCount: data.contacted_indonesia || data.contacted_count || 0,
          notContactedCount: data.not_contacted_indonesia || data.not_contacted_count || 0
        });
      }
    } catch (e) {
      console.warn('Failed to load marketing stats:', e);
    }
  };

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        scope: 'indonesia',
        page,
        limit,
        search: search.trim() || undefined,
        business_scale: selectedScale !== 'all' ? selectedScale : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        contacted_status: selectedContactedStatus !== 'all' ? selectedContactedStatus : undefined,
        contact_filter: selectedContactFilter !== 'all' ? selectedContactFilter : undefined,
        is_deleted: '0',
        is_archived: '0'
      };

      if (activeTab === 'new') {
        params.is_new = '1';
      } else if (activeTab === 'without_contacts') {
        params.contact_filter = 'no_contacts';
      }

      const res = await api.marketing.getCompanies(params);
      if (res && res.success) {
        setCompanies(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data bisnis.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [page, activeTab, selectedScale, selectedCategory, selectedCity, selectedContactedStatus, selectedContactFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleTogglePriority = async (company: MarketingCompany) => {
    try {
      await api.marketing.togglePriority(company.id);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_priority: !c.is_priority } : c));
      notify.toast(company.is_priority ? 'Prioritas dinonaktifkan' : 'Ditandai sebagai prioritas', 'info');
    } catch (err: any) {
      notify.error(err.message, 'Gagal Mengubah Status Prioritas');
    }
  };

  const handleToggleArchive = async (company: MarketingCompany) => {
    try {
      await api.marketing.toggleArchive(company.id);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
      notify.toast(company.is_archived ? 'Bisnis dipulihkan dari arsip' : 'Bisnis berhasil diarsipkan', 'success');
    } catch (err: any) {
      notify.error(err.message, 'Gagal Mengarsipkan Bisnis');
    }
  };

  const handleDelete = async (company: MarketingCompany) => {
    const confirmed = await notify.confirm({
      title: 'Hapus Bisnis?',
      text: `Pindahkan bisnis "${company.name}" ke tempat sampah?`,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;
    try {
      await api.marketing.deleteCompany(company.id, false);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
      fetchStats();
      notify.toast(`"${company.name}" dipindahkan ke tempat sampah`, 'success');
    } catch (err: any) {
      notify.error(err.message, 'Gagal Menghapus Bisnis');
    }
  };

  const handleSingleRecover = async (companyId: number, companyName?: string) => {
    const confirmResult = await Swal.fire({
      title: 'Mulai Pemulihan Kontak?',
      html: `Gemini AI akan meriset titik kontak (WhatsApp, Instagram, Website, Email) untuk <b>${companyName || 'bisnis ini'}</b> dari Google Maps, web crawling, dan direktori online.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mulai Riset AI',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#71717a',
      customClass: {
        popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
        title: 'text-lg font-bold text-zinc-900',
        htmlContainer: 'text-xs text-zinc-600',
        confirmButton: 'px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer',
        cancelButton: 'px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer'
      }
    });

    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: 'Sedang Meriset Kontak...',
      html: `
        <div style="font-size: 13px; color: #52525b; margin-top: 6px;">
          Gemini AI sedang mencari kontak untuk <b>${companyName || 'bisnis ini'}</b>...
        </div>
        <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px;">
          Menelusuri WhatsApp, Instagram, Google Maps, dan website resmi.
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans'
      }
    });

    try {
      const res = await api.marketing.recoverCompanyContact(companyId);
      if (res.success) {
        const comp = res.result?.company;
        const newPoints = res.result?.newContactPoints || 0;

        let contactRowsHtml = '';
        if (comp?.whatsapp_number) {
          contactRowsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e4e4e7;">
              <span style="color: #047857; font-weight: 600;">WhatsApp</span>
              <a href="https://wa.me/${comp.whatsapp_number.replace(/[^0-9]/g, '')}" target="_blank" style="color: #065f46; font-family: monospace; font-weight: bold; text-decoration: none;">${comp.whatsapp_number}</a>
            </div>
          `;
        }
        if (comp?.instagram_url) {
          contactRowsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e4e4e7;">
              <span style="color: #be185d; font-weight: 600;">Instagram</span>
              <a href="${comp.instagram_url.startsWith('http') ? comp.instagram_url : 'https://instagram.com/' + comp.instagram_url.replace('@', '')}" target="_blank" style="color: #9d174d; text-decoration: none;">${comp.instagram_url}</a>
            </div>
          `;
        }
        if (comp?.email) {
          contactRowsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e4e4e7;">
              <span style="color: #1d4ed8; font-weight: 600;">Email</span>
              <a href="mailto:${comp.email}" style="color: #1e40af; font-family: monospace; text-decoration: none;">${comp.email}</a>
            </div>
          `;
        }
        if (comp?.phone) {
          contactRowsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e4e4e7;">
              <span style="color: #3f3f46; font-weight: 600;">Telepon</span>
              <span style="font-family: monospace; color: #18181b;">${comp.phone}</span>
            </div>
          `;
        }
        if (comp?.website_url) {
          contactRowsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0;">
              <span style="color: #4338ca; font-weight: 600;">Website</span>
              <a href="${comp.website_url.startsWith('http') ? comp.website_url : 'https://' + comp.website_url}" target="_blank" style="color: #3730a3; text-decoration: none; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${comp.website_url}</a>
            </div>
          `;
        }

        const modalHtml = `
          <div style="text-align: left; font-size: 13px; margin-top: 8px;">
            <p style="color: #3f3f46; margin-bottom: 12px;">
              Pemulihan kontak untuk <b>${comp?.name || companyName || 'bisnis'}</b> berhasil diselesaikan.
            </p>
            ${
              newPoints > 0
                ? `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-bottom: 10px;">
                  <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px;">Titik Kontak Tersimpan</div>
                  ${contactRowsHtml}
                </div>
                <div style="color: #059669; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                  <span>✓</span> <span>Ditemukan <b>${newPoints}</b> titik kontak baru & tersimpan ke database.</span>
                </div>
              `
                : `
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 12px 14px; color: #b45309; font-size: 12px;">
                  ℹ️ Belum ditemukan kontak publik baru tambahan untuk bisnis ini.
                </div>
              `
            }
          </div>
        `;

        await Swal.fire({
          icon: newPoints > 0 ? 'success' : 'info',
          title: newPoints > 0 ? 'Kontak Berhasil Ditemukan!' : 'Pemulihan Selesai',
          html: modalHtml,
          confirmButtonText: 'Tutup',
          confirmButtonColor: '#18181b',
          customClass: {
            popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
            title: 'text-lg font-bold text-zinc-900',
            confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
          }
        });

        fetchCompanies();
        fetchStats();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Pemulihan Kontak Gagal',
        text: err.message || 'Terjadi kesalahan saat memulihkan kontak.',
        confirmButtonColor: '#18181b',
        customClass: {
          popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
          confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
        }
      });
    }
  };

  const handleRunBatchRecovery = async () => {
    const confirmed = await notify.confirm({
      title: 'Jalankan Pemulihan Batch?',
      text: `Mulai riset mendalam kontak untuk ${recoveryLimit} UMKM/bisnis menggunakan Gemini AI?`,
      confirmButtonText: 'Mulai Pemulihan Batch',
      cancelButtonText: 'Batal'
    });
    if (!confirmed) return;

    setIsRecovering(true);
    setRecoveryProgress(null);
    try {
      const res = await api.marketing.runBatchContactRecovery({
        filter: recoveryFilter,
        limit: recoveryLimit
      });
      if (res.success) {
        setRecoveryProgress(res.result);
        fetchCompanies();
        fetchStats();
        Swal.fire({
          icon: 'success',
          title: 'Pemulihan Batch Selesai',
          html: `Berhasil memproses <b>${res.result.processed}</b> bisnis dengan total <b>${res.result.totalNewPoints}</b> titik kontak baru.`,
          confirmButtonColor: '#18181b',
          customClass: {
            popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
            confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
          }
        });
      }
    } catch (err: any) {
      notify.error(err.message, 'Gagal Menjalankan Pemulihan Batch');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-2xl bg-zinc-900 text-white">
            <Store className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900">
                Indonesia Small Business & UMKM
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Prioritas Utama 1sLabs
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fokus penargetan coffee shop, cafe, restoran kecil, bakery, barbershop, salon, laundry, dan UMKM lokal di Bandung, Cimahi, Jabodetabek, dan seluruh Indonesia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Tambah Bisnis</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => {
            setSelectedContactedStatus('all');
            setSelectedContactFilter('all');
          }}
          className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-zinc-400 ${
            selectedContactedStatus === 'all' && selectedContactFilter === 'all' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'
          }`}
        >
          <span className="text-[11px] text-zinc-500 font-medium block">Total Usaha Kecil</span>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
            {stats.totalSmallBiz.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">UMKM & Local Store</span>
        </div>

        <div
          onClick={() => setSelectedContactedStatus(selectedContactedStatus === 'contacted' ? 'all' : 'contacted')}
          className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-emerald-400 ${
            selectedContactedStatus === 'contacted' ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/20' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-700 font-medium block">Sudah Dihubungi</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">
            {stats.contactedCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600/70 mt-0.5 block">Pernah dioutreach</span>
        </div>

        <div
          onClick={() => setSelectedContactedStatus(selectedContactedStatus === 'not_contacted' ? 'all' : 'not_contacted')}
          className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-zinc-400 ${
            selectedContactedStatus === 'not_contacted' ? 'border-zinc-900 ring-1 ring-zinc-900 bg-zinc-100/30' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-600 font-medium block">Belum Dihubungi</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-0.5 block">
            {stats.notContactedCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">Siap outreach baru</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] text-blue-600 font-medium block">Memiliki Kontak</span>
          <span className="text-xl font-bold font-mono text-blue-700 mt-0.5 block">
            {stats.withContacts.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-600/70 mt-0.5 block">WA / Email / Telp</span>
        </div>

        <div
          onClick={() => setSelectedContactFilter(selectedContactFilter === 'no_contacts' ? 'all' : 'no_contacts')}
          className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-amber-400 ${
            selectedContactFilter === 'no_contacts' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/20' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-700 font-medium block">Belum Ada Kontak</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-xl font-bold font-mono text-amber-800 mt-0.5 block">
            {stats.withoutContacts.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600/70 mt-0.5 block">Perlu Recovery</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[11px] text-purple-600 font-medium block">High Potential</span>
          <span className="text-xl font-bold font-mono text-purple-700 mt-0.5 block">
            {stats.highPotential.toLocaleString()}
          </span>
          <span className="text-[10px] text-purple-600/70 mt-0.5 block">Skor Kebutuhan ≥ 70</span>
        </div>
      </div>

      {/* Subtab Navigation Pill Bar */}
      <div className="flex border-b border-zinc-200 bg-white rounded-2xl p-1.5 shadow-xs items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'All Businesses', count: total },
            { id: 'new', label: 'New Discoveries', count: null },
            { id: 'without_contacts', label: 'Without Contacts', count: stats.withoutContacts },
            { id: 'recovery', label: 'Contact Recovery Console', count: null, isAi: true }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {t.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  activeTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={fetchCompanies}
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* VIEW 1: CONTACT RECOVERY CONSOLE */}
      {activeTab === 'recovery' ? (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0 mt-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900">
                  Tahap 2: Contact Enrichment & Recovery Engine
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                  Sistem melakukan riset lanjutan mendalam terhadap bisnis yang sudah tersimpan untuk menemukan website resmi, tautan WhatsApp publik, Instagram, nomor telepon, dan pengelola/owner toko secara sah tanpa mengarang data.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Target Kekurangan Informasi
                </label>
                <select
                  value={recoveryFilter}
                  onChange={e => setRecoveryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="no_contacts">Belum Ada Informasi Kontak Sama Sekali</option>
                  <option value="no_email">Belum Memiliki Email</option>
                  <option value="no_phone">Belum Memiliki Nomor WA / Telepon</option>
                  <option value="no_website">Belum Memiliki Website Resmi</option>
                  <option value="partially_enriched">Partially Enriched (Kontak Belum Lengkap)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Jumlah Bisnis Diambil per Antrean
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 20, 30].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRecoveryLimit(val)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
                        recoveryLimit === val
                          ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRunBatchRecovery}
                  disabled={isRecovering}
                  className="w-full md:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Sedang Meriset & Mencari Kontak...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-400 fill-current" />
                      <span>Jalankan Pemulihan Kontak ({recoveryLimit} Bisnis)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recovery Results Progress Display */}
            {recoveryProgress && (
              <div className="mt-6 pt-5 border-t border-zinc-100 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Laporan Batch Recovery Selesai
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    Total: {recoveryProgress.total_selected} bisnis diproses
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <span className="text-[10px] text-emerald-600 font-mono uppercase block">Kontak Baru Lengkap</span>
                    <span className="text-lg font-bold font-mono text-emerald-900">
                      {recoveryProgress.successfully_enriched}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                    <span className="text-[10px] text-blue-600 font-mono uppercase block">Kontak Parsial Baru</span>
                    <span className="text-lg font-bold font-mono text-blue-900">
                      {recoveryProgress.partially_enriched}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-center">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Tidak Ada Tambahan</span>
                    <span className="text-lg font-bold font-mono text-zinc-700">
                      {recoveryProgress.no_additional_data_found}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <span className="text-[10px] text-amber-600 font-mono uppercase block">Perlu Review Manual</span>
                    <span className="text-lg font-bold font-mono text-amber-900">
                      {recoveryProgress.needs_manual_review}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="border border-zinc-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 text-[11px] font-mono text-zinc-500 uppercase border-b border-zinc-200">
                        <th className="py-2 px-3">Bisnis</th>
                        <th className="py-2 px-3">Titik Kontak Baru</th>
                        <th className="py-2 px-3">Lead Score</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-700">
                      {recoveryProgress.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-zinc-50">
                          <td className="py-2 px-3 font-semibold text-zinc-900">{item.name || `#${item.id}`}</td>
                          <td className="py-2 px-3 font-mono text-emerald-700 font-bold">
                            +{item.newContactPoints || 0} titik kontak
                          </td>
                          <td className="py-2 px-3 font-mono">{item.lead_score || 50}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 text-zinc-700">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW 2: BUSINESS LIST & DIRECTORY */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama bisnis, kota, kategori..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              {/* Filter 1: Status Outreach / Hubungi */}
              <div>
                <select
                  value={selectedContactedStatus}
                  onChange={e => {
                    setSelectedContactedStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer font-medium ${
                    selectedContactedStatus !== 'all'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-white text-zinc-900 border-zinc-200'
                  }`}
                >
                  <option value="all">Semua Status Outreach</option>
                  <option value="contacted">✅ Sudah Dihubungi</option>
                  <option value="not_contacted">⏳ Belum Dihubungi</option>
                </select>
              </div>

              {/* Filter 2: Kelengkapan Kontak */}
              <div>
                <select
                  value={selectedContactFilter}
                  onChange={e => {
                    setSelectedContactFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer font-medium ${
                    selectedContactFilter !== 'all'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                      : 'bg-white text-zinc-900 border-zinc-200'
                  }`}
                >
                  <option value="all">Semua Status Kontak</option>
                  <option value="no_contacts">⚠️ Belum Ada Kontak</option>
                  <option value="no_email">✉️ Belum Memiliki Email</option>
                  <option value="has_email">📬 Memiliki Email</option>
                  <option value="has_whatsapp">💬 Memiliki WhatsApp</option>
                  <option value="complete">⭐ Kontak Lengkap (Email & WA)</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedScale}
                  onChange={e => {
                    setSelectedScale(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="all">Semua Skala Usaha</option>
                  <option value="Micro Business">Micro Business</option>
                  <option value="Small Business">Small Business</option>
                  <option value="Local Business">Local Business</option>
                  <option value="Home Business">Home Business</option>
                  <option value="Online Business">Online Business</option>
                  <option value="Growing Business">Growing Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={e => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Coffee Shop">Coffee Shop & Cafe</option>
                  <option value="Restaurant">Restoran & Kuliner</option>
                  <option value="Bakery & Toko Kue">Bakery & Toko Kue</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Barbershop">Barbershop</option>
                  <option value="Salon Kecantikan">Salon Kecantikan</option>
                  <option value="Toko Pakaian & Fashion">Toko Pakaian & Fashion</option>
                  <option value="Online Shop">Online Shop</option>
                  <option value="Retail">Retail & Grosir</option>
                  <option value="Bengkel & Otomotif">Bengkel</option>
                  <option value="Studio Foto">Studio Foto</option>
                  <option value="UMKM">UMKM Umum</option>
                </select>
              </div>
            </form>

            {/* Active Filters Row & City Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Filter Lokasi:</span>
                <select
                  value={selectedCity}
                  onChange={e => {
                    setSelectedCity(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 cursor-pointer"
                >
                  <option value="all">Semua Kota (Indonesia)</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Cimahi">Cimahi</option>
                  <option value="Kab. Bandung">Kab. Bandung</option>
                  <option value="Bandung Barat">Bandung Barat</option>
                  <option value="Sumedang">Sumedang</option>
                  <option value="Garut">Garut</option>
                  <option value="Cianjur">Cianjur</option>
                  <option value="Sukabumi">Sukabumi</option>
                  <option value="Bogor">Bogor</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Semarang">Semarang</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                </select>

                {(search || selectedScale !== 'all' || selectedCategory !== 'all' || selectedCity !== 'all' || selectedContactedStatus !== 'all' || selectedContactFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedScale('all');
                      setSelectedCategory('all');
                      setSelectedCity('all');
                      setSelectedContactedStatus('all');
                      setSelectedContactFilter('all');
                      setPage(1);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Reset Semua Filter
                  </button>
                )}
              </div>

              <span className="text-[11px] text-zinc-500 font-mono">
                Ditemukan <strong>{total}</strong> bisnis
              </span>
            </div>
          </div>

          {/* Business Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-700" />
                <span>Memuat data usaha kecil...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Store className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-800">Tidak ada bisnis yang cocok dengan kriteria.</p>
                <p className="text-[11px] text-zinc-400">Silakan ubah filter pencarian atau tambahkan bisnis baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/60 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">⭐</th>
                      <th className="py-3 px-4">Nama Usaha & Skala</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Lokasi</th>
                      <th className="py-3 px-4">Kontak Bisnis Langsung</th>
                      <th className="py-3 px-4 text-center">Lead Score</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-700">
                    {companies.map(c => {
                      const hasContact = !!c.email || !!c.phone || !!c.whatsapp_number;
                      const isContacted = (c.contacted_times && c.contacted_times > 0) ||
                        ['Contacted', 'Responded', 'Interested', 'Consultation Scheduled', 'Converted'].includes(c.status) ||
                        !!c.last_contacted_at;

                      return (
                        <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePriority(c)}
                              className="text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
                              title={c.is_priority ? 'Prioritas Tinggi' : 'Tandai Prioritas'}
                            >
                              <Star className={`w-4 h-4 ${c.is_priority ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <button
                                onClick={() => setSelectedCompanyDetail(c)}
                                className="font-bold text-zinc-900 hover:text-blue-600 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{c.name}</span>
                                {c.website_url && (
                                  <a
                                    href={c.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-zinc-400 hover:text-blue-600"
                                    title="Kunjungi Website"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </button>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {c.business_scale || 'Small Business'}
                                </span>

                                {/* Badge Status Outreach (Sudah / Belum Dihubungi) */}
                                {isContacted ? (
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                                    title={c.last_contacted_at ? `Terakhir dihubungi: ${new Date(c.last_contacted_at).toLocaleDateString('id-ID')}` : 'Sudah pernah dihubungi'}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    Sudah Dihubungi{c.contacted_times && c.contacted_times > 1 ? ` (${c.contacted_times}x)` : ''}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                    Belum Dihubungi
                                  </span>
                                )}

                                {c.contacts_count !== undefined && c.contacts_count > 0 && (
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    • {c.contacts_count} kontak
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-[11px] font-medium text-zinc-800 bg-zinc-100/80 px-2.5 py-1 rounded-lg">
                              {c.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-zinc-600 text-[11px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>{c.city || c.province || 'Indonesia'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {!hasContact ? (
                                <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Belum Ada Kontak
                                </span>
                              ) : (
                                <>
                                  {c.whatsapp_number ? (
                                    <a
                                      href={`https://wa.me/${c.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-mono flex items-center gap-1 transition-colors"
                                      title="Chat WhatsApp Langsung"
                                    >
                                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                                      <span>{c.whatsapp_number}</span>
                                    </a>
                                  ) : c.phone ? (
                                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-mono flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-zinc-500" />
                                      <span>{c.phone}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-zinc-400 font-mono px-1.5 py-0.5 bg-zinc-50 rounded border border-zinc-200" title="Belum memiliki nomor WhatsApp / Telepon">
                                      Tanpa WA
                                    </span>
                                  )}

                                  {c.email ? (
                                    <a
                                      href={`mailto:${c.email}`}
                                      className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-mono flex items-center gap-1 transition-colors"
                                      title="Kirim Email"
                                    >
                                      <Mail className="w-3 h-3 text-blue-600" />
                                      <span>{c.email}</span>
                                    </a>
                                  ) : (
                                    <span className="text-[9px] text-zinc-400 font-mono px-1.5 py-0.5 bg-zinc-50 rounded border border-zinc-200" title="Belum memiliki email">
                                      Tanpa Email
                                    </span>
                                  )}

                                  {c.instagram_url && (
                                    <a
                                      href={c.instagram_url.startsWith('http') ? c.instagram_url : `https://instagram.com/${c.instagram_url.replace('@', '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[11px] font-mono flex items-center gap-1 transition-colors"
                                      title="Instagram"
                                    >
                                      <Instagram className="w-3 h-3 text-pink-600" />
                                      <span>{c.instagram_url.startsWith('http') ? '@ig' : c.instagram_url}</span>
                                    </a>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg ${
                                c.lead_score >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : c.lead_score >= 50
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                              title={c.lead_grade || 'Lead score potensi digital'}
                            >
                              {c.lead_score || 50}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!hasContact && (
                                <button
                                  type="button"
                                  onClick={() => handleSingleRecover(c.id, c.name)}
                                  className="p-1.5 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Jalankan Contact Recovery (Gemini)"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedCompanyForContact(c)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="+ Tambah Kontak"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedCompanyDetail(c)}
                                className="px-2 py-1 text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                              >
                                Detail
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleArchive(c)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Arsipkan"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(c)}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="p-4 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <span>Menampilkan {companies.length} dari {total} bisnis</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <span className="font-mono">{page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-100 cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateOpen && (
        <CreateBusinessModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          defaultScope="indonesia"
          defaultCountry="Indonesia"
          onCreated={comp => {
            setCompanies(prev => [comp, ...prev]);
            setTotal(prev => prev + 1);
            fetchStats();
          }}
        />
      )}

      {isImportOpen && (
        <BulkImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          defaultScope="indonesia"
          onImportComplete={() => {
            fetchCompanies();
            fetchStats();
          }}
        />
      )}

      {selectedCompanyForContact && (
        <AddContactModal
          isOpen={!!selectedCompanyForContact}
          companyId={selectedCompanyForContact.id}
          companyName={selectedCompanyForContact.name}
          onClose={() => setSelectedCompanyForContact(null)}
          onContactAdded={() => {
            fetchCompanies();
            fetchStats();
          }}
        />
      )}

      {selectedCompanyDetail && (
        <ProspectDetailModal
          company={selectedCompanyDetail}
          onClose={() => setSelectedCompanyDetail(null)}
          onUpdate={() => {
            fetchCompanies();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

