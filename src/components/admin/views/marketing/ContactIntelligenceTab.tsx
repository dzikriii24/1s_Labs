import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { api, MarketingContact } from '../../../../services/api';

export const ContactIntelligenceTab: React.FC = () => {
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await api.marketing.getContacts({
        search: search || undefined,
        role: role !== 'all' ? role : undefined,
        page,
        limit: 20
      });

      if (res.success) {
        setContacts(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      console.warn('Failed to load contacts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, role]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContacts();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus kontak profesional ini?')) return;
    try {
      await api.marketing.deleteContact(id);
      fetchContacts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Contact Intelligence Repository
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar orang dan jabatan profesional (Owner, Founder, CEO, HR, IT Manager) yang ditemukan secara publik & sah.
            </p>
          </div>
        </div>

        <button
          onClick={fetchContacts}
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama orang, email, atau nama perusahaan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </form>

        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="all">Semua Jabatan</option>
          <option value="Owner">Owner / Pemilik</option>
          <option value="Founder">Founder</option>
          <option value="CEO">CEO / Direktur</option>
          <option value="HR Manager">HR Manager / HRD</option>
          <option value="Business Development">Business Development</option>
          <option value="Marketing Manager">Marketing Manager</option>
          <option value="IT Manager">IT Manager</option>
          <option value="Other">Lainnya</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
            Memuat repository kontak...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs space-y-1">
            <p className="font-semibold text-zinc-800">Belum ada kontak profesional yang sesuai kriteria.</p>
            <p className="text-[11px] text-zinc-400">Kontak akan otomatis terisi saat scraping atau enrichment AI dijalankan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-50/75">
                  <th className="py-3 px-4">Nama Profesional</th>
                  <th className="py-3 px-4">Jabatan & Kategori</th>
                  <th className="py-3 px-4">Perusahaan Terkait</th>
                  <th className="py-3 px-4">Email Bisnis</th>
                  <th className="py-3 px-4">Telepon</th>
                  <th className="py-3 px-4">Status Verifikasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        {c.full_name}
                        {c.is_primary ? (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" title="Primary Contact" />
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                        {c.position || c.role_category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{c.company_name || 'N/A'}</div>
                      <div className="text-[10px] text-zinc-400">{c.company_city || ''}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-800">
                      {c.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-700">
                      {c.phone || <span className="text-zinc-400 italic">N/A</span>}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          c.verification_status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {c.verification_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Kontak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
          <div>Total <strong className="text-zinc-900 font-mono">{totalRecords.toLocaleString()}</strong> kontak terdata</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="font-mono text-zinc-700 px-2 font-semibold">{page} / {totalPages || 1}</span>
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
    </div>
  );
};
