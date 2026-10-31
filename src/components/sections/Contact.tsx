import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Instagram,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Send,
  User,
  Phone,
  Building2,
  Globe,
  Sparkles,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import notify from '../../lib/notify';

interface ContactMethod {
  icon: React.ElementType;
  title: string;
  badge: string;
  handle: string;
  href: string;
  cta: string;
  highlight?: boolean;
}

const contactMethods: ContactMethod[] = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Hotline',
    badge: 'Respon Cepat < 15 Menit',
    handle: '+62 851-5629-6580',
    href: 'https://wa.me/6285156296580?text=Halo%201sLabs%2C%20saya%20ingin%20konsultasi%20mengenai%20layanan%20teknologi.',
    cta: 'Chat Langsung di WhatsApp',
    highlight: true
  },
  {
    icon: Mail,
    title: 'Email Bisnis',
    badge: 'Inquiries & Proposal',
    handle: 'info@1slabs.my.id',
    href: 'mailto:info@1slabs.my.id?subject=Konsultasi%20Proyek%201sLabs',
    cta: 'Kirim Pesan Email'
  },
  {
    icon: Instagram,
    title: 'Instagram Resmi',
    badge: 'Portofolio & Update',
    handle: '@1slabs.id',
    href: 'https://instagram.com/1slabs.id',
    cta: 'Ikuti Kami di Instagram'
  }
];

const quickTopics = [
  { label: 'Pembuatan Website', msg: 'Halo 1sLabs, saya ingin membuat website profesional untuk bisnis saya.' },
  { label: 'Website Maintenance', msg: 'Halo 1sLabs, saya ingin mengajukan perawatan tahunan & perbaikan untuk website saya.' },
  { label: 'Custom Software / Web App', msg: 'Halo 1sLabs, saya membutuhkan custom software / web app untuk alur kerja perusahaan.' },
  { label: 'Cloud Hosting & Domain', msg: 'Halo 1sLabs, saya ingin berlangganan paket managed cloud hosting tahunan.' },
  { label: 'Konsultasi IT Gratis', msg: 'Halo 1sLabs, saya ingin konsultasi teknis gratis dan minta estimasi biaya proyek.' }
];

export const Contact = () => {
  // Form state
  const [inquiryType, setInquiryType] = useState<string>('consultation');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      notify.warning('Nama, email, dan pesan kebutuhan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.inquiries.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        inquiry_type: inquiryType,
        current_website_url: websiteUrl.trim() || undefined,
        budget_range: budgetRange || undefined,
        message: message.trim()
      });

      if (res.success) {
        setSubmitted(true);
        notify.success(
          'Permintaan konsultasi / inquiry Anda telah tersimpan. Engineer 1sLabs akan menghubungi Anda segera!',
          'Inquiry Terkirim'
        );
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setWebsiteUrl('');
        setMessage('');
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengirimkan inquiry. Silakan gunakan WhatsApp hotline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative antialiased bg-white dark:bg-gray-900 font-sans py-10 sm:py-16 md:py-20 px-3 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Judul Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white font-['Mori',_sans-serif] mb-2 sm:mb-4">
            Diskusikan Kebutuhan Digital Anda.
          </h2>

          <p className="text-xs sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed px-2">
            Ingin membuat website baru, butuh perawatan tahunan untuk sistem existing, atau ingin berkonsultasi mengenai arsitektur cloud? Tim engineer 1sLabs siap mendengarkan.
          </p>
        </motion.div>

        {/* 2-Column: Left Contact Cards, Right Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Direct Contact & Quick Topics (5 cols) */}
          <div className="lg:col-span-5 space-y-4">

            <div className="space-y-3">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <a
                    key={method.title}
                    href={method.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 border flex items-center justify-between ${
                      method.highlight
                        ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40 dark:from-neutral-900 dark:to-blue-950/30 border-blue-400/50 dark:border-blue-700/50 shadow-sm hover:border-blue-500'
                        : 'bg-white dark:bg-neutral-900/60 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
                    }`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          method.highlight
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                              {method.title}
                            </h4>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              {method.badge}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {method.handle}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Quick WhatsApp Topics */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 mt-4">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                Template Pertanyaan Cepat WhatsApp
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
                Pilih topik di bawah untuk membuka chat dengan pertanyaan terstruktur:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const url = `https://wa.me/6285156296580?text=${encodeURIComponent(topic.msg)}`;
                      window.open(url, '_blank');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium transition-all shadow-2xs hover:border-blue-400 cursor-pointer"
                  >
                    {topic.label} &rarr;
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Jaminan Kerahasiaan (NDA):</strong> Seluruh ide, dokumen bisnis, dan kredensial teknis yang Anda bagikan dijaga kerahasiaannya dan tidak dipublikasikan ke pihak ketiga.
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Consultation & Maintenance Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-['Mori',_sans-serif]">
                  <Send className="w-5 h-5 text-indigo-600" />
                  Formulir Konsultasi & Permintaan Layanan
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Kirimkan rincian kebutuhan proyek atau website Anda. Data akan langsung terhubung ke database dan ditinjau tim teknis 1sLabs.
                </p>
              </div>

              {submitted ? (
                <div className="p-8 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    Inquiry Berhasil Terkirim!
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    Terima kasih telah mempercayakan kebutuhan Anda kepada 1sLabs. Tim konsultan kami akan menghubungi Anda melalui email atau WhatsApp dalam kurun waktu kurang dari 24 jam kerja.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Kirim Inquiry Lainnya
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  {/* Select Service Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Pilih Jenis Kebutuhan Layanan *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'consultation', label: 'Konsultasi IT Gratis' },
                        { id: 'website_development', label: 'Pembuatan Website' },
                        { id: 'website_maintenance', label: 'Maintenance Website' },
                        { id: 'custom_software', label: 'Custom Web App' },
                        { id: 'hosting', label: 'Hosting & Domain' },
                        { id: 'other', label: 'Kebutuhan Lainnya' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setInquiryType(type.id)}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                            inquiryType === type.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nama Lengkap *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="cth. Budi Pratama"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Alamat Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="cth. budi@perusahaan.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone & Company Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nomor WhatsApp / HP
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="cth. 081234567890"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nama Bisnis / Instansi (Opsional)
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="cth. PT Sinergi Nusantara"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Existing Website & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Website Yang Sudah Ada (Jika Ada)
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="cth. https://perusahaanlama.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Estimasi Budget (Opsional)
                      </label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Pilih Rentang Biaya</option>
                        <option value="< Rp 2 Juta">&lt; Rp 2.000.000</option>
                        <option value="Rp 2 - 5 Juta">Rp 2.000.000 - Rp 5.000.000</option>
                        <option value="Rp 5 - 15 Juta">Rp 5.000.000 - Rp 15.000.000</option>
                        <option value="> Rp 15 Juta">&gt; Rp 15.000.000 (Custom Enterprise)</option>
                        <option value="Fleksibel / Sesuai Assessment">Fleksibel / Sesuai Hasil Assessment</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Deskripsi Kebutuhan & Ekspektasi Proyek *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Jelaskan secara ringkas fitur apa saja yang Anda butuhkan, permasalahan pada website lama jika ada, atau kendala teknis yang ingin diselesaikan..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirimkan Inquiry ke Database...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Permintaan Konsultasi & Estimasi</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Contact;
