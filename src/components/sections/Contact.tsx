import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Calendar,
  CalendarCheck,
  Video,
  FileText
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

const AVAILABLE_TIME_SLOTS = [
  '09:30 - 10:30 WIB',
  '11:00 - 12:00 WIB',
  '13:30 - 14:30 WIB',
  '15:00 - 16:00 WIB',
  '16:30 - 17:30 WIB',
  '19:30 - 20:30 WIB'
];

export const Contact = () => {
  // Mode Tab: 'meeting' (default for outreach clicks) vs 'inquiry'
  const [activeTab, setActiveTab] = useState<'meeting' | 'inquiry'>('meeting');

  // Inquiry Form state
  const [inquiryType, setInquiryType] = useState<string>('consultation');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState(false);

  // Meeting Form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [meetingDate, setMeetingDate] = useState(tomorrowStr);
  const [meetingTime, setMeetingTime] = useState(AVAILABLE_TIME_SLOTS[0]);
  const [meetingContactPerson, setMeetingContactPerson] = useState('');
  const [meetingCompany, setMeetingCompany] = useState('');
  const [meetingEmail, setMeetingEmail] = useState('');
  const [meetingPhone, setMeetingPhone] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('Google Meet');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [submittedMeetingData, setSubmittedMeetingData] = useState<any>(null);

  // Auto-detect URL hash or search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      if (search.get('action') === 'inquiry' || search.get('tab') === 'inquiry') {
        setActiveTab('inquiry');
      } else {
        // Default to meeting scheduler for email CTA visitors
        setActiveTab('meeting');
      }
      if (search.get('company')) setMeetingCompany(search.get('company') || '');
      if (search.get('email')) setMeetingEmail(search.get('email') || '');
      if (search.get('contact')) setMeetingContactPerson(search.get('contact') || '');
    }
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      notify.warning('Nama, email, dan pesan kebutuhan wajib diisi.');
      return;
    }

    setSubmittingInquiry(true);
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
        setSubmittedInquiry(true);
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
      setSubmittingInquiry(false);
    }
  };

  const handleSubmitMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingContactPerson.trim()) {
      notify.error('Nama kontak person wajib diisi.');
      return;
    }
    if (!meetingEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(meetingEmail.trim())) {
      notify.error('Alamat email valid wajib diisi.');
      return;
    }
    if (!meetingDate) {
      notify.error('Silakan tentukan tanggal meeting.');
      return;
    }
    if (!meetingTime) {
      notify.error('Silakan pilih jam meeting.');
      return;
    }

    setSubmittingMeeting(true);
    try {
      const res = await api.meetings.schedule({
        company_name: meetingCompany.trim() || undefined,
        contact_person: meetingContactPerson.trim(),
        email: meetingEmail.trim(),
        phone: meetingPhone.trim() || undefined,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        platform: meetingPlatform,
        notes: meetingNotes.trim() || undefined
      });

      if (res.success) {
        setSubmittedMeetingData({
          companyName: meetingCompany,
          contactPerson: meetingContactPerson,
          email: meetingEmail,
          meetingDate,
          meetingTime,
          platform: meetingPlatform
        });
        notify.success(
          'Jadwal diskusi Anda telah terdaftar. Kami telah mengirimkan konfirmasi ke email Anda!',
          'Jadwal Diskusi Dikonfirmasi'
        );
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menjadwalkan meeting. Silakan coba kembali.');
    } finally {
      setSubmittingMeeting(false);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Respon Cepat Tim Engineer 1sLabs</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white font-['Mori',_sans-serif] mb-2 sm:mb-4">
            Diskusikan Kebutuhan Digital Anda.
          </h2>

          <p className="text-xs sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed px-2">
            Ingin membuat website baru, butuh perawatan tahunan untuk sistem existing, atau mengatur meeting online bersama engineer 1sLabs? Kami siap membantu.
          </p>
        </motion.div>

        {/* 2-Column: Left Contact Cards, Right Form (Meeting & Inquiry Tabs) */}
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

          {/* Right Column: Tabbed Forms (Meeting Scheduler & Inquiry) (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('meeting')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'meeting'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Jadwalkan Diskusi / Meeting</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inquiry')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'inquiry'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan / Inquiry</span>
                </button>
              </div>

              {/* TAB 1: MEETING SCHEDULER */}
              {activeTab === 'meeting' && (
                <div>
                  <div className="mb-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 font-['Mori',_sans-serif]">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Pilih Tanggal & Jam Online Meeting
                      </h3>
                      <a
                        href="/schedule"
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        Buka Halaman Penuh &rarr;
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Pilih waktu yang nyaman bagi Anda untuk berdiskusi langsung dengan technical lead 1sLabs.
                    </p>
                  </div>

                  {submittedMeetingData ? (
                    <div className="p-6 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                        Jadwal Diskusi Berhasil Dibuat!
                      </h4>
                      <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                        Terima kasih, <strong>{submittedMeetingData.contactPerson}</strong>. Pertemuan dijadwalkan pada <strong>{submittedMeetingData.meetingDate}</strong> jam <strong>{submittedMeetingData.meetingTime}</strong> via {submittedMeetingData.platform}.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 justify-center">
                        <a
                          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Diskusi Proyek 1sLabs - ${submittedMeetingData.companyName || submittedMeetingData.contactPerson}`)}&dates=${submittedMeetingData.meetingDate.replace(/-/g, '')}T093000Z/${submittedMeetingData.meetingDate.replace(/-/g, '')}T103000Z&details=${encodeURIComponent(`Online meeting via ${submittedMeetingData.platform}. Kontak: ${submittedMeetingData.email}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Simpan ke Google Calendar</span>
                        </a>
                        <button
                          onClick={() => setSubmittedMeetingData(null)}
                          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          Buat Jadwal Baru
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitMeeting} className="space-y-4">
                      {/* Contact Person & Company */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nama Kontak Person *
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              required
                              value={meetingContactPerson}
                              onChange={(e) => setMeetingContactPerson(e.target.value)}
                              placeholder="cth. Budi Setiawan"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nama Perusahaan / Bisnis (Opsional)
                          </label>
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={meetingCompany}
                              onChange={(e) => setMeetingCompany(e.target.value)}
                              placeholder="cth. Adrie Basuki Batik"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Alamat Email *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                              type="email"
                              required
                              value={meetingEmail}
                              onChange={(e) => setMeetingEmail(e.target.value)}
                              placeholder="cth. contact@perusahaan.com"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nomor WhatsApp / HP
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={meetingPhone}
                              onChange={(e) => setMeetingPhone(e.target.value)}
                              placeholder="cth. 081234567890"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Meeting Date & Platform */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Tanggal Diskusi *
                          </label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <input
                              type="date"
                              required
                              min={tomorrowStr}
                              value={meetingDate}
                              onChange={(e) => setMeetingDate(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Platform Diskusi
                          </label>
                          <div className="relative">
                            <Video className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            <select
                              value={meetingPlatform}
                              onChange={(e) => setMeetingPlatform(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                            >
                              <option value="Google Meet">Google Meet (Rekomendasi)</option>
                              <option value="Zoom Meeting">Zoom Meeting</option>
                              <option value="WhatsApp Video Call">WhatsApp Video Call</option>
                              <option value="Offline / Tatap Muka">Offline / Tatap Muka (Bandung & Sekitarnya)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                          Pilih Jam Diskusi *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {AVAILABLE_TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setMeetingTime(slot)}
                              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                meetingTime === slot
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{slot.replace(' WIB', '')}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Catatan / Kebutuhan Diskusi (Notes)
                        </label>
                        <textarea
                          rows={3}
                          value={meetingNotes}
                          onChange={(e) => setMeetingNotes(e.target.value)}
                          placeholder="cth. Ingin membahas rencana redesign website toko online & penawaran hosting tahunan..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingMeeting}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingMeeting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mendaftarkan Jadwal Pertemuan...</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck className="w-4 h-4" />
                            <span>Konfirmasi Jadwal Online Meeting</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: INQUIRY FORM */}
              {activeTab === 'inquiry' && (
                <div>
                  <div className="mb-5">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 font-['Mori',_sans-serif]">
                      <Send className="w-5 h-5 text-indigo-600" />
                      Formulir Konsultasi & Permintaan Layanan
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Kirimkan rincian kebutuhan proyek atau website Anda. Data akan langsung ditinjau oleh tim teknis 1sLabs.
                    </p>
                  </div>

                  {submittedInquiry ? (
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
                        onClick={() => setSubmittedInquiry(false)}
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
                        disabled={submittingInquiry}
                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingInquiry ? (
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
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Contact;

