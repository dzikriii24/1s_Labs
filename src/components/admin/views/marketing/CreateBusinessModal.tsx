import React, { useState } from 'react';
import { X, Store, Globe, MapPin, Phone, Mail, Instagram, MessageCircle, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { api, MarketingCompany } from '../../../../services/api';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (company: MarketingCompany) => void;
  defaultCountry?: string;
  defaultScope?: 'indonesia' | 'international';
}

const INDONESIA_CATEGORIES = [
  'Coffee Shop',
  'Cafe',
  'Restaurant',
  'UMKM Kuliner',
  'Bakery & Toko Kue',
  'Laundry',
  'Barbershop',
  'Salon Kecantikan',
  'Toko Pakaian & Fashion',
  'Online Shop',
  'Toko Retail & Grosir',
  'Toko Oleh-oleh',
  'Usaha Kerajinan & Kriya',
  'Toko Kosmetik',
  'Catering',
  'Homestay & Guest House',
  'Travel Agent Lokal',
  'Rental Kendaraan',
  'Bengkel & Otomotif',
  'Studio Foto',
  'Percetakan',
  'Kursus & Bimbel',
  'Jasa Lokal Lainnya'
];

const INTERNATIONAL_CATEGORIES = [
  'Coffee Shop',
  'Local Restaurant',
  'Bakery & Pastry',
  'Small Online Store',
  'Boutique Clothing',
  'Beauty Salon',
  'Barbershop',
  'Small Hotel & Guest House',
  'Local Tourism & Tour',
  'Small Creative Agency',
  'Local Service Business',
  'E-commerce Brand'
];

const BUSINESS_SCALES = [
  'Micro Business',
  'Small Business',
  'Local Business',
  'Home Business',
  'Online Business',
  'Growing Business',
  'Other'
];

const TARGET_CITIES_ID = [
  'Bandung',
  'Cimahi',
  'Kab. Bandung',
  'Bandung Barat',
  'Sumedang',
  'Garut',
  'Cianjur',
  'Sukabumi',
  'Bogor',
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Tangerang',
  'Bekasi',
  'Depok',
  'Semarang',
  'Surabaya',
  'Yogyakarta',
  'Denpasar',
  'Medan',
  'Makassar'
];

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultCountry = 'Indonesia',
  defaultScope = 'indonesia'
}) => {
  const isIntl = defaultScope === 'international' || (defaultCountry !== 'Indonesia' && defaultCountry !== '');

  const [name, setName] = useState('');
  const [category, setCategory] = useState(isIntl ? 'Coffee Shop' : 'Coffee Shop');
  const [businessScale, setBusinessScale] = useState('Small Business');
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity] = useState(isIntl ? 'Kuala Lumpur' : 'Bandung');
  const [province, setProvince] = useState(isIntl ? '' : 'Jawa Barat');
  const [fullAddress, setFullAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [tags, setTags] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama bisnis wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate small business lead score
      let score = 50;
      if (!websiteUrl) score += 25;
      if (instagramUrl) score += 15;
      if (whatsappNumber || phone) score += 10;

      const payload: Partial<MarketingCompany> = {
        name: name.trim(),
        category,
        business_type: 'Local Business',
        business_scale: businessScale,
        industry: category,
        description: description.trim() || undefined,
        country: country.trim() || 'Indonesia',
        is_international: country.toLowerCase() !== 'indonesia',
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        full_address: fullAddress.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        lead_score: Math.min(score, 100),
        status: 'New Discovery',
        outreach_eligibility: email.trim() ? 'eligible' : 'ineligible',
        is_priority: isPriority ? 1 : 0,
        tags: tags.trim() || undefined
      };

      const res = await api.marketing.createCompany(payload);
      if (res.success && res.data) {
        onCreated(res.data);
        onClose();
      } else {
        setError(res.message || 'Gagal menambahkan bisnis.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-white">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {isIntl ? 'Tambah International Small Business' : 'Tambah Bisnis Lokal & UMKM'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Input data usaha kecil baru secara manual ke database marketing 1sLabs.
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Scale */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Nama Bisnis / Brand <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Kopi Kulo, Barberbox, Warung Sambal Dadak"
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Skala Usaha</label>
              <select
                value={businessScale}
                onChange={e => setBusinessScale(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                {BUSINESS_SCALES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category & Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Kategori Usaha</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                {(isIntl ? INTERNATIONAL_CATEGORIES : INDONESIA_CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Negara</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Indonesia, Malaysia, Singapore, etc."
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Row 3: City & Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Kota / Wilayah</label>
              {!isIntl ? (
                <div className="relative">
                  <input
                    type="text"
                    list="target-cities-list"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Bandung"
                    className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <datalist id="target-cities-list">
                    {TARGET_CITIES_ID.map(tc => (
                      <option key={tc} value={tc} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Kuala Lumpur, Melbourne, London"
                  className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Provinsi / State</label>
              <input
                type="text"
                value={province}
                onChange={e => setProvince(e.target.value)}
                placeholder="e.g. Jawa Barat, DKI Jakarta, Victoria"
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Row 4: Contacts (WhatsApp, Phone, Email) */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block">
              Informasi Kontak Langsung
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Bisnis
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 08122334455 / +6281..."
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Bisnis
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. order@kopikulo.com"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 mb-1">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" /> Akun Instagram
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  placeholder="e.g. @kopikulo atau url"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-zinc-600" /> Website Resmi (jika ada)
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Address & Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Alamat Fisik / Cabang</label>
            <input
              type="text"
              value={fullAddress}
              onChange={e => setFullAddress(e.target.value)}
              placeholder="Jl. Progo No. 15, Citarum, Bandung"
              className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Deskripsi Singkat Usaha</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Artisan coffee bar & roastery favorit komunitas lokal..."
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Tags / Label Tambahan</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="kuliner, dago, kopi specialty, dine-in"
                className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-priority"
                  checked={isPriority}
                  onChange={e => setIsPriority(e.target.checked)}
                  className="rounded text-zinc-900 focus:ring-zinc-500 cursor-pointer"
                />
                <label htmlFor="chk-priority" className="text-xs text-zinc-700 cursor-pointer select-none">
                  Tandai sebagai <strong>Bisnis Prioritas (⭐ Priority Target)</strong>
                </label>
              </div>
            </div>
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
              <span>{isSubmitting ? 'Menyimpan Bisnis...' : 'Simpan Bisnis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

