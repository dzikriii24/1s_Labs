import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe,
  Laptop,
  Clock,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Building2,
  DollarSign,
  Award,
  Users,
  Compass,
  FileText,
  Mail,
  Briefcase,
  Zap
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const WorkplacePolicyPage: React.FC = () => {
  const [isEnglish, setIsEnglish] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0B0F19] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 relative overflow-hidden">
      <Helmet>
        <title>
          {isEnglish
            ? 'Workplace & Remote-First Policy | 1sLabs'
            : 'Kebijakan Tempat Kerja & Budaya Remote | 1sLabs'}
        </title>
        <meta
          name="description"
          content={
            isEnglish
              ? 'Official Workplace Policy, Remote-First Culture, Employee Benefits, Compensation Model, and Health & Vaccine Guidelines at 1sLabs.'
              : 'Kebijakan resmi tempat kerja 1sLabs: Budaya kerja Remote-First, tunjangan karyawan, standar kompensasi lokasi, serta protokol kesehatan dan vaksinasi.'
          }
        />
        <link rel="canonical" href="https://1slabs.my.id/workplace-policy" />
        <meta property="og:title" content="Workplace & Remote-First Policy | 1sLabs" />
        <meta
          property="og:description"
          content="Official Workplace Policy, Remote-First Culture, Employee Benefits, and Health Guidelines at 1sLabs."
        />
        <meta property="og:url" content="https://1slabs.my.id/workplace-policy" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Background Decorative Radial Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-b from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Official Navigation Header */}
      <Header />

      <main className="pt-20 sm:pt-24 pb-20 sm:pb-28">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
          {/* Breadcrumb & Language Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <nav className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                Workplace Policy
              </span>
            </nav>

            {/* Language Toggle Button (Pure Text & Clean Icon, Zero Emojis) */}
            <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center gap-1 px-2 text-xs text-neutral-400 font-medium">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setIsEnglish(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isEnglish
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Bahasa Indonesia
              </button>
              <button
                type="button"
                onClick={() => setIsEnglish(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEnglish
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isEnglish
                  ? 'Official Corporate Workplace Policy • Active Standard 2026'
                  : 'Dokumen Resmi Kebijakan Tempat Kerja • Standar Aktif 2026'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-['Mori',_sans-serif] leading-tight">
              {isEnglish
                ? '1sLabs Workplace & Distributed Culture Policy'
                : 'Kebijakan Tempat Kerja & Budaya Kerja Terdistribusi 1sLabs'}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              {isEnglish
                ? 'A comprehensive guide to our Remote-First operational structure, employee benefits, performance standards, location-independent compensation model, and health guidelines.'
                : 'Pedoman komprehensif struktur kerja Remote-First, paket tunjangan kerja, standar performa, filosofi kompensasi yang independen dari domisili, serta protokol kesehatan dan vaksinasi di 1sLabs.'}
            </p>
          </motion.div>

          {/* Quick Anchor Navigation Pills */}
          <div className="mt-8 flex flex-wrap gap-2 text-xs">
            {[
              { id: 'primary-policy', label: isEnglish ? 'Primary Workplace Policy' : 'Kebijakan Utama', icon: Building2 },
              { id: 'benefits', label: isEnglish ? 'Remote Benefits' : 'Tunjangan Kerja', icon: Award },
              { id: 'compensation', label: isEnglish ? 'Compensation Model' : 'Standar Gaji & Kompensasi', icon: DollarSign },
              { id: 'vaccine-policy', label: isEnglish ? 'Health & Vaccine Policy' : 'Kebijakan Vaksinasi & Kesehatan', icon: ShieldCheck },
              { id: 'culture', label: isEnglish ? 'Equal Opportunity' : 'Kesetaraan & Budaya', icon: Users }
            ].map((anchor) => {
              const Icon = anchor.icon;
              return (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900/90 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs cursor-pointer font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{anchor.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* DETAILED POLICY CONTENT SECTIONS                          */}
        {/* ========================================================= */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* SECTION 1: PRIMARY WORKPLACE POLICY */}
          <section id="primary-policy" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Section 01</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
              {isEnglish
                ? 'Primary Workplace Model: Remote-First & Flexible'
                : '1. Model Tempat Kerja Utama: Remote-First & Fleksibel'}
            </h2>
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed backdrop-blur-sm">
              <p>
                {isEnglish ? (
                  <>
                    At <strong>1sLabs</strong> (PT Satu Solusi Digital), we operate as an engineering-driven, <strong>Remote-First technology studio</strong>. We believe that outstanding software design and high-velocity problem solving occur when professionals are granted autonomy over their work environment, schedule, and tooling. Every workflow, codebase review, documentation artifact, and system architecture is built to function smoothly across distributed time zones.
                  </>
                ) : (
                  <>
                    Di <strong>1sLabs</strong> (PT Satu Solusi Digital), kami beroperasi dengan model <strong>Remote-First</strong> terdesentralisasi. Kami meyakini bahwa produk digital berkelas tinggi dan rekayasa perangkat lunak modern terwujud ketika anggota tim memiliki otonomi penuh dalam menentukan lingkungan dan ritme kerja terbaik mereka. Seluruh alur kerja tim, tinjauan kode program (*code review*), komunikasi proyek, dan dokumentasi sistem dirancang untuk kolaborasi mandiri dari mana saja.
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                    <Laptop className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{isEnglish ? 'Work From Anywhere (WFA)' : 'Bekerja Dari Mana Saja (WFA)'}</span>
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isEnglish
                      ? 'Team members may work from home, private studios, or co-working spaces across Indonesia or internationally, with full support for asynchronous collaboration.'
                      : 'Anggota tim bebas bekerja dari rumah, co-working space, atau lokasi mana pun yang mendukung konsentrasi dan produktivitas terbaik di seluruh wilayah Indonesia maupun mancanegara.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{isEnglish ? 'Asynchronous & Output-Driven' : 'Asynchronous & Berbasis Hasil'}</span>
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {isEnglish
                      ? 'Evaluation is anchored strictly on code quality, deliverable execution, and milestone completion rather than rigid desktop tracking or endless video meetings.'
                      : 'Evaluasi kinerja berfokus pada kualitas kode, penyelesaian milestone, dan nilai nyata yang diberikan kepada pengguna, bukan pada absensi jam duduk kaku atau rapat virtual berkepanjangan.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-neutral-600 dark:text-neutral-300">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  {isEnglish
                    ? 'Physical Collaboration Hub: 1sLabs maintains coordination hubs in Bandung, West Java for optional in-person strategic planning, team design sprints, and engineering hackathons.'
                    : 'Pusat Koordinasi Fisik: 1sLabs menyediakan fasilitas kolaborasi fisik di Bandung, Jawa Barat untuk keperluan pertemuan opsional seperti perumusan arsitektur tahunan, design sprint, atau sesi retrospeksi tatap muka.'}
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: FEATURED REMOTE BENEFITS */}
          <section id="benefits" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Section 02</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
              {isEnglish
                ? 'Featured Remote Workplace Benefits'
                : '2. Fasilitas & Tunjangan Kerja Remote'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Benefit 1 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {isEnglish ? 'Flexible Working Hours' : 'Jam Kerja Fleksibel'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {isEnglish
                    ? 'Customizable daily schedules structured around core synchronization windows (10:00 - 15:00 WIB), allowing team members to balance personal lives and deep-work cycles.'
                    : 'Fleksibilitas mengatur jam kerja harian dengan waktu koordinasi bersama (10:00 - 15:00 WIB), memberi ruang seimbang untuk keluarga, kesehatan, dan produktivitas mandiri.'}
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEnglish ? 'Output-based evaluation' : 'Evaluasi berbasis hasil nyata'}</span>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {isEnglish ? 'Home Office & Internet Stipend' : 'Tunjangan Internet & Fasilitas Kerja'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {isEnglish
                    ? 'Financial support for high-speed fiber internet connection, modern software licenses, IDE tooling, and ergonomic desk accessories.'
                    : 'Dukungan operasional bulanan untuk koneksi internet berkecepatan tinggi, lisensi software pengembangan profesional, serta subsidi peralatan ergonomis.'}
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEnglish ? 'Full infrastructure coverage' : 'Dukungan infrastruktur lengkap'}</span>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {isEnglish ? 'Learning & Tech Certifications' : 'Dukungan Belajar & Sertifikasi'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {isEnglish
                    ? 'Dedicated annual budget for cloud certifications (AWS, GCP, Linux), technical books, engineering workshops, and international tech conferences.'
                    : 'Alokasi anggaran tahunan untuk sertifikasi cloud (AWS, GCP, CloudLinux), literatur teknis, kursus pemrograman tingkat lanjut, dan konferensi teknologi.'}
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEnglish ? 'Professional growth guarantee' : 'Pengembangan karir berkelanjutan'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: COMPENSATION PHILOSOPHY */}
          <section id="compensation" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" />
              <span>Section 03</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
              {isEnglish
                ? 'Compensation Philosophy: Location Does Not Impact Pay'
                : '3. Model Kompensasi: Lokasi Domisili Tidak Mempengaruhi Gaji'}
            </h2>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed backdrop-blur-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Employee location does not impact pay</span>
              </div>

              <p>
                {isEnglish ? (
                  <>
                    At 1sLabs, we firmly reject location-based salary cuts. Whether an engineer or designer lives in Jakarta, Bandung, Yogyakarta, Bali, or outside Indonesia, their base remuneration is benchmarked against <strong>market role standards, technical mastery, problem-solving impact, and demonstrated contributions</strong>.
                  </>
                ) : (
                  <>
                    Di 1sLabs, kami meyakini bahwa nilai hasil karya seorang perekayasa perangkat lunak tidak berkurang hanya karena mereka memilih tinggal di luar kota metropolitan. Besaran gaji pokok dan bonus performa ditentukan sepenuhnya oleh <strong>keahlian teknis, kedalaman tanggung jawab, dampak arsitektural proyek, dan dedikasi kontribusi</strong>, bukan lokasi geografis domisili.
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="font-bold text-neutral-900 dark:text-white mb-1">
                    {isEnglish ? 'Role Benchmarking' : 'Standar Peran Adil'}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {isEnglish ? 'Calibrated to national and regional tech industry levels.' : 'Dikalibrasi setara standar industri teknologi terdepan.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="font-bold text-neutral-900 dark:text-white mb-1">
                    {isEnglish ? 'Merit-Based Growth' : 'Kenaikan Berbasis Prestasi'}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {isEnglish ? 'Transparent salary ladders with bi-annual performance evaluations.' : 'Jenjang karir transparan dengan tinjauan berkala.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="font-bold text-neutral-900 dark:text-white mb-1">
                    {isEnglish ? 'Equal Pay Commitment' : 'Komitmen Kesetaraan Penuh'}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {isEnglish ? 'Zero demographic or location discounts for equal contributions.' : 'Tanpa potongan daerah untuk peran dan dampak yang setara.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: HEALTH, SAFETY & VACCINE POLICY */}
          <section id="vaccine-policy" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Section 04</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
              {isEnglish
                ? 'Health, Safety & Vaccine Policy'
                : '4. Kebijakan Kesehatan, Keselamatan & Vaksinasi'}
            </h2>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed backdrop-blur-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vaccine recommended for in-person work</span>
              </div>

              <p>
                {isEnglish ? (
                  <>
                    The physical health and psychological well-being of our team members are of paramount importance. Because 1sLabs operates as a Remote-First company, day-to-day employment is performed without mandatory physical presence. For optional in-person events or client meetings, we implement the following health standards:
                  </>
                ) : (
                  <>
                    Kesehatan fisik dan kesejahteraan mental seluruh personel 1sLabs merupakan prioritas utama. Karena model kerja 1sLabs berlandaskan prinsip Remote-First, operasional harian tidak mensyaratkan kehadiran fisik di kantor. Namun untuk kegiatan tatap muka opsional, koordinasi lapangan, maupun pertemuan resmi klien, kami menerapkan panduan kesehatan berikut:
                  </>
                )}
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                      {isEnglish
                        ? 'Vaccination Recommendation for In-Person Gatherings'
                        : 'Anjuran Vaksinasi untuk Kegiatan Tatap Muka'}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {isEnglish
                        ? 'Complete vaccination against COVID-19 (SARS-CoV-2) and annual influenza is strongly recommended for members participating in in-person company gatherings, offsite retreats, or client on-site workshops.'
                        : 'Vaksinasi lengkap (termasuk dosis booster COVID-19 sesuai anjuran Kementerian Kesehatan RI) sangat direkomendasikan bagi anggota tim yang berpartisipasi dalam pertemuan tatap muka, workshop klien, atau gathering resmi perusahaan.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-3">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                      {isEnglish ? 'Flexible Medical Sick Leave & Recovery' : 'Izin Sakit & Pemulihan Tanpa Hambatan'}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {isEnglish
                        ? 'Team members experiencing symptoms of illness or fatigue are entitled to complete rest without bureaucratic penalties. Health and recovery always take precedence.'
                        : 'Anggota tim yang sakit atau membutuhkan waktu pemulihan dipersilakan beristirahat penuh tanpa beban birokrasi rumit. Kesehatan dan kesembuhan fisik adalah prioritas utama.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: EQUAL OPPORTUNITY EMPLOYER */}
          <section id="culture" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Section 05</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
              {isEnglish
                ? 'Equal Opportunity Employer & Inclusive Culture'
                : '5. Kesetaraan Peluang & Lingkungan Inklusif (EEO)'}
            </h2>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-900/80 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed backdrop-blur-sm">
              <p>
                {isEnglish ? (
                  <>
                    1sLabs is committed to fostering an inclusive, welcoming, and harassment-free workplace. All qualified applicants receive consideration for employment without regard to race, religion, gender identity, sexual orientation, disability status, age, or socioeconomic background.
                  </>
                ) : (
                  <>
                    1sLabs berkomitmen menciptakan lingkungan kerja yang aman, menghargai keberagaman, dan bebas dari segala bentuk diskriminasi maupun intimidasi. Seluruh proses rekrutmen dan promosi karir didasarkan pada kompetensi, integritas, dan kecakapan profesional tanpa memandang latar belakang suku, agama, gender, atau status sosial.
                  </>
                )}
              </p>
            </div>
          </section>

          {/* SECTION 6: INQUIRIES & CONTACT */}
          <section id="contact" className="scroll-mt-28">
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900 via-gray-900 to-black text-white border border-indigo-800/60 shadow-xl space-y-4 relative overflow-hidden">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  {isEnglish ? 'Company Verification & Inquiries' : 'Verifikasi Kebijakan & Kontak'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-['Mori',_sans-serif]">
                  {isEnglish ? 'Questions Regarding Our Workplace Policy?' : 'Pertanyaan Terkait Kebijakan Tempat Kerja?'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {isEnglish
                    ? 'For talent acquisition inquiries, employment verification, or institutional partnerships, reach out directly to our People & Operations team.'
                    : 'Untuk keperluan verifikasi kerja, kemitraan institusi, atau pertanyaan seputar rekrutmen, hubungi tim People & Operations 1sLabs melalui kanal resmi.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="mailto:info@1slabs.my.id?subject=Workplace%20Policy%20Inquiry"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 hover:bg-neutral-100 font-bold text-xs transition shadow-sm"
                >
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Email: info@1slabs.my.id</span>
                </a>
                <Link
                  to="/schedule"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs transition border border-indigo-400/30"
                >
                  <Clock className="w-4 h-4" />
                  <span>{isEnglish ? 'Schedule Meeting' : 'Jadwalkan Diskusi'}</span>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Official Footer */}
      <Footer />
    </div>
  );
};

export default WorkplacePolicyPage;
