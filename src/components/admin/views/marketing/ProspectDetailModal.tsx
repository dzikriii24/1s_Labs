import React, { useState } from 'react';
import {
  X,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Clock,
  Flame,
  UserCheck,
  Send,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { api, MarketingCompany, MarketingContact } from '../../../../services/api';

interface ProspectDetailModalProps {
  company: MarketingCompany | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  company,
  onClose,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'digital' | 'contacts' | 'audit' | 'sources'>('info');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Additional detail states
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New Contact Form Modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('');
  const [newContactRole, setNewContactRole] = useState('Owner');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const loadFullDetails = async () => {
    if (!company) return;
    setIsLoadingDetails(true);
    try {
      const res = await api.marketing.getCompany(company.id);
      if (res.success) {
        setContacts(res.contacts || []);
        setAudits(res.audits || []);
        setSources(res.sources || []);
      }
    } catch (err: any) {
      console.warn('Failed to load company full details', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  React.useEffect(() => {
    if (company) {
      loadFullDetails();
    }
  }, [company?.id]);

  if (!company) return null;

  const handleEnrich = async () => {
    setIsEnriching(true);
    setActionMessage(null);
    try {
      const res = await api.marketing.enrichCompany(company.id);
      if (res.success) {
        setActionMessage({ text: 'Profil bisnis berhasil diperkaya oleh Gemini AI!', type: 'success' });
        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal menjalankan enrichment Gemini AI.', type: 'error' });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleRecoverContact = async () => {
    setIsRecovering(true);
    setActionMessage(null);
    try {
      const res = await api.marketing.recoverCompanyContact(company.id);
      if (res.success) {
        setActionMessage({
          text: `Pemulihan kontak selesai! ${res.result.newContactPoints} titik kontak baru ditemukan.`,
          type: 'success'
        });
        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal memulihkan kontak.', type: 'error' });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    setActionMessage(null);
    try {
      const res = await api.marketing.auditWebsite(company.id);
      if (res.success) {
        setActionMessage({ text: 'Audit website berhasil diselesaikan!', type: 'success' });
        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal melakukan audit website.', type: 'error' });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.marketing.addContact({
        company_id: company.id,
        full_name: newContactName,
        position: newContactPosition,
        role_category: newContactRole,
        email: newContactEmail || null,
        phone: newContactPhone || null,
        outreach_eligible: newContactEmail ? 1 : 0
      });
      setShowAddContact(false);
      setNewContactName('');
      setNewContactPosition('');
      setNewContactEmail('');
      setNewContactPhone('');
      loadFullDetails();
      setActionMessage({ text: 'Kontak profesional berhasil ditambahkan.', type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal menambahkan kontak.', type: 'error' });
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('Hapus kontak ini?')) return;
    try {
      await api.marketing.deleteContact(contactId);
      loadFullDetails();
      setActionMessage({ text: 'Kontak berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal menghapus kontak.', type: 'error' });
    }
  };

  let potentialNeeds: string[] = [];
  if (Array.isArray(company.potential_needs_json)) {
    potentialNeeds = company.potential_needs_json;
  } else if (typeof company.potential_needs_json === 'string') {
    try {
      potentialNeeds = JSON.parse(company.potential_needs_json);
    } catch {}
  }

  let recommendedServices: string[] = [];
  if (Array.isArray(company.recommended_services_json)) {
    recommendedServices = company.recommended_services_json;
  } else if (typeof company.recommended_services_json === 'string') {
    try {
      recommendedServices = JSON.parse(company.recommended_services_json);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/75">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium border border-zinc-200">
                {company.category}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                {company.status}
              </span>
              {company.lead_score >= 80 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-semibold">
                  <Flame className="w-3 h-3 text-rose-500" /> Hot Lead ({company.lead_score}/100)
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              {company.name}
              {company.business_type && (
                <span className="text-xs font-normal text-zinc-500">({company.business_type})</span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {company.city || company.province || 'Wilayah Indonesia'}
              </span>
              <span>• Sumber: <strong className="text-zinc-700 font-normal">{company.primary_source_name || 'Public Registry'}</strong></span>
              <span>• Ditemukan: {new Date(company.first_discovered_at).toLocaleDateString('id-ID')}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRecoverContact}
              disabled={isRecovering}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Riset mendalam WhatsApp, Instagram, Website, dan Pengelola"
            >
              {isRecovering ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
              <span>Pulihkan Kontak (Gemini AI)</span>
            </button>
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isEnriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              <span>AI Research</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="underline text-[11px] cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-zinc-200 px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Informasi Bisnis
          </button>
          <button
            onClick={() => setActiveTab('digital')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'digital'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Digital Presence & Website
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'contacts'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Kontak Profesional ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Audit Website ({audits.length})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sources'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Riwayat Sumber ({sources.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-zinc-800">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Kontak Bisnis Utama</div>
                  <div className="space-y-1.5 text-xs">
                    {company.whatsapp_number && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-zinc-500">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${company.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-700 hover:underline font-bold"
                        >
                          {company.whatsapp_number}
                        </a>
                      </div>
                    )}
                    {company.instagram_url && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                        <span className="text-zinc-500">Instagram:</span>
                        <a
                          href={company.instagram_url.startsWith('http') ? company.instagram_url : `https://instagram.com/${company.instagram_url.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-600 hover:underline font-medium"
                        >
                          {company.instagram_url}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono text-zinc-900">{company.email || 'Tidak tersedia'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono text-zinc-900">{company.phone || 'Tidak tersedia'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      {company.website_url ? (
                        <a
                          href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {company.website_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-400">Tidak ada website</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Lokasi & Alamat</div>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {company.address || `${company.city || ''}, ${company.province || 'Indonesia'}`}
                  </p>
                  {company.google_maps_url && (
                    <a
                      href={company.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium mt-1"
                    >
                      Buka di Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* AI Enrichment Analysis Box */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-zinc-900">Analisis Kebutuhan & Rekomendasi Solusi 1sLabs</h4>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Lead Score: <strong className="text-zinc-900">{company.lead_score}/100</strong> (Grade {company.lead_grade})
                  </span>
                </div>

                {company.ai_summary ? (
                  <p className="text-xs text-zinc-700 leading-relaxed bg-white p-3.5 rounded-xl border border-zinc-200">
                    {company.ai_summary}
                  </p>
                ) : (
                  <div className="text-xs text-zinc-500 italic p-3 bg-white rounded-xl border border-zinc-200">
                    Belum dilakukan pengayaan AI. Klik tombol "AI Research" di atas untuk menganalisis potensi kebutuhan website, sistem, atau aplikasi.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono block mb-2">
                      Potensi Kebutuhan Bisnis:
                    </span>
                    {potentialNeeds.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-zinc-700">
                        {potentialNeeds.map((need, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-zinc-400">Belum teridentifikasi</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono block mb-2">
                      Rekomendasi Layanan 1sLabs:
                    </span>
                    {recommendedServices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {recommendedServices.map((srv, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-900 text-xs font-medium shadow-xs"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Belum tersedia rekomendasi</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL PRESENCE */}
          {activeTab === 'digital' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-900">Digital Presence & Website Status</h4>
                {company.website_url && (
                  <button
                    onClick={handleAudit}
                    disabled={isAuditing}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Jalankan Audit Website
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Website Status</div>
                  <div className="text-base font-bold text-zinc-900 mt-1 capitalize">{company.website_status}</div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">SSL Security</div>
                  <div className="text-base font-bold text-zinc-900 mt-1 capitalize">{company.ssl_status}</div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Mobile Friendly</div>
                  <div className="text-base font-bold text-zinc-900 mt-1 capitalize">{company.mobile_responsive}</div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Performance Score</div>
                  <div className="text-base font-bold text-zinc-900 mt-1 font-mono">
                    {company.performance_score ? `${company.performance_score}/100` : 'N/A'}
                  </div>
                </div>
              </div>

              {company.digital_presence_findings && (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="text-xs font-bold text-zinc-900 mb-2">Temuan Kondisi Digital</div>
                  <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-zinc-200">
                    {company.digital_presence_findings}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-zinc-900">Daftar Kontak Profesional</h4>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kontak
                </button>
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContactSubmit} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-zinc-900">Tambah Kontak Profesional Baru</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nama Lengkap *"
                      required
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <input
                      type="text"
                      placeholder="Jabatan (e.g. Direktur Operasional)"
                      value={newContactPosition}
                      onChange={e => setNewContactPosition(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    <input
                      type="email"
                      placeholder="Email Bisnis Resmi"
                      value={newContactEmail}
                      onChange={e => setNewContactEmail(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                    />
                    <select
                      value={newContactRole}
                      onChange={e => setNewContactRole(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                      <option value="Owner">Owner / Pemilik</option>
                      <option value="Founder">Founder / Co-Founder</option>
                      <option value="CEO">CEO / Managing Director</option>
                      <option value="Manager">Manager / Head of Dept</option>
                      <option value="IT">IT / Tech Lead</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                    >
                      Simpan Kontak
                    </button>
                  </div>
                </form>
              )}

              {contacts.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                  Belum ada kontak profesional yang terdata untuk bisnis ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((ct) => (
                    <div
                      key={ct.id}
                      className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-xs text-zinc-900">{ct.full_name}</div>
                        <div className="text-[11px] text-zinc-500">
                          {ct.position || ct.role_category} {ct.email && <span className="font-mono text-zinc-700">• {ct.email}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ct.outreach_eligible === 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            Outreach Ready
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteContact(ct.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Kontak"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDITS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-900">Riwayat Audit Website</h4>
              {audits.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                  Belum ada riwayat audit website untuk entitas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {audits.map((a) => (
                    <div key={a.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-zinc-700">{a.audited_url}</span>
                        <span className="text-[11px] text-zinc-500">{new Date(a.created_at).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-mono">
                        <span>SSL: <strong className={a.ssl_valid ? 'text-emerald-600' : 'text-rose-600'}>{a.ssl_valid ? 'Valid' : 'Invalid'}</strong></span>
                        <span>HTTP Code: <strong className="text-zinc-900">{a.http_status_code}</strong></span>
                        <span>Latency: <strong className="text-zinc-900">{a.load_time_ms}ms</strong></span>
                        <span>Skor: <strong className="text-zinc-900">{a.overall_health_score}/100</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SOURCES */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-900">Riwayat & Sumber Pengumpulan</h4>
              {sources.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                  Riwayat sumber data primer: {company.primary_source_name || 'Public Directory'}
                </div>
              ) : (
                <div className="space-y-2">
                  {sources.map((s, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs flex justify-between">
                      <span className="font-medium text-zinc-800">{s.source_name || 'Public Source'}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">{new Date(s.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/75 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
