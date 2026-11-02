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
  Trash2,
  Edit2,
  Eye,
  Check,
  Layers,
  HelpCircle,
  Monitor,
  Smartphone,
  Copy,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { api, MarketingCompany, MarketingContact } from '../../../../services/api';
import Swal from 'sweetalert2';

interface ProspectDetailModalProps {
  company: MarketingCompany | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  company: initialCompany,
  onClose,
  onUpdate
}) => {
  const [company, setCompany] = useState<MarketingCompany | null>(initialCompany);
  const [activeTab, setActiveTab] = useState<'info' | 'digital' | 'contacts' | 'audit' | 'sources'>('info');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1-on-1 AI Outreach States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [outreachRecipientEmail, setOutreachRecipientEmail] = useState('');
  const [outreachRecipientName, setOutreachRecipientName] = useState('');
  const [outreachContactId, setOutreachContactId] = useState<number | null>(null);
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [outreachHighlights, setOutreachHighlights] = useState<string[]>([]);
  const [selectedAngle, setSelectedAngle] = useState('general');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [updateCompanyEmailOnSend, setUpdateCompanyEmailOnSend] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Additional detail states
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Kontak Bisnis Utama edit state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    whatsapp_number: '',
    instagram_url: '',
    email: '',
    phone: '',
    website_url: ''
  });

  // Lokasi & Alamat edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_address: '',
    city: '',
    province: '',
    google_maps_url: ''
  });

  // New Contact Form Modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('');
  const [newContactRole, setNewContactRole] = useState('Owner');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactIsPrimary, setNewContactIsPrimary] = useState(false);

  React.useEffect(() => {
    setCompany(initialCompany);
    if (initialCompany) {
      setOutreachRecipientEmail(initialCompany.email || '');
      setOutreachRecipientName(initialCompany.name || '');
    }
  }, [initialCompany]);

  const loadFullDetails = async () => {
    if (!company) return;
    setIsLoadingDetails(true);
    try {
      const res = await api.marketing.getCompany(company.id);
      if (res.success) {
        if (res.company) setCompany(res.company);
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
    if (company?.id) {
      loadFullDetails();
    }
  }, [company?.id]);

  if (!company) return null;

  // Edit Kontak Bisnis Utama handlers
  const handleStartEditContact = () => {
    if (!company) return;
    setContactForm({
      whatsapp_number: company.whatsapp_number || '',
      instagram_url: company.instagram_url || '',
      email: company.email || '',
      phone: company.phone || '',
      website_url: company.website_url || ''
    });
    setIsEditingContact(true);
  };

  const handleSelectFromExistingContact = (contactIdStr: string) => {
    const contactId = parseInt(contactIdStr, 10);
    if (!contactId) return;
    const selected = contacts.find(c => c.id === contactId);
    if (selected) {
      setContactForm(prev => ({
        ...prev,
        email: selected.email || prev.email,
        phone: selected.phone || prev.phone
      }));
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsSavingContact(true);
    setActionMessage(null);
    try {
      const payload: Partial<MarketingCompany> = {
        whatsapp_number: contactForm.whatsapp_number.trim() || null,
        instagram_url: contactForm.instagram_url.trim() || null,
        email: contactForm.email.trim() || null,
        phone: contactForm.phone.trim() || null,
        website_url: contactForm.website_url.trim() || null
      };
      const res = await api.marketing.updateCompany(company.id, payload);
      if (res.success) {
        setCompany(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...(res.company || payload),
            whatsapp_number: payload.whatsapp_number,
            instagram_url: payload.instagram_url,
            email: payload.email,
            phone: payload.phone,
            website_url: payload.website_url,
            has_website: Boolean(payload.website_url),
            outreach_eligibility: payload.email ? 'eligible' : prev.outreach_eligibility
          };
        });
        setIsEditingContact(false);
        setActionMessage({ text: 'Kontak bisnis utama berhasil diperbarui!', type: 'success' });
        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal memperbarui kontak bisnis utama.', type: 'error' });
    } finally {
      setIsSavingContact(false);
    }
  };

  // Edit Alamat & Lokasi handlers
  const handleStartEditAddress = () => {
    if (!company) return;
    setAddressForm({
      full_address: company.full_address || (company as any).address || '',
      city: company.city || '',
      province: company.province || '',
      google_maps_url: company.google_maps_url || ''
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsSavingAddress(true);
    setActionMessage(null);
    try {
      const payload: any = {
        full_address: addressForm.full_address.trim() || null,
        city: addressForm.city.trim() || null,
        province: addressForm.province.trim() || null,
        google_maps_url: addressForm.google_maps_url.trim() || null
      };
      const res = await api.marketing.updateCompany(company.id, payload);
      if (res.success) {
        setCompany(prev => prev ? ({ ...prev, ...(res.company || payload) }) : null);
        setIsEditingAddress(false);
        setActionMessage({ text: 'Alamat & lokasi bisnis berhasil diperbarui!', type: 'success' });
        onUpdate();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal memperbarui alamat.', type: 'error' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Jadikan kontak profesional sebagai kontak utama
  const handleSetPrimaryContact = async (contactId: number) => {
    try {
      const res = await api.marketing.setPrimaryContact(contactId);
      if (res.success) {
        setActionMessage({ text: 'Kontak utama berhasil ditetapkan!', type: 'success' });
        if (res.company) {
          setCompany(res.company);
        }
        await loadFullDetails();
        onUpdate();
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal menetapkan kontak utama.', type: 'error' });
    }
  };

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
    if (!company) return;
    setIsRecovering(true);
    setActionMessage(null);

    Swal.fire({
      title: 'Sedang Meriset Kontak...',
      html: `
        <div style="font-size: 13px; color: #52525b; margin-top: 6px;">
          Gemini AI sedang mencari kontak untuk <b>${company.name}</b>...
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
      const res = await api.marketing.recoverCompanyContact(company.id);
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
              Pemulihan kontak untuk <b>${comp?.name || company.name}</b> berhasil diselesaikan.
            </p>
            ${
              newPoints > 0
                ? `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-bottom: 10px;">
                  <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px;">Titik Kontak Baru</div>
                  ${contactRowsHtml}
                </div>
                <div style="color: #059669; font-size: 12px; font-weight: 600;">
                  ✓ Berhasil menemukan <b>${newPoints}</b> titik kontak baru & tersimpan ke profil.
                </div>
              `
                : `
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 12px 14px; color: #b45309; font-size: 12px;">
                  ℹ️ Belum ditemukan kontak publik tambahan untuk bisnis ini.
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

        if (comp) {
          setCompany(comp);
        }
        setActionMessage({
          text: `Pemulihan kontak selesai! ${newPoints} titik kontak baru ditemukan.`,
          type: 'success'
        });
        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Pemulihan Kontak Gagal',
        text: err.message || 'Gagal memulihkan kontak.',
        confirmButtonColor: '#18181b',
        customClass: {
          popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
          confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
        }
      });
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
        outreach_eligible: newContactEmail ? 1 : 0,
        is_primary: newContactIsPrimary ? 1 : 0
      });
      setShowAddContact(false);
      setNewContactName('');
      setNewContactPosition('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewContactIsPrimary(false);
      loadFullDetails();
      setActionMessage({ text: 'Kontak profesional berhasil ditambahkan.', type: 'success' });
      onUpdate();
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
      onUpdate();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Gagal menghapus kontak.', type: 'error' });
    }
  };

  // 1-on-1 AI Outreach Handlers
  const handleGenerateDraft = async (angleParam?: string) => {
    if (!company) return;
    const angleToUse = angleParam || selectedAngle;
    setIsGeneratingDraft(true);
    setActionMessage(null);
    try {
      const res = await api.marketing.generateEmailDraft(company.id, {
        recipient_name: outreachRecipientName || company.name,
        objective: angleToUse,
        language: company.is_international ? 'en' : 'id'
      });

      if (res.success && res.draft) {
        setOutreachSubject(res.draft.subject || '');
        setOutreachMessage(res.draft.body_text || '');
        setOutreachHighlights(res.draft.highlights || []);
        if (!outreachRecipientEmail && res.draft.recipient_email) {
          setOutreachRecipientEmail(res.draft.recipient_email);
        }
        setActionMessage({
          text: 'Draf email penawaran berhasil dibuat oleh Gemini AI!',
          type: 'success'
        });
      }
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Gagal membuat draf email dengan AI.',
        type: 'error'
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleOpenEmailComposer = (autoGenerate = false) => {
    setShowEmailModal(true);
    if (!outreachRecipientEmail && company?.email) {
      setOutreachRecipientEmail(company.email);
    }
    if (!outreachRecipientName && company?.name) {
      setOutreachRecipientName(company.name);
    }
    if (autoGenerate || !outreachMessage) {
      handleGenerateDraft();
    }
  };

  const handleSendDirectEmail = async () => {
    if (!company) return;
    if (!outreachRecipientEmail.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Penerima Kosong',
        text: 'Silakan isi alamat email tujuan terlebih dahulu.',
        confirmButtonColor: '#18181b',
        customClass: { popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans' }
      });
      return;
    }
    if (!outreachSubject.trim() || !outreachMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Subjek atau Pesan Kosong',
        text: 'Silakan lengkapi subjek dan isi pesan email sebelum mengirim.',
        confirmButtonColor: '#18181b',
        customClass: { popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans' }
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kirim Email Penawaran?',
      html: `
        <div style="text-align: left; font-size: 13px;">
          <p>Email penawaran resmi dari <b>info@1slabs.my.id</b> akan dikirimkan langsung ke:</p>
          <div style="background: #f4f4f5; padding: 10px 12px; border-radius: 12px; margin: 10px 0; font-family: monospace; color: #18181b; font-weight: bold;">
            ${outreachRecipientEmail}
          </div>
          <p style="color: #52525b; font-size: 11px;">
            Subjek: <b>${outreachSubject}</b>
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim Sekarang',
      cancelButtonText: 'Periksa Kembali',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#71717a',
      customClass: {
        popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
        confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer',
        cancelButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
      }
    });

    if (!confirm.isConfirmed) return;

    setIsSendingEmail(true);
    try {
      const res = await api.marketing.sendDirectEmail(company.id, {
        recipient_email: outreachRecipientEmail.trim(),
        recipient_name: outreachRecipientName.trim() || company.name,
        contact_id: outreachContactId || undefined,
        subject: outreachSubject.trim(),
        message_text: outreachMessage.trim(),
        update_company_email: updateCompanyEmailOnSend,
        allow_duplicate: true
      });

      if (res.success) {
        setShowEmailModal(false);
        await Swal.fire({
          icon: 'success',
          title: 'Email Penawaran Terkirim!',
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p>Email penawaran berhasil dikirimkan ke <b>${outreachRecipientEmail}</b>.</p>
              <p style="color: #71717a; font-size: 12px; margin-top: 8px;">
                Status prospek otomatis diperbarui ke <b>Contacted</b>. Semua balasan pesan dari prospek ini akan otomatis masuk ke <b>Email Inbox & Conversations</b>.
              </p>
            </div>
          `,
          confirmButtonColor: '#18181b',
          customClass: {
            popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans',
            confirmButton: 'px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer'
          }
        });

        setCompany(prev => prev ? {
          ...prev,
          status: 'Contacted',
          contacted_times: (prev.contacted_times || 0) + 1,
          last_contacted_at: new Date().toISOString(),
          email: prev.email || outreachRecipientEmail.trim()
        } : null);

        onUpdate();
        loadFullDetails();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirimkan Email',
        text: err.message || 'Terjadi kesalahan saat mengirimkan email.',
        confirmButtonColor: '#18181b',
        customClass: {
          popup: 'rounded-3xl border border-zinc-200 shadow-2xl font-sans'
        }
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyMessage = () => {
    if (!outreachMessage) return;
    navigator.clipboard.writeText(outreachMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const formatInlineText = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-zinc-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderFormattedEmailContent = (text: string) => {
    if (!text || !text.trim()) {
      return (
        <div className="py-8 text-center text-zinc-400 italic text-xs">
          Belum ada draf pesan. Klik "Generate Ulang AI" untuk merancang penawaran otomatis.
        </div>
      );
    }

    if (text.trim().startsWith('<') && (text.includes('</p>') || text.includes('</div>') || text.includes('</ul>'))) {
      return (
        <div
          className="prose prose-sm max-w-none text-zinc-800 leading-relaxed text-[13px] space-y-3 font-sans"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentBulletGroup: string[] = [];

    const flushBullets = (key: string) => {
      if (currentBulletGroup.length > 0) {
        elements.push(
          <div key={key} className="my-3 space-y-2 bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-200/80">
            {currentBulletGroup.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-zinc-800 text-[13px] leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-2xs" />
                <span className="flex-1">{formatInlineText(item)}</span>
              </div>
            ))}
          </div>
        );
        currentBulletGroup = [];
      }
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();

      if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.replace(/^[•\-\*]\s*/, '');
        currentBulletGroup.push(itemText);
        return;
      }

      const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        currentBulletGroup.push(`${numMatch[1]}. ${numMatch[2]}`);
        return;
      }

      flushBullets(`flush-${idx}`);

      if (!line) return;

      const isSalutation = line.toLowerCase().startsWith('halo') || line.toLowerCase().startsWith('dear') || line.toLowerCase().startsWith('yth');
      const isSignoff = line.toLowerCase().startsWith('salam hangat') || line.toLowerCase().startsWith('terima kasih') || line.toLowerCase().startsWith('warm regards') || line.toLowerCase().startsWith('best regards');

      if (isSalutation) {
        elements.push(
          <p key={`line-${idx}`} className="text-zinc-900 font-semibold text-[13.5px] mb-2 leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      } else if (isSignoff) {
        elements.push(
          <p key={`line-${idx}`} className="text-zinc-700 text-[13px] mt-4 pt-3 border-t border-zinc-100 leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      } else {
        elements.push(
          <p key={`line-${idx}`} className="text-zinc-800 text-[13px] leading-relaxed my-2">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    flushBullets('final-flush');

    return <div className="space-y-1 font-sans">{elements}</div>;
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

          <div className="flex items-center gap-2 shrink-0">
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
                {/* Card 1: Kontak Bisnis Utama */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
                      Kontak Bisnis Utama
                    </div>
                    {!isEditingContact && (
                      <button
                        type="button"
                        onClick={handleStartEditContact}
                        className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-500" />
                        <span>Ubah Kontak</span>
                      </button>
                    )}
                  </div>

                  {!isEditingContact ? (
                    <div className="space-y-2 text-xs">
                      {/* Email */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200/70 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="text-zinc-500 text-[11px] shrink-0">Email:</span>
                          {company.email ? (
                            <a
                              href={`mailto:${company.email}`}
                              className="font-mono text-zinc-900 hover:text-blue-600 font-medium truncate"
                            >
                              {company.email}
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Belum tersedia</span>
                          )}
                        </div>
                        {company.email ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              Outreach Ready
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOutreachRecipientEmail(company.email!);
                                setOutreachRecipientName(company.name);
                                setOutreachContactId(null);
                                handleOpenEmailComposer(true);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Kirim email penawaran AI"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Kirim Email</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartEditContact}
                            className="text-[10px] text-blue-600 hover:underline shrink-0 font-medium cursor-pointer"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>

                      {/* WhatsApp */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200/70 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-zinc-500 text-[11px] shrink-0">WhatsApp:</span>
                          {company.whatsapp_number ? (
                            <a
                              href={`https://wa.me/${company.whatsapp_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-emerald-700 hover:underline font-bold truncate"
                            >
                              {company.whatsapp_number}
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Belum tersedia</span>
                          )}
                        </div>
                        {!company.whatsapp_number && (
                          <button
                            type="button"
                            onClick={handleStartEditContact}
                            className="text-[10px] text-emerald-700 hover:underline shrink-0 font-medium cursor-pointer"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>

                      {/* Telepon */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200/70 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="text-zinc-500 text-[11px] shrink-0">Telepon:</span>
                          {company.phone ? (
                            <a
                              href={`tel:${company.phone}`}
                              className="font-mono text-zinc-900 hover:text-blue-600 font-medium truncate"
                            >
                              {company.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Belum tersedia</span>
                          )}
                        </div>
                        {!company.phone && (
                          <button
                            type="button"
                            onClick={handleStartEditContact}
                            className="text-[10px] text-zinc-600 hover:underline shrink-0 font-medium cursor-pointer"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>

                      {/* Instagram */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200/70 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                          <span className="text-zinc-500 text-[11px] shrink-0">Instagram:</span>
                          {company.instagram_url ? (
                            <a
                              href={company.instagram_url.startsWith('http') ? company.instagram_url : `https://instagram.com/${company.instagram_url.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-pink-600 hover:underline font-medium truncate"
                            >
                              {company.instagram_url}
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Belum tersedia</span>
                          )}
                        </div>
                        {!company.instagram_url && (
                          <button
                            type="button"
                            onClick={handleStartEditContact}
                            className="text-[10px] text-pink-600 hover:underline shrink-0 font-medium cursor-pointer"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>

                      {/* Website */}
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200/70 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="text-zinc-500 text-[11px] shrink-0">Website:</span>
                          {company.website_url ? (
                            <a
                              href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-medium truncate"
                            >
                              <span className="truncate">{company.website_url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-zinc-400 italic">Tidak ada website</span>
                          )}
                        </div>
                        {!company.website_url && (
                          <button
                            type="button"
                            onClick={handleStartEditContact}
                            className="text-[10px] text-blue-600 hover:underline shrink-0 font-medium cursor-pointer"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveContact} className="space-y-3 pt-1">
                      {contacts.length > 0 && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                          <label className="text-[11px] text-amber-900 font-medium flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                            Salin dari Kontak Profesional Tersimpan:
                          </label>
                          <select
                            onChange={(e) => handleSelectFromExistingContact(e.target.value)}
                            defaultValue=""
                            className="w-full text-xs bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="" disabled>-- Pilih kontak untuk mengisi email/telepon --</option>
                            {contacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name} ({c.position || c.role_category}) {c.email ? `• ${c.email}` : ''} {c.phone ? `• ${c.phone}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" /> Email Bisnis / Target Outreach
                          </label>
                          <input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="contoh: halo@perusahaan.com"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Bisnis
                          </label>
                          <input
                            type="text"
                            value={contactForm.whatsapp_number}
                            onChange={(e) => setContactForm({ ...contactForm, whatsapp_number: e.target.value })}
                            placeholder="contoh: 08123456789 atau +628123456789"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" /> Nomor Telepon Kantor / Lainnya
                          </label>
                          <input
                            type="text"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            placeholder="contoh: 021-12345678 atau 08..."
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-pink-500" /> Akun Instagram (@ atau URL)
                          </label>
                          <input
                            type="text"
                            value={contactForm.instagram_url}
                            onChange={(e) => setContactForm({ ...contactForm, instagram_url: e.target.value })}
                            placeholder="contoh: @namabisnis atau https://instagram.com/namabisnis"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" /> Website Resmi
                          </label>
                          <input
                            type="text"
                            value={contactForm.website_url}
                            onChange={(e) => setContactForm({ ...contactForm, website_url: e.target.value })}
                            placeholder="contoh: https://bisnisanda.com"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setIsEditingContact(false)}
                          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingContact}
                          className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingContact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Simpan Kontak</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Card 2: Lokasi & Alamat */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
                      Lokasi & Alamat
                    </div>
                    {!isEditingAddress && (
                      <button
                        type="button"
                        onClick={handleStartEditAddress}
                        className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-500" />
                        <span>Ubah Alamat</span>
                      </button>
                    )}
                  </div>

                  {!isEditingAddress ? (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-700 leading-relaxed bg-white p-2.5 rounded-xl border border-zinc-200/70">
                        {company.full_address || (company as any).address || `${company.city || ''}, ${company.province || 'Indonesia'}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-zinc-600">
                        <span>Kota: <strong className="text-zinc-800">{company.city || '-'}</strong></span>
                        <span>Provinsi: <strong className="text-zinc-800">{company.province || '-'}</strong></span>
                      </div>
                      {company.google_maps_url && (
                        <a
                          href={company.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium mt-1 inline-flex"
                        >
                          Buka di Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveAddress} className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-700 mb-1 block">
                          Alamat Lengkap
                        </label>
                        <textarea
                          rows={2}
                          value={addressForm.full_address}
                          onChange={(e) => setAddressForm({ ...addressForm, full_address: e.target.value })}
                          placeholder="Jalan, No, RT/RW, Kelurahan, Kecamatan..."
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 block">Kota / Kab</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="Kota..."
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-700 mb-1 block">Provinsi</label>
                          <input
                            type="text"
                            value={addressForm.province}
                            onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                            placeholder="Provinsi..."
                            className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-700 mb-1 block">Google Maps Link</label>
                        <input
                          type="text"
                          value={addressForm.google_maps_url}
                          onChange={(e) => setAddressForm({ ...addressForm, google_maps_url: e.target.value })}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-2xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingAddress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Simpan Alamat</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* AI Enrichment Analysis Box */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 shrink-0">
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

                {/* 1-on-1 AI Outreach Action Footer */}
                <div className="pt-3.5 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ingin mengajukan penawaran personal berbasis analisis kebutuhan di atas?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEmailComposer(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Buat & Kirim Penawaran Email (AI)</span>
                  </button>
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
                    <input
                      type="text"
                      placeholder="Nomor Telepon / WhatsApp"
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                    />
                    <select
                      value={newContactRole}
                      onChange={e => setNewContactRole(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 sm:col-span-2"
                    >
                      <option value="Owner">Owner / Pemilik</option>
                      <option value="Founder">Founder / Co-Founder</option>
                      <option value="CEO">CEO / Managing Director</option>
                      <option value="Manager">Manager / Head of Dept</option>
                      <option value="IT">IT / Tech Lead</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="newContactIsPrimary"
                      checked={newContactIsPrimary}
                      onChange={e => setNewContactIsPrimary(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                    <label htmlFor="newContactIsPrimary" className="text-xs text-zinc-700 font-medium cursor-pointer">
                      Jadikan Kontak Bisnis Utama (otomatis sinkronkan email & nomor kontak ke profil bisnis)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
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
                      className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between shadow-xs gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5 flex-wrap">
                          <span>{ct.full_name}</span>
                          {(ct.is_primary === 1 || ct.is_primary === true) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Kontak Utama
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{ct.position || ct.role_category}</span>
                          {ct.email && <span className="font-mono text-zinc-700">• {ct.email}</span>}
                          {ct.phone && <span className="font-mono text-zinc-700">• {ct.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ct.email && (
                          <button
                            type="button"
                            onClick={() => {
                              setOutreachRecipientEmail(ct.email!);
                              setOutreachRecipientName(ct.full_name || company.name);
                              setOutreachContactId(ct.id);
                              handleOpenEmailComposer(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title={`Kirim email penawaran ke ${ct.full_name}`}
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>Email</span>
                          </button>
                        )}
                        {!(ct.is_primary === 1 || ct.is_primary === true) && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryContact(ct.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title="Jadikan kontak ini sebagai kontak utama perusahaan"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Jadikan Utama</span>
                          </button>
                        )}
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

      {/* 1-ON-1 AI EMAIL OUTREACH MODAL DIALOG */}
      {showEmailModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <span>Kirim Penawaran Personal (AI)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      1-on-1 Outreach
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Target: <strong>{company.name}</strong> &bull; Draf otomatis dirumuskan oleh Gemini AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
              {/* Context Needs & Recommendations pills */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-700">Fokus Kebutuhan & Rekomendasi:</span>
                  <button
                    type="button"
                    onClick={() => handleGenerateDraft()}
                    disabled={isGeneratingDraft}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingDraft ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingDraft ? 'Membuat Draf...' : 'Generate Ulang AI'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {potentialNeeds.slice(0, 3).map((need, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-700 text-[11px]">
                      🎯 {need}
                    </span>
                  ))}
                  {recommendedServices.slice(0, 2).map((srv, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                      ⭐ {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Angle selector pills */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                  Pilih Sudut Pandang Penawaran:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'general', label: '🌐 Solusi Website & Modernisasi' },
                    { id: 'catalog', label: '🛍️ Katalog Produk & Order Online' },
                    { id: 'hosting', label: '⚡ Cloud Hosting & Maintenance' },
                    { id: 'meeting', label: '🤝 Konsultasi Santai (15 Menit)' }
                  ].map(angle => (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => {
                        setSelectedAngle(angle.id);
                        handleGenerateDraft(angle.id);
                      }}
                      disabled={isGeneratingDraft}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        selectedAngle === angle.id
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {angle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Email Penerima <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={outreachRecipientEmail}
                    onChange={e => setOutreachRecipientEmail(e.target.value)}
                    placeholder="email@bisnis.com"
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                  {(company.email || contacts.length > 0) && (
                    <div className="mt-1 flex items-center gap-1 flex-wrap text-[10px]">
                      <span className="text-zinc-400">Pilih:</span>
                      {company.email && (
                        <button
                          type="button"
                          onClick={() => {
                            setOutreachRecipientEmail(company.email!);
                            setOutreachRecipientName(company.name);
                            setOutreachContactId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono cursor-pointer"
                        >
                          Utama
                        </button>
                      )}
                      {contacts.filter(c => c.email).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setOutreachRecipientEmail(c.email!);
                            setOutreachRecipientName(c.full_name || company.name);
                            setOutreachContactId(c.id);
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono cursor-pointer"
                        >
                          {c.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Nama Panggilan / Sapaan
                  </label>
                  <input
                    type="text"
                    value={outreachRecipientName}
                    onChange={e => setOutreachRecipientName(e.target.value)}
                    placeholder="Nama kontak atau nama usaha"
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="updateCompanyEmailOnSendModal"
                      checked={updateCompanyEmailOnSend}
                      onChange={e => setUpdateCompanyEmailOnSend(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                    <label htmlFor="updateCompanyEmailOnSendModal" className="text-[10px] text-zinc-500 cursor-pointer">
                      Simpan ke profil jika email utama kosong
                    </label>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Subjek Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={outreachSubject}
                  onChange={e => setOutreachSubject(e.target.value)}
                  placeholder="Subjek email penawaran..."
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Isi Pesan Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={10}
                    required
                    value={outreachMessage}
                    onChange={e => setOutreachMessage(e.target.value)}
                    placeholder="Ketik pesan atau klik Generate Ulang AI..."
                    className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl text-xs leading-relaxed text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans shadow-2xs resize-y"
                  />
                  {isGeneratingDraft && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-xl flex flex-col items-center justify-center space-y-2 z-10">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold text-zinc-800">
                        Gemini AI sedang merancang draf penawaran...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] text-zinc-500 leading-relaxed">
                Dikirim resmi dari <code className="font-mono text-zinc-800">info@1slabs.my.id</code> dengan kop resmi 1sLabs, tombol jadwal online meeting, kontak WhatsApp, dan tautan unsubscribe.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                <span>Preview Email</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendDirectEmail}
                  disabled={isSendingEmail || isGeneratingDraft || !outreachRecipientEmail.trim() || !outreachSubject.trim() || !outreachMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                  <span>{isSendingEmail ? 'Mengirim...' : 'Kirim Email Penawaran'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Visual Preview Modal Overlay */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Window Titlebar (macOS Style) */}
            <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/90 select-none">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
                </div>
                <div className="h-4 w-px bg-zinc-200" />
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-900 tracking-tight">Pratinjau Desain Email Resmi 1sLabs</span>
                  <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Live Render
                  </span>
                </div>
              </div>

              {/* Center/Right Toolbar */}
              <div className="flex items-center gap-2">
                {/* Device Selector Switcher */}
                <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-xl border border-zinc-300/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  title="Salin isi pesan"
                >
                  {copiedMessage ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  title="Tutup pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Client Simulated Header (Apple Mail / Superhuman Style) */}
            <div className="px-6 py-3.5 bg-white border-b border-zinc-200/80 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <img
                      src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                      alt="1sLabs Icon"
                      className="h-full w-full object-contain"
                      onError={(e: any) => {
                        e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900">1sLabs Technology Studio</span>
                      <span className="text-[10px] font-mono text-zinc-500">&lt;info@1slabs.my.id&gt;</span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> DKIM & SPF Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      Kepada: <strong className="text-zinc-800 font-medium">{outreachRecipientName || company?.name}</strong> &bull; <span className="font-mono text-zinc-600">{outreachRecipientEmail || '(Belum ditentukan)'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                  Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>

              {/* Subject banner */}
              <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                  Subjek:
                </span>
                <span className="text-xs font-bold text-zinc-900 truncate">
                  {outreachSubject || '(Subjek belum diisi)'}
                </span>
              </div>
            </div>

            {/* Canvas Area: Background Soft Gray with Centered Paper */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
              <div
                className={`w-full transition-all duration-300 ease-in-out ${
                  previewDevice === 'mobile' ? 'max-w-[360px]' : 'max-w-[620px]'
                }`}
              >
                {/* The Official Email Paper (matches wrapHtmlEmail in email.service.js) */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                  
                  {/* Clean Minimalist Brand Header with Official Logo Image */}
                  <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                    <div className="flex items-center">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Official Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                      Official Proposal
                    </span>
                  </div>

                  {/* Body Content Area */}
                  <div className="p-6 sm:p-8 space-y-5">
                    {renderFormattedEmailContent(outreachMessage)}

                    {/* Official Call To Action Button (Matches wrapHtmlEmail pure dark button) */}
                    <div className="pt-5 border-t border-zinc-100">
                      <div className="text-left">
                        <a
                          href="https://1slabs.my.id/schedule"
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.preventDefault()}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold tracking-tight shadow-md transition-all cursor-pointer group"
                        >
                          <span>Jadwalkan Diskusi / Online Meeting</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 font-sans">
                        Pilih tanggal & waktu yang cocok untuk Anda. Sesi santai 15 menit tanpa komitmen apa pun.
                      </p>
                    </div>

                    {/* Security & Authenticity Notice */}
                    <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-600 leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pemberitahuan Keamanan Resmi:</span>
                      </div>
                      <p className="text-zinc-500 text-[10.5px]">
                        Email ini dikirimkan melalui server berotentikasi resmi 1sLabs. Kami tidak pernah meminta kata sandi atau kredensial rahasia apa pun melalui korespondensi email.
                      </p>
                    </div>
                  </div>

                  {/* Clean Monochrome Footer */}
                  <div className="px-6 py-5 bg-zinc-50/70 border-t border-zinc-100 text-center text-zinc-500 text-[10px] space-y-1.5 leading-relaxed font-sans">
                    <p className="font-bold text-zinc-800 text-xs">
                      1sLabs &bull; Software Engineering & Cloud Solutions
                    </p>
                    <p className="text-zinc-500">
                      Bandung, Jawa Barat, Indonesia &bull; WhatsApp: +62 851-5629-6580 &bull; <a href="https://1slabs.my.id" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline font-medium">https://1slabs.my.id</a>
                    </p>
                    <p className="text-zinc-400 pt-1 text-[9.5px]">
                      Anda menerima penawaran ini berdasarkan kontak bisnis terdaftar Anda. Jika tidak berkenan menerima korespondensi di masa mendatang, silakan <span className="underline text-zinc-500 cursor-pointer">Berhenti Berlangganan (Unsubscribe)</span>.
                    </p>
                    <p className="text-zinc-400 font-mono text-[9px] pt-0.5">
                      &copy; {new Date().getFullYear()} 1sLabs. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Desain pratinjau 100% presisi sesuai email yang diterima prospek.</span>
                <span className="sm:hidden">Presisi standar 1sLabs</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Tutup Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleSendDirectEmail();
                  }}
                  disabled={isSendingEmail || !outreachRecipientEmail.trim() || !outreachSubject.trim() || !outreachMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                  <span>Kirim Email Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
