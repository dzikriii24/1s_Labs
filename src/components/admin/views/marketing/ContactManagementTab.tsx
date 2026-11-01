import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Globe,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  UserCheck
} from 'lucide-react';
import { api, MarketingContact } from '../../../../services/api';

const ROLE_OPTIONS = [
  'Owner',
  'Founder',
  'Business Owner',
  'Store Manager',
  'Branch Manager',
  'Operations Manager',
  'General Manager',
  'Marketing Manager',
  'Business Development',
  'General Contact Person'
];

interface ContactManagementTabProps {
  onOpenCompanyDetail?: (comp: any) => void;
}

export const ContactManagementTab: React.FC<ContactManagementTabProps> = ({ onOpenCompanyDetail }) => {
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedEligible, setSelectedEligible] = useState('all');

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getContacts({
        search: search.trim() || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        outreach_eligible: selectedEligible !== 'all' ? selectedEligible : undefined,
        page,
        limit
      });
      if (res && res.success) {
        setContacts(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar kontak.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, selectedRole, selectedEligible]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const handleSetPrimary = async (contact: MarketingContact) => {
    try {
      await api.marketing.setPrimaryContact(contact.id);
      fetchContacts();
    } catch (err: any) {
      alert(`Gagal menetapkan kontak utama: ${err.message}`);
    }
  };

  const handleDeleteContact = async (contact: MarketingContact) => {
    if (!confirm(`Hapus kontak "${contact.full_name}"?`)) return;
    try {
      await api.marketing.deleteContact(contact.id);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(`Gagal menghapus kontak: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-2xl bg-zinc-900 text-white">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Contact Intelligence & Management
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola seluruh kontak bisnis, WhatsApp order, email outreach, Instagram resmi, dan owner/pengelola usaha kecil.
            </p>
          </div>
        </div>

        <button
          onClick={fetchContacts}
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama kontak, email, nomor, bisnis..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="all">Semua Peran / Jabatan</option>
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedEligible}
              onChange={e => setSelectedEligible(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="all">Semua Status Outreach</option>
              <option value="true">Memenuhi Syarat Outreach (Eligible)</option>
              <option value="false">Belum Layak Outreach</option>
            </select>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-700" />
            <span>Memuat kontak...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-semibold text-zinc-800">Belum ada kontak yang ditemukan.</p>
            <p className="text-[11px] text-zinc-400">Jalankan Contact Recovery atau tambahkan kontak manual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Kontak</th>
                  <th className="py-3 px-4">Peran / Jabatan</th>
                  <th className="py-3 px-4">Entitas Bisnis</th>
                  <th className="py-3 px-4">Detail Kontak Langsung</th>
                  <th className="py-3 px-4">Verifikasi</th>
                  <th className="py-3 px-4 text-center">Outreach</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {contacts.map(c => {
                  const isPhoneWa = c.phone && (c.phone.startsWith('08') || c.phone.startsWith('+628'));
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {c.is_primary ? (
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" title="Kontak Utama" />
                          ) : null}
                          <span className="font-bold text-zinc-900">{c.full_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-zinc-700 px-2 py-0.5 rounded-md bg-zinc-100">
                          {c.position || c.role_category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-800">{c.company_name || `#${c.company_id}`}</span>
                          <span className="text-[10px] text-zinc-400">{c.company_city || 'Indonesia'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-mono flex items-center gap-1"
                              title="Kirim Email"
                            >
                              <Mail className="w-3 h-3 text-blue-600" />
                              <span>{c.email}</span>
                            </a>
                          )}

                          {c.phone && (
                            isPhoneWa ? (
                              <a
                                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-mono flex items-center gap-1"
                                title="Chat WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>{c.phone}</span>
                              </a>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-mono flex items-center gap-1">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <span>{c.phone}</span>
                              </span>
                            )
                          )}

                          {c.profile_url && c.profile_url.includes('instagram') && (
                            <a
                              href={c.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[11px] font-mono flex items-center gap-1"
                            >
                              <Instagram className="w-3 h-3 text-pink-600" />
                              <span>Instagram</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            c.verification_status === 'Verified' || c.verification_status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.verification_status === 'Likely Correct'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {c.verification_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                            c.outreach_eligible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          {c.outreach_eligible ? 'ELIGIBLE' : 'NO'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!c.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(c)}
                              className="px-2 py-1 text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors cursor-pointer"
                              title="Jadikan Kontak Utama"
                            >
                              Set Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Kontak"
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
            <span>Menampilkan {contacts.length} dari {total} kontak</span>
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
  );
};
