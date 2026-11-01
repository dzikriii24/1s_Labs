import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, MessageCircle, Instagram, Globe, Plus, AlertCircle } from 'lucide-react';
import { api, MarketingContact } from '../../../../services/api';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  onContactAdded: (contact: MarketingContact) => void;
}

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
  'General Contact Person',
  'Other'
];

const CONTACT_TYPES = [
  { value: 'person', label: 'Orang / Kontak Personal', icon: UserPlus },
  { value: 'whatsapp', label: 'WhatsApp Bisnis', icon: MessageCircle },
  { value: 'email', label: 'Email Bisnis', icon: Mail },
  { value: 'phone', label: 'Nomor Telepon Kantor/Toko', icon: Phone },
  { value: 'instagram', label: 'Instagram Handle / URL', icon: Instagram },
  { value: 'website', label: 'Website / Halaman Kontak', icon: Globe }
];

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onContactAdded
}) => {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('Owner / Pengelola');
  const [roleCategory, setRoleCategory] = useState('Owner');
  const [contactType, setContactType] = useState('person');
  const [contactValue, setContactValue] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('Verified');
  const [outreachEligible, setOutreachEligible] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName && !email && !phone && !contactValue) {
      setError('Minimal isi nama, email, nomor telepon, atau nilai kontak.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<MarketingContact> = {
        full_name: fullName.trim() || contactValue.trim() || companyName,
        position: position.trim() || 'Representative',
        role_category: roleCategory,
        contact_type: contactType,
        contact_value: contactValue.trim() || email.trim() || phone.trim() || fullName.trim(),
        email: email.trim() || (contactType === 'email' ? contactValue.trim() : null),
        phone: phone.trim() || (contactType === 'whatsapp' || contactType === 'phone' ? contactValue.trim() : null),
        source_url: sourceUrl.trim() || undefined,
        source_name: 'Manual Admin Entry',
        verification_status: verificationStatus,
        outreach_eligible: outreachEligible ? 1 : 0,
        is_primary: isPrimary ? 1 : 0,
        notes: notes.trim() || undefined
      };

      const res = await api.marketing.addCompanyContact(companyId, payload);
      if (res.success && res.data) {
        onContactAdded(res.data);
        onClose();
      } else {
        setError(res.message || 'Gagal menambahkan kontak.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-3 mb-4">
          <div>
            <h4 className="text-base font-bold text-zinc-900">Tambah Kontak Baru</h4>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium truncate max-w-sm">
              Bisnis: <strong className="text-zinc-800">{companyName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Contact Type Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Jenis Kontak</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CONTACT_TYPES.map(t => {
                const Icon = t.icon;
                const isSelected = contactType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setContactType(t.value)}
                    className={`p-2 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{t.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Name & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Nama Kontak / Person</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Kang Asep / Admin Order"
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Peran / Jabatan</label>
              <select
                value={roleCategory}
                onChange={e => {
                  setRoleCategory(e.target.value);
                  setPosition(e.target.value);
                }}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Value (Email / Phone / WhatsApp / Handle) */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Nilai Kontak (Nomor WA / Email / Handle / Link)
            </label>
            <input
              type="text"
              value={contactValue}
              onChange={e => {
                setContactValue(e.target.value);
                if (e.target.value.includes('@')) setEmail(e.target.value);
                if (/^(\+62|08|[0-9])/.test(e.target.value)) setPhone(e.target.value);
              }}
              placeholder={
                contactType === 'whatsapp' ? '08123456789 atau +6281...' :
                contactType === 'email' ? 'order@nama-usaha.com' :
                contactType === 'instagram' ? '@akunbisnis atau url' :
                'Nomor, email, atau tautan kontak'
              }
              className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Status Verifikasi</label>
              <select
                value={verificationStatus}
                onChange={e => setVerificationStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                <option value="Verified">Verified (Terverifikasi)</option>
                <option value="Likely Correct">Likely Correct (Kemungkinan Benar)</option>
                <option value="Unverified">Unverified (Belum Diverifikasi)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Sumber Kontak (URL)</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://instagram.com/... atau website"
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Catatan Internal Kontak</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Nomor WhatsApp untuk pemesanan langsung, fast response"
              className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={outreachEligible}
                onChange={e => setOutreachEligible(e.target.checked)}
                className="rounded text-zinc-900 focus:ring-zinc-500 cursor-pointer"
              />
              <span>Layak Kirim Outreach Email / Penawaran</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={e => setIsPrimary(e.target.checked)}
                className="rounded text-zinc-900 focus:ring-zinc-500 cursor-pointer"
              />
              <span>Jadikan Kontak Utama</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kontak'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

