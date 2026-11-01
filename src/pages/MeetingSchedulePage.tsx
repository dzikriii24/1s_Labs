import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Globe,
  HelpCircle,
  CalendarCheck
} from 'lucide-react';
import { api } from '../services/api';
import notify from '../lib/notify';

const AVAILABLE_TIME_SLOTS = [
  '09:30 - 10:30 WIB',
  '11:00 - 12:00 WIB',
  '13:30 - 14:30 WIB',
  '15:00 - 16:00 WIB',
  '16:30 - 17:30 WIB',
  '19:30 - 20:30 WIB'
];

export const MeetingSchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Detect language or params
  const langParam = searchParams.get('lang') || 'id';
  const [isEnglish, setIsEnglish] = useState(langParam === 'en');

  // Query pre-fills from email CTA
  const companyQuery = searchParams.get('company') || '';
  const emailQuery = searchParams.get('email') || '';
  const contactQuery = searchParams.get('contact') || '';
  const campaignQuery = searchParams.get('campaign') || searchParams.get('cid') || '';

  // Form State
  const [companyName, setCompanyName] = useState(companyQuery);
  const [contactPerson, setContactPerson] = useState(contactQuery);
  const [email, setEmail] = useState(emailQuery);
  const [phone, setPhone] = useState('');
  
  // Date State (default tomorrow or today + 1 day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const [meetingDate, setMeetingDate] = useState(tomorrowStr);
  const [meetingTime, setMeetingTime] = useState(AVAILABLE_TIME_SLOTS[0]);
  const [platform, setPlatform] = useState('Google Meet');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Sync if query params change
  useEffect(() => {
    if (companyQuery && !companyName) setCompanyName(companyQuery);
    if (emailQuery && !email) setEmail(emailQuery);
    if (contactQuery && !contactPerson) setContactPerson(contactQuery);
  }, [companyQuery, emailQuery, contactQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactPerson.trim()) {
      notify.error(isEnglish ? 'Contact person name is required.' : 'Nama kontak person wajib diisi.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      notify.error(isEnglish ? 'Valid email address is required.' : 'Alamat email valid wajib diisi.');
      return;
    }
    if (!meetingDate) {
      notify.error(isEnglish ? 'Please select a meeting date.' : 'Silakan pilih tanggal meeting.');
      return;
    }
    if (!meetingTime) {
      notify.error(isEnglish ? 'Please select a meeting time slot.' : 'Silakan pilih jam meeting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.meetings.schedule({
        company_name: companyName.trim() || undefined,
        contact_person: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        platform,
        notes: notes.trim() || undefined,
        source_campaign_id: campaignQuery ? parseInt(campaignQuery, 10) : undefined
      });

      if (res.success) {
        setSubmittedData({
          id: res.scheduleId,
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim(),
          phone: phone.trim(),
          meetingDate,
          meetingTime,
          platform,
          notes: notes.trim()
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        notify.error(res.message || (isEnglish ? 'Failed to schedule meeting.' : 'Gagal menjadwalkan meeting.'));
      }
    } catch (err: any) {
      notify.error(err.message || (isEnglish ? 'Connection error. Please try again.' : 'Terjadi gangguan koneksi.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Google Calendar Link generator
  const getGoogleCalendarUrl = () => {
    if (!submittedData) return '#';
    const title = encodeURIComponent(`1sLabs Online Meeting with ${submittedData.companyName || submittedData.contactPerson}`);
    const details = encodeURIComponent(`Sesi diskusi pengembangan website & teknologi bersama 1sLabs.\n\nPlatform: ${submittedData.platform}\nContact Person: ${submittedData.contactPerson}\nCatatan: ${submittedData.notes || '-'}`);
    
    // Parse Date & Time
    const startTimeClean = submittedData.meetingTime.split(' - ')[0].replace(':', '') + '00';
    const endTimeClean = submittedData.meetingTime.split(' - ')[1]?.split(' ')[0]?.replace(':', '') + '00' || '110000';
    const dateFormatted = submittedData.meetingDate.replace(/-/g, '');
    
    const dates = `${dateFormatted}T${startTimeClean}/${dateFormatted}T${endTimeClean}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white transition-colors">
      <Helmet>
        <title>
          {isEnglish
            ? 'Schedule an Online Discussion & Strategy Session — 1sLabs'
            : 'Jadwalkan Diskusi & Online Meeting — 1sLabs Engineering'}
        </title>
        <meta
          name="description"
          content="Jadwalkan sesi konsultasi dan diskusi teknologi bersama tim 1sLabs. Konsultasi kebutuhan website, sistem bisnis, dan cloud hosting tanpa biaya."
        />
      </Helmet>

      {/* Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <img
              src="https://1slabs.my.id/logo-1slabs.png"
              alt="1sLabs Official"
              className="h-8 w-auto object-contain"
              onError={(e: any) => {
                e.target.src = '/logo-1slabs.png';
              }}
            />
            <span className="font-bold text-sm tracking-tight hidden sm:inline-block">
              1sLabs <span className="text-emerald-700 dark:text-emerald-500 font-mono text-xs ml-1">Engineering</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEnglish(!isEnglish)}
              className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEnglish ? 'ID (Bahasa)' : 'EN (English)'}</span>
            </button>
            <Link
              to="/"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEnglish ? 'Back to Home' : 'Kembali ke Web'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 w-full flex-1">
        {submittedData ? (
          /* Success Screen */
          <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {isEnglish ? 'Meeting Schedule Confirmed!' : 'Jadwal Diskusi Berhasil Dikonfirmasi!'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                {isEnglish
                  ? `Thank you, ${submittedData.contactPerson}. We have reserved your online discussion slot. Confirmation details have been emailed to ${submittedData.email}.`
                  : `Terima kasih, ${submittedData.contactPerson}. Sesi diskusi online Anda telah tercatat di agenda tim 1sLabs. Notifikasi konfirmasi telah dikirimkan ke ${submittedData.email}.`}
              </p>
            </div>

            {/* Appointment Details Box */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700/60 text-xs">
                <span className="text-zinc-500">{isEnglish ? 'Booking ID' : 'Kode Reservasi'}</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">#MTG-{submittedData.id}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 block">{isEnglish ? 'Date' : 'Tanggal Meeting'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {submittedData.meetingDate}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{isEnglish ? 'Time Slot' : 'Waktu / Jam'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {submittedData.meetingTime}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{isEnglish ? 'Platform' : 'Platform Diskusi'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                    {submittedData.platform}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{isEnglish ? 'Contact Person' : 'Kontak Person'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-600" />
                    {submittedData.contactPerson} {submittedData.companyName ? `(${submittedData.companyName})` : ''}
                  </span>
                </div>
              </div>

              {submittedData.notes && (
                <div className="pt-2 text-xs">
                  <span className="text-zinc-400 block">{isEnglish ? 'Discussion Notes' : 'Topik / Catatan'}</span>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300 italic bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    "{submittedData.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs text-center shadow-md hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>{isEnglish ? 'Add to Google Calendar' : 'Simpan ke Google Calendar'}</span>
              </a>

              <a
                href={`https://wa.me/6285156296580?text=${encodeURIComponent(
                  `Halo tim 1sLabs, saya ${submittedData.contactPerson}${
                    submittedData.companyName ? ' dari ' + submittedData.companyName : ''
                  } telah menjadwalkan meeting pada tanggal ${submittedData.meetingDate} (${submittedData.meetingTime}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs text-center shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isEnglish ? 'WhatsApp 1sLabs Hotline' : 'Chat WhatsApp 1sLabs'}</span>
              </a>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline font-medium"
              >
                {isEnglish ? 'Return to 1sLabs Homepage' : 'Kembali ke Halaman Utama 1sLabs'}
              </Link>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            {/* Header intro */}
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEnglish ? 'Official 1sLabs Partnership' : 'Konsultasi & Diskusi Solusi Digital'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {isEnglish
                  ? 'Schedule an Online Discussion & Concept Preview'
                  : 'Jadwalkan Diskusi / Online Meeting Bersama 1sLabs'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {isEnglish
                  ? 'Choose your preferred date & time. We will prepare an interactive architecture concept, website ideas, and transparent pricing tailored specifically for your brand.'
                  : 'Tentukan tanggal dan jam yang paling nyaman untuk Anda. Tim kami akan menyiapkan konsep tampilan website, arsitektur sistem, dan estimasi biaya pengembangan yang transparan tanpa komitmen pembelian.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Company & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'Business / Company Name' : 'Nama Perusahaan / Bisnis'}</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={isEnglish ? 'e.g. Acme Coffee, Boutique Studio' : 'Contoh: Adrie Basuki Batik, Armor Kopi'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'Contact Person Name *' : 'Nama Kontak Person *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={isEnglish ? 'e.g. Kenneth Lee / Sarah' : 'Nama Anda (Contoh: Bpk. Dzikri)'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'Email Address *' : 'Email Kontak *'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'WhatsApp / Phone Number' : 'No. WhatsApp / HP'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Meeting Date & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'Meeting Date *' : 'Tanggal Meeting *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isEnglish ? 'Preferred Platform' : 'Platform Diskusi'}</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Google Meet">Google Meet (Tautan langsung dikirimkan)</option>
                    <option value="Zoom Meeting">Zoom Meeting</option>
                    <option value="WhatsApp Call">WhatsApp Call / Video</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Time Slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isEnglish ? 'Select Preferred Time Slot *' : 'Pilih Jam Meeting *'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_TIME_SLOTS.map((slot) => {
                    const isSelected = meetingTime === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setMeetingTime(slot)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-500'
                            : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Notes & Feedback */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isEnglish ? 'Notes / Feedback / Project Requirements' : 'Catatan / Feedback / Topik Diskusi'}</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isEnglish
                      ? 'Tell us briefly about your current website, desired features (e.g. online ordering, booking, portfolio refresh), or questions you want to discuss...'
                      : 'Ceritakan singkat kebutuhan Anda (misal: ingin buat website baru, perbaiki website lama, integrasi WhatsApp otomatis, atau estimasi harga)...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Trust Badges */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {isEnglish ? '100% Free Consultation' : 'Konsultasi 100% Gratis Tanpa Komitmen'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isEnglish ? 'Includes 1-Year Free Cloud Hosting' : 'Termasuk Free Cloud Hosting 1 Tahun'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEnglish ? 'Confirming Your Schedule...' : 'Menyimpan Jadwal Meeting...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEnglish ? 'Confirm Meeting Schedule' : 'Konfirmasi Jadwal Online Meeting'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            1sLabs &bull; Software Engineering & Cloud Solutions
          </p>
          <p>Bandung, Jawa Barat &bull; WhatsApp Hotline: +62 851-5629-6580 &bull; Email: info@1slabs.my.id</p>
        </div>
      </footer>
    </div>
  );
};

