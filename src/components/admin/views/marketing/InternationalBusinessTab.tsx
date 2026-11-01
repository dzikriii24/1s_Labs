import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Plus,
  Upload,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Star,
  Archive,
  Trash2,
  CheckCircle2,
  Zap,
  MessageCircle,
  Instagram
} from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';
import { CreateBusinessModal } from './CreateBusinessModal';
import { AddContactModal } from './AddContactModal';
import { BulkImportModal } from './BulkImportModal';
import { ProspectDetailModal } from './ProspectDetailModal';

const TARGET_COUNTRIES = [
  { code: 'MY', name: 'Malaysia', currency: 'MYR', lang: 'English / Malay' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', lang: 'English' },
  { code: 'BN', name: 'Brunei Darussalam', currency: 'BND', lang: 'Malay / English' },
  { code: 'AU', name: 'Australia', currency: 'AUD', lang: 'English' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', lang: 'English' },
  { code: 'US', name: 'United States', currency: 'USD', lang: 'English' },
  { code: 'CA', name: 'Canada', currency: 'CAD', lang: 'English' }
];

export const InternationalBusinessTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'recovery'>('all');

  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCompanyForContact, setSelectedCompanyForContact] = useState<MarketingCompany | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<MarketingCompany | null>(null);

  // Recovery
  const [recoveryLimit, setRecoveryLimit] = useState(10);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState<any | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        scope: 'international',
        page,
        limit,
        search: search.trim() || undefined,
        country: selectedCountry !== 'all' ? selectedCountry : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        is_deleted: '0',
        is_archived: '0'
      };

      if (activeTab === 'new') {
        params.is_new = '1';
      }

      const res = await api.marketing.getCompanies(params);
      if (res && res.success) {
        setCompanies(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data international business.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, activeTab, selectedCountry, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleTogglePriority = async (company: MarketingCompany) => {
    try {
      await api.marketing.togglePriority(company.id);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, is_priority: !c.is_priority } : c));
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleToggleArchive = async (company: MarketingCompany) => {
    try {
      await api.marketing.toggleArchive(company.id);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(`Gagal mengarsipkan: ${err.message}`);
    }
  };

  const handleDelete = async (company: MarketingCompany) => {
    if (!confirm(`Hapus bisnis internasional "${company.name}"?`)) return;
    try {
      await api.marketing.deleteCompany(company.id, false);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleRunBatchRecovery = async () => {
    setIsRecovering(true);
    setRecoveryProgress(null);
    try {
      const res = await api.marketing.runBatchContactRecovery({
        filter: 'all',
        limit: recoveryLimit
      });
      if (res.success) {
        setRecoveryProgress(res.result);
        fetchCompanies();
      }
    } catch (err: any) {
      alert(`Gagal menjalankan recovery: ${err.message}`);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-2xl bg-zinc-900 text-white">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900">
                International Small Business
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Global Outreach
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Peluang penawaran website dan aplikasi sederhana untuk coffee shop, bakery, salon, dan toko lokal di Malaysia, Singapore, Australia, UK, US, dan Canada.
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
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Tambah Bisnis Global</span>
          </button>
        </div>
      </div>

      {/* Target Countries Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {TARGET_COUNTRIES.map(tc => {
          const isSelected = selectedCountry.toLowerCase() === tc.name.toLowerCase();
          return (
            <button
              key={tc.code}
              type="button"
              onClick={() => {
                setSelectedCountry(isSelected ? 'all' : tc.name);
                setPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold">{tc.code}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {tc.currency}
                </span>
              </div>
              <div className="text-xs font-semibold mt-1 truncate">{tc.name}</div>
              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {tc.lang.split('/')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtabs Bar */}
      <div className="flex border-b border-zinc-200 bg-white rounded-2xl p-1.5 shadow-xs items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Businesses', count: total },
            { id: 'new', label: 'New Discoveries' },
            { id: 'recovery', label: 'Contact Recovery Console', isAi: true }
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
              {t.isAi && <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
              <span>{t.label}</span>
              {t.count !== undefined && (
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
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {activeTab === 'recovery' ? (
        /* RECOVERY CONSOLE */
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0 mt-1">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                International Contact Intelligence Engine
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl mt-0.5">
                Riset otomatis informasi kontak bisnis luar negeri (Website resmi, email bisnis internasional, nomor telepon internasional, dan profil pengelola usaha).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-600">Ambil per batch:</span>
              {[5, 10, 20].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRecoveryLimit(val)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl border cursor-pointer ${
                    recoveryLimit === val
                      ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunBatchRecovery}
              disabled={isRecovering}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Sedang Meriset Bisnis Internasional...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-blue-400 fill-current" />
                  <span>Jalankan Riset Kontak ({recoveryLimit} Bisnis)</span>
                </>
              )}
            </button>
          </div>

          {recoveryProgress && (
            <div className="pt-4 border-t border-zinc-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Riset selesai! {recoveryProgress.total_selected} bisnis diperiksa.</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari bisnis internasional, kota, negara..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <select
                  value={selectedCountry}
                  onChange={e => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="all">Semua Negara Target</option>
                  {TARGET_COUNTRIES.map(tc => (
                    <option key={tc.code} value={tc.name}>{tc.name} ({tc.currency})</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="all">Semua Kategori Bisnis</option>
                  <option value="Coffee Shop">Coffee Shop</option>
                  <option value="Restaurant">Restaurant & Cafe</option>
                  <option value="Bakery">Bakery & Pastry</option>
                  <option value="Barbershop">Barbershop</option>
                  <option value="Beauty Salon">Beauty Salon</option>
                  <option value="Retail">Retail & Online Store</option>
                </select>
              </div>
            </form>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-700" />
                <span>Memuat bisnis internasional...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Globe className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-800">Belum ada bisnis internasional.</p>
                <p className="text-[11px] text-zinc-400">Jalankan Scraper Discovery atau Tambah Bisnis Global.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/60 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">⭐</th>
                      <th className="py-3 px-4">Bisnis & Negara</th>
                      <th className="py-3 px-4">Kategori & Skala</th>
                      <th className="py-3 px-4">Kontak Internasional</th>
                      <th className="py-3 px-4">Mata Uang & Timezone</th>
                      <th className="py-3 px-4 text-center">Lead Score</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-700">
                    {companies.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePriority(c)}
                            className="text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
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
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </button>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-500">
                              <MapPin className="w-3 h-3 text-zinc-400" />
                              <span>{c.city}, <strong>{c.country}</strong></span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-zinc-800">{c.category}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{c.business_scale || 'Small Business'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-mono flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3 text-blue-600" />
                                <span>{c.email}</span>
                              </a>
                            )}
                            {c.phone && (
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-mono flex items-center gap-1">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <span>{c.phone}</span>
                              </span>
                            )}
                            {c.instagram_url && (
                              <a
                                href={c.instagram_url.startsWith('http') ? c.instagram_url : `https://instagram.com/${c.instagram_url.replace('@', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[11px] font-mono flex items-center gap-1"
                              >
                                <Instagram className="w-3 h-3 text-pink-600" />
                                <span>@ig</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                          <div>{c.currency || 'USD'}</div>
                          <div className="text-[10px] text-zinc-400">{c.timezone || 'UTC'}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800">
                            {c.lead_score || 50}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCompanyForContact(c)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="+ Kontak"
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
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(c)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          defaultScope="international"
          defaultCountry={selectedCountry !== 'all' ? selectedCountry : 'Malaysia'}
          onCreated={comp => {
            setCompanies(prev => [comp, ...prev]);
            setTotal(prev => prev + 1);
          }}
        />
      )}

      {isImportOpen && (
        <BulkImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          defaultScope="international"
          onImportComplete={fetchCompanies}
        />
      )}

      {selectedCompanyForContact && (
        <AddContactModal
          isOpen={!!selectedCompanyForContact}
          companyId={selectedCompanyForContact.id}
          companyName={selectedCompanyForContact.name}
          onClose={() => setSelectedCompanyForContact(null)}
          onContactAdded={fetchCompanies}
        />
      )}

      {selectedCompanyDetail && (
        <ProspectDetailModal
          company={selectedCompanyDetail}
          onClose={() => setSelectedCompanyDetail(null)}
          onUpdate={fetchCompanies}
        />
      )}
    </div>
  );
};

