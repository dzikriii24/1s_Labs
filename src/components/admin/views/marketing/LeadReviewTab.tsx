import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Mail,
  Globe,
  Building2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Ban,
  Sparkles,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';
import { notify } from '../../../../lib/notify';
import { ProspectDetailModal } from './ProspectDetailModal';

export const LeadReviewTab: React.FC<{
  onOpenCompanyDetail?: (company: MarketingCompany) => void;
  onNavigateSubtab?: (subtab: string) => void;
}> = ({ onNavigateSubtab }) => {
  const [companies, setCompanies] = useState<MarketingCompany[]>([]);
  const [activeStage, setActiveStage] = useState<'needs_review' | 'contact_ready' | 'qualified' | 'all'>('needs_review');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<MarketingCompany | null>(null);

  const fetchLeadsForReview = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
        is_deleted: '0',
        is_archived: '0'
      };

      if (activeStage === 'needs_review') {
        params.status = 'New Discovery';
      } else if (activeStage === 'contact_ready') {
        params.status = 'Outreach Eligible';
      } else if (activeStage === 'qualified') {
        params.status = 'Qualified';
      }

      const res = await api.marketing.getCompanies(params);
      if (res && res.success) {
        setCompanies(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      console.warn('Failed to load review leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsForReview();
  }, [activeStage, page]);

  // Mark as CONTACT_READY (Outreach Eligible)
  const handleApprove = async (company: MarketingCompany) => {
    try {
      await api.marketing.bulkUpdateCompanyStatus([company.id], 'Outreach Eligible', 'eligible');
      notify.toast(`"${company.name}" disetujui & ditandai SIAP DIHUBUNGI (CONTACT_READY)`, 'success');
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notify.error(err.message, 'Gagal Mengubah Status');
    }
  };

  // Mark as QUALIFIED
  const handleMarkQualified = async (company: MarketingCompany) => {
    try {
      await api.marketing.bulkUpdateCompanyStatus([company.id], 'Qualified', 'eligible');
      notify.toast(`"${company.name}" ditandai sebagai QUALIFIED`, 'success');
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notify.error(err.message, 'Gagal Mengubah Status');
    }
  };

  // Reject / Unqualified
  const handleReject = async (company: MarketingCompany) => {
    try {
      await api.marketing.bulkUpdateCompanyStatus([company.id], 'Unqualified', 'ineligible');
      notify.toast(`"${company.name}" ditolak / tidak memenuhi kualifikasi`, 'info');
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notify.error(err.message, 'Gagal Mengubah Status');
    }
  };

  // Add to Do Not Contact (Suppression)
  const handleAddToSuppression = async (company: MarketingCompany) => {
    const confirmed = await notify.confirm({
      title: 'Masukkan ke Do Not Contact?',
      text: `Alamat email "${company.email || company.name}" akan dimasukkan ke daftar pencegahan permanen (Suppression List) dan tidak akan pernah dihubungi.`,
      confirmButtonText: 'Ya, Blokir Kontak',
      cancelButtonText: 'Batal',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      if (company.email) {
        await api.marketing.addSuppression({
          email: company.email,
          reason: 'do_not_contact',
          notes: `Ditambahkan oleh admin via Lead Review untuk ${company.name}`
        });
      }
      await api.marketing.bulkUpdateCompanyStatus([company.id], 'Do Not Contact', 'ineligible');
      notify.toast(`"${company.name}" dimasukkan ke daftar Do Not Contact`, 'success');
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      notify.error(err.message, 'Gagal Menambahkan Suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Human-in-the-Loop Lead Qualification
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1">
            Lead Review — Peninjauan & Persetujuan Prospek
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
            Tinjau kredibilitas calon klien, periksa website resmi dan bukti sumber publikasi email sebelum dimasukkan ke dalam daftar kampanye email penawaran 1sLabs.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-800">
            {total} Prospek dalam Antrean
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 pb-3">
        {[
          { id: 'needs_review', label: 'Menunggu Peninjauan (NEEDS_REVIEW)', count: activeStage === 'needs_review' ? total : null },
          { id: 'qualified', label: 'Terkualifikasi (QUALIFIED)', count: activeStage === 'qualified' ? total : null },
          { id: 'contact_ready', label: 'Siap Dihubungi (CONTACT_READY)', count: activeStage === 'contact_ready' ? total : null },
          { id: 'all', label: 'Semua Status Prospek', count: activeStage === 'all' ? total : null }
        ].map(stage => (
          <button
            key={stage.id}
            type="button"
            onClick={() => {
              setActiveStage(stage.id as any);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
              activeStage === stage.id
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <span>{stage.label}</span>
            {stage.count !== null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                activeStage === stage.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
              }`}>
                {stage.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review Cards List */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400 bg-white border border-zinc-200 rounded-3xl">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-900" />
          <p className="text-xs font-mono font-medium text-zinc-600">Memuat antrean peninjauan prospek...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 bg-white border border-zinc-200 rounded-3xl">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-900">Antrean Peninjauan Bersih!</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Tidak ada prospek bisnis yang menunggu tindakan pada tahapan ini. Jalankan Lead Discovery untuk mencari calon prospek baru.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {companies.map(comp => {
            const emailStatus = comp.email_status || (comp.email ? 'UNVERIFIED' : 'NO_EMAIL');
            return (
              <div
                key={comp.id}
                className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Company & Contact Summary */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">{comp.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {comp.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        emailStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emailStatus === 'UNVERIFIED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {emailStatus}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">ID: #{comp.id}</span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl">
                    {comp.description || `Bisnis di ${comp.city || comp.province || 'Indonesia'}. Sektor: ${comp.industry || 'Multi-sektor'}.`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                    {comp.website_url && (
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-blue-600">
                        <Globe className="w-3.5 h-3.5" />
                        <a
                          href={comp.website_url.startsWith('http') ? comp.website_url : `https://${comp.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{comp.website_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {comp.email ? (
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-zinc-800 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{comp.email}</span>
                      </div>
                    ) : (
                      <div className="text-zinc-400 text-[11px] italic">Email belum ditemukan</div>
                    )}

                    <div className="text-zinc-400 text-[11px]">
                      Sumber: <span className="text-zinc-700 font-medium">{comp.primary_source_name || 'Direct'}</span>
                    </div>

                    {comp.email_source_url && (
                      <div className="text-zinc-400 text-[10px] truncate max-w-xs">
                        Bukti Publikasi:{' '}
                        <a
                          href={comp.email_source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline font-mono"
                        >
                          {comp.email_source_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Review Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCompanyDetail(comp)}
                    className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Detail Lengkap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkQualified(comp)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>QUALIFIED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(comp)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Setujui CONTACT_READY</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(comp)}
                    className="p-2 border border-zinc-200 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Tolak Prospek"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddToSuppression(comp)}
                    className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Do Not Contact (Blokir)"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCompanyDetail && (
        <ProspectDetailModal
          company={selectedCompanyDetail}
          onClose={() => setSelectedCompanyDetail(null)}
          onUpdate={() => {
            fetchLeadsForReview();
          }}
        />
      )}
    </div>
  );
};

