"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FaqItem {
  id: string;
  category: 'workflow' | 'pricing' | 'tech';
  question: string;
  answer: string;
}

const faqList: FaqItem[] = [
  {
    id: 'item-1',
    category: 'workflow',
    question: 'Bagaimana alur kerja pengembangan website atau sistem di 1sLabs?',
    answer: 'Proses rekayasa kami terstruktur dalam 4 tahapan transparan: (1) Discovery & Konsultasi untuk memetakan arsitektur dan kebutuhan spesifik; (2) Wireframing & Desain UI/UX eksklusif di Figma; (3) Clean Development dengan framework modern (React, Next.js, TypeScript); serta (4) Testing komprehensif, review bersama, dan deployment ke server produksi Anda.'
  },
  {
    id: 'item-2',
    category: 'tech',
    question: 'Apakah 1sLabs menerima proyek custom software dan sistem enterprise?',
    answer: 'Ya. Kami berpengalaman membangun sistem enterprise seperti platform inventaris gudang DPD RI, sistem pemantauan petugas lapangan, software kasir (POS), dashboard analitik, dan integrasi database cloud PostgreSQL/MySQL dengan arsitektur scalable.'
  },
  {
    id: 'item-3',
    category: 'pricing',
    question: 'Apakah tersedia konsultasi dan estimasi biaya gratis sebelum proyek?',
    answer: 'Tentu. Anda dapat berkonsultasi langsung melalui WhatsApp atau sesi diskusi online tanpa dipungut biaya. Kami akan menganalisis kebutuhan teknis Anda, memberikan saran arsitektur yang paling efisien, dan menyusun proposal estimasi biaya transparan tanpa ikatan kontrak di awal.'
  },
  {
    id: 'item-4',
    category: 'pricing',
    question: 'Bagaimana konsep Pay Once (Bayar Sekali) dan bagaimana kepemilikan kodenya?',
    answer: 'Melalui prinsip Pay Once, Anda memiliki kepemilikan penuh (100% full ownership) atas seluruh source code, database, dan aset digital yang kami bangun. Tidak ada biaya sewa lisensi software bulanan (SaaS). Sistem sepenuhnya menjadi aset milik bisnis Anda.'
  },
  {
    id: 'item-5',
    category: 'tech',
    question: 'Apakah 1sLabs menyediakan layanan hosting dan konfigurasi domain?',
    answer: 'Ya, kami menyediakan paket managed cloud hosting tahunan (Starter 30GB, Business 60GB, dan Professional Unlimited) dengan penyimpanan NVMe berkecepatan tinggi, sertifikat SSL HTTPS otomatis, akses cPanel, dan pendampingan konfigurasi domain/DNS hingga website online.'
  },
  {
    id: 'item-6',
    category: 'tech',
    question: 'Bagaimana jika kami sudah memiliki website lama dan ingin migrasi ke 1sLabs?',
    answer: 'Tim kami akan menangani seluruh proses migrasi file website, aset, dan basis data dari hosting/server lama Anda ke infrastruktur baru secara aman tanpa downtime berlebih dan dengan verifikasi integritas data menyeluruh.'
  },
  {
    id: 'item-7',
    category: 'workflow',
    question: 'Apakah 1sLabs menyediakan garansi dan pemeliharaan (maintenance) setelah rilis?',
    answer: 'Ya, setiap proyek dilengkapi masa garansi perbaikan bug gratis pasca-peluncuran untuk menjamin stabilitas sistem. Untuk kebutuhan pembaruan jangka panjang, audit keamanan berkala, dan penambahan fitur baru, kami menyediakan paket maintenance berkala yang fleksibel.'
  },
  {
    id: 'item-8',
    category: 'tech',
    question: 'Apakah 1sLabs dapat mengintegrasikan AI, API, dan automasi proses bisnis?',
    answer: 'Ya. Kami memiliki rekam jejak praktis dalam integrasi model AI/ML Python, smart voice assistant inklusif (proyek Vocallet), API bridging antar-sistem warisan (OpenBiblio ke SLiMS), dan otomatisasi alur kerja backend modern.'
  },
  {
    id: 'item-9',
    category: 'workflow',
    question: 'Bagaimana cara menghubungi tim technical support jika ada kendala darurat?',
    answer: 'Klien dapat menghubungi tim teknis kami langsung melalui WhatsApp hotline di +62 851-5629-6580 atau via email resmi di 1slabs.id@gmail.com pada jam kerja untuk mendapatkan respons cepat dan penanganan langsung dari tim engineer.'
  }
];

export function AccordionDemo() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'workflow' | 'pricing' | 'tech'>('all');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItemId(prev => prev === id ? null : id);
  };

  const filteredFaq = selectedCategory === 'all'
    ? faqList
    : faqList.filter(item => item.category === selectedCategory);

  return (
    <section id="faq" className="py-10 sm:py-16 md:py-20 bg-transparent font-sans">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-2.5 sm:mb-3.5 tracking-tight font-['Mori',_sans-serif]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed px-2">
            Jawaban transparan seputar alur kerja rekayasa perangkat lunak, sistem pembayaran Pay Once, managed hosting, dan pendampingan teknis 1sLabs.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-5 sm:mt-6">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setOpenItemId(null);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              Semua ({faqList.length})
            </button>
            <button
              onClick={() => {
                setSelectedCategory('workflow');
                setOpenItemId(null);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'workflow'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              Alur &amp; Proses Kerja
            </button>
            <button
              onClick={() => {
                setSelectedCategory('pricing');
                setOpenItemId(null);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'pricing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              Biaya &amp; Pay Once
            </button>
            <button
              onClick={() => {
                setSelectedCategory('tech');
                setOpenItemId(null);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'tech'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              Hosting &amp; Teknologi
            </button>
          </div>
        </div>

        {/* Clean, Non-Leaking Accordion Stack */}
        <div className="w-full space-y-3">
          {filteredFaq.map((item, idx) => {
            const isOpen = openItemId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "bg-white dark:bg-neutral-900 border-blue-500/50 shadow-md shadow-blue-500/5"
                    : "bg-white dark:bg-neutral-900/60 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full py-4 px-4 sm:px-6 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn(
                      "w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors",
                      isOpen
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    )}>
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <span className="text-xs sm:text-base font-semibold text-neutral-900 dark:text-white leading-snug">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-300",
                    isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : "text-neutral-400"
                  )} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 sm:pl-13 pl-12">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Bottom WhatsApp Help Banner */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-neutral-50/50 dark:from-neutral-900/80 dark:via-blue-950/30 dark:to-neutral-900/60 border border-blue-200/60 dark:border-blue-900/40 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-0.5">
              Punya Pertanyaan Spesifik Terkait Kebutuhan Proyek Anda?
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400">
              Diskusikan langsung bersama tim engineer kami melalui WhatsApp (respon cepat &lt; 15 menit).
            </p>
          </div>
          <button
            onClick={() => {
              const text = encodeURIComponent('Halo 1sLabs, saya ingin konsultasi dan bertanya mengenai layanan IT / pembuatan website.');
              window.open(`https://wa.me/6285156296580?text=${text}`, '_blank');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat via WhatsApp
          </button>
        </div>

      </div>
    </section>
  );
}

export default AccordionDemo;