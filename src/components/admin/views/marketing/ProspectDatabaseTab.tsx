import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Flame,
  Globe,
  Mail,
  Phone,
  Bot,
  Activity,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';
import { ProspectDetailModal } from './ProspectDetailModal';

export const ProspectDatabaseTab: React.FC = () => {
  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [leadGrade, setLeadGrade] = useState('all');
  const [outreachEligibility, setOutreachEligibility] = useState('all');
  const [hasWebsite, setHasWebsite] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Detail Modal state
  const [selectedCompany, setSelectedCompany] = useState<MarketingCompany | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getCompanies({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        lead_grade: leadGrade !== 'all' ? leadGrade : undefined,
        outreach_eligibility: outreachEligibility !== 'all' ? outreachEligibility : undefined,
        has_website: hasWebsite !== 'all' ? hasWebsite : undefined,
        page,
        limit: 20
      });

      if (res.success) {
        setCompanies(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat database prospek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, category, status, leadGrade, outreachEligibility, hasWebsite]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleExportCsv = () => {
    if (companies.length === 0) return;
    const headers = ['ID', 'Nama Usaha', 'Kategori', 'Sektor', 'Provinsi', 'Kota', 'Website', 'Email', 'Telepon', 'Lead Score', 'Status', 'Kelayakan Outreach'];
    const rows = companies.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.category,
      `"${(c.industry || '').replace(/"/g, '""')}"`,
      `"${(c.province || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      c.website_url || '',
      c.email || '',
      c.phone || '',
      c.lead_score,
      c.status,
      c.outreach_eligibility
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `1slabs_prospects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDetail = (company: MarketingCompany) => {
    setSelectedCompany(company);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card & Actions */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Database Prospek Bisnis & UMKM
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Total <strong className="text-zinc-900 font-mono">{totalRecords.toLocaleString()}</strong> entitas bisnis terverifikasi dari direktori publik & perayapan data nasional.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => { setPage(1); fetchCompanies(); }}
            className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama bisnis, email, kota, sektor industri, atau website..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Cari
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Kategori</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="all">Semua Kategori</option>
              <option value="UMKM">UMKM</option>
              <option value="Company">Company / Perusahaan</option>
              <option value="Coffee Shop">Coffee Shop</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Retail">Retail</option>
              <option value="Distributor">Distributor</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Startup">Startup</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Logistics">Logistics</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Other Businesses">Other Businesses</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Status Database</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="all">Semua Status</option>
              <option value="New Discovery">New Discovery</option>
              <option value="Researching">Researching</option>
              <option value="Verified">Verified</option>
              <option value="Qualified">Qualified</option>
              <option value="Outreach Eligible">Outreach Eligible</option>
              <option value="Contacted">Contacted</option>
              <option value="Responded">Responded</option>
              <option value="Interested">Interested</option>
              <option value="Consultation Scheduled">Consultation Scheduled</option>
              <option value="Converted">Converted</option>
              <option value="Do Not Contact">Do Not Contact</option>
            </select>
          </div>

          {/* Lead Grade Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Lead Grade</label>
            <select
              value={leadGrade}
              onChange={e => { setLeadGrade(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="all">Semua Grade</option>
              <option value="A">Grade A (Hot Lead: 80-100)</option>
              <option value="B">Grade B (Warm Lead: 60-79)</option>
              <option value="C">Grade C (Nurture: 40-59)</option>
              <option value="D">Grade D (Cold: 0-39)</option>
            </select>
          </div>

          {/* Outreach Eligibility */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Kelayakan Outreach</label>
            <select
              value={outreachEligibility}
              onChange={e => { setOutreachEligibility(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="all">Semua Kelayakan</option>
              <option value="eligible">Eligible (Bisa di-email)</option>
              <option value="missing_email">Belum Ada Email</option>
              <option value="pending_enrichment">Perlu Enrichment AI</option>
              <option value="opted_out">Opted Out (Unsubscribe)</option>
              <option value="bounced">Bounced / Tidak Valid</option>
            </select>
          </div>

          {/* Website Filter */}
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Ketersediaan Website</label>
            <select
              value={hasWebsite}
              onChange={e => { setHasWebsite(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="all">Semua</option>
              <option value="yes">Punya Website</option>
              <option value="no">Belum Punya Website</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Nama Usaha / Bisnis</th>
                <th className="py-3 px-4">Kategori & Sektor</th>
                <th className="py-3 px-4">Lokasi (Kota / Prov)</th>
                <th className="py-3 px-4">Kontak & Digital</th>
                <th className="py-3 px-4 text-center">Lead Score</th>
                <th className="py-3 px-4">Status & Kelayakan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs text-zinc-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
                    Memuat data prospek bisnis...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    <p className="text-sm font-medium">Tidak ada prospek yang sesuai dengan filter.</p>
                    <p className="text-xs text-zinc-400 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
                  const isEligible = c.outreach_eligibility === 'eligible';
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Name & Type */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 hover:text-emerald-700 transition cursor-pointer" onClick={() => handleOpenDetail(c)}>
                          {c.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          ID: #{c.id} {c.business_type ? `• ${c.business_type}` : ''}
                        </div>
                      </td>

                      {/* Category & Industry */}
                      <td className="py-3 px-4">
                        <div className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium text-[11px] border border-zinc-200">
                          {c.category}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[140px] mt-0.5">
                          {c.industry || 'Umum'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="text-zinc-900 font-medium">{c.city || '-'}</div>
                        <div className="text-[11px] text-zinc-500">{c.province || 'Indonesia'}</div>
                      </td>

                      {/* Contact & Digital */}
                      <td className="py-3 px-4 space-y-0.5">
                        {c.email ? (
                          <div className="flex items-center gap-1.5 text-zinc-700 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[150px]">{c.email}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 italic">Email tidak tersedia</div>
                        )}
                        {c.website_url && (
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                            <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                            <a
                              href={c.website_url.startsWith('http') ? c.website_url : `https://${c.website_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-blue-600 truncate max-w-[150px]"
                            >
                              {c.website_url.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Lead Score */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs">
                          {c.lead_score >= 80 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-rose-500" />
                              {c.lead_score} (A)
                            </span>
                          ) : c.lead_score >= 60 ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {c.lead_score} (B)
                            </span>
                          ) : c.lead_score >= 40 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {c.lead_score} (C)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {c.lead_score} (D)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Eligibility */}
                      <td className="py-3 px-4">
                        <div className="text-zinc-900 font-medium text-[11px]">{c.status}</div>
                        <div className="mt-0.5">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Outreach Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                              {c.outreach_eligibility.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            Menampilkan halaman <strong className="text-zinc-900 font-mono">{page}</strong> dari <strong className="text-zinc-900 font-mono">{totalPages || 1}</strong> ({totalRecords.toLocaleString()} prospek)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="px-2 font-mono text-zinc-700 font-semibold">{page}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prospect Detail Modal */}
      {isDetailOpen && selectedCompany && (
        <ProspectDetailModal
          company={selectedCompany}
          onClose={() => setIsDetailOpen(false)}
          onUpdate={() => {
            fetchCompanies();
          }}
        />
      )}
    </div>
  );
};
