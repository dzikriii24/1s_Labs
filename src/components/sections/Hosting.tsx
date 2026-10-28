"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Check,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';

interface HostingPlan {
  id: string;
  name: string;
  target: string;
  price: string;
  period: string;
  description: string;
  isRecommended?: boolean;
  features: string[];
  ctaText: string;
}

const hostingPlans: HostingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Hosting',
    target: 'Ideal for Landing Pages & Company Profiles',
    price: 'Rp 850.000',
    period: '/ tahun',
    description: 'Solusi hosting handal dan stabil untuk kehadiran digital awal bisnis, profil perusahaan, dan portofolio profesional.',
    features: [
      '30 GB High-Speed NVMe SSD Storage',
      '10 MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free SSL Certificate (Auto-SSL)',
      'Akses cPanel & File Manager Mandiri',
      'Bantuan Setup & Deployment Gratis',
      'Dukungan Teknis via WhatsApp Standar',
      'Garansi Uptime Server 99.9%'
    ],
    ctaText: 'Pilih Starter Hosting'
  },
  {
    id: 'business',
    name: 'Business Hosting',
    target: 'Best for Growing Companies & Active UMKM',
    price: 'Rp 1.000.000',
    period: '/ tahun',
    description: 'Pilihan paling populer dengan kapasitas penyimpanan 60 GB, 25 database, dan backup otomatis berkala.',
    isRecommended: true,
    features: [
      '60 GB High-Speed NVMe SSD Storage',
      '25 MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free SSL Certificate (Auto-SSL)',
      'Akses cPanel Penuh & phpMyAdmin',
      'Backup Otomatis Mingguan (Weekly Cloud)',
      'Bantuan Setup & Konfigurasi Domain DNS',
      'Optimasi Kecepatan (LiteSpeed Caching)',
      'Dukungan Teknis Prioritas via WhatsApp'
    ],
    ctaText: 'Pilih Business Hosting'
  },
  {
    id: 'professional',
    name: 'Professional Hosting',
    target: 'For High-Traffic Sites & Critical Portals',
    price: 'Rp 1.200.000',
    period: '/ tahun',
    description: 'Performa maksimal dengan unlimited storage dan dukungan prioritas untuk portal bisnis dengan lalu lintas tinggi.',
    features: [
      'Unlimited High-Speed NVMe SSD Storage',
      'Unlimited MySQL Databases',
      'Unmetered Monthly Bandwidth',
      'Free Commercial SSL Certificate',
      'Resource CPU & RAM Lebih Tinggi (High-Performance)',
      'Backup Otomatis Harian (Daily Cloud)',
      'Bantuan Penuh Migrasi Website & Deployment',
      'Dukungan VIP Fast-Response via WhatsApp',
      'Proactive Monitoring & Security Audit'
    ],
    ctaText: 'Pilih Professional Hosting'
  }
];

export const Hosting: React.FC = () => {
  const handleOrder = (planName: string, price: string) => {
    const message = encodeURIComponent(
      `Halo 1sLabs, saya ingin memesan / konsultasi mengenai paket ${planName} (${price}/tahun) untuk website saya.`
    );
    window.open(`https://wa.me/6285156296580?text=${message}`, '_blank');
  };

  return (
    <section id="hosting" className="py-10 sm:py-20 md:py-28 bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-16"
        >
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-5 tracking-tight font-['Mori',_sans-serif]">
            Managed Web Hosting Plans
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            Infrastruktur hosting berkualitas tinggi dengan penyimpanan NVMe berkecepatan tinggi, sertifikat SSL gratis, proteksi keamanan server, dan pendampingan deployment menyeluruh.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8 items-stretch max-w-7xl mx-auto">
          {hostingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.isRecommended
                  ? 'bg-neutral-900 text-white dark:bg-neutral-800 border-2 border-blue-500 shadow-xl shadow-blue-500/10 md:-translate-y-3'
                  : 'bg-white dark:bg-neutral-900/70 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg'
              }`}
            >
              {/* Recommended Badge */}
              {plan.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-xs flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Recommended
                </div>
              )}

              <div>
                {/* Plan Title & Target */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-2xl font-bold tracking-tight mb-0.5 font-['Mori',_sans-serif]">
                    {plan.name}
                  </h3>
                  <p className={`text-[11px] sm:text-xs font-medium ${plan.isRecommended ? 'text-blue-300' : 'text-blue-600 dark:text-blue-400'}`}>
                    {plan.target}
                  </p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-neutral-200/40 dark:border-neutral-700/50">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-['Mori',_sans-serif]">
                    {plan.price}
                  </span>
                  <span className={`text-xs sm:text-sm ${plan.isRecommended ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {plan.period}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed ${plan.isRecommended ? 'text-neutral-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
                  {plan.description}
                </p>

                {/* Features List */}
                <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                  <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 ${plan.isRecommended ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    Fasilitas Termasuk:
                  </div>
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.isRecommended
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                      <span className={plan.isRecommended ? 'text-neutral-200' : 'text-neutral-700 dark:text-neutral-300'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Button
                  variant={plan.isRecommended ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => handleOrder(plan.name, plan.price)}
                  className={`w-full py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                    plan.isRecommended
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-0'
                      : ''
                  }`}
                >
                  {plan.ctaText}
                </Button>
                <p className={`text-center text-[10px] sm:text-[11px] mt-2 ${plan.isRecommended ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Termasuk bantuan konfigurasi &amp; aktivasi
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom / Migration Notice Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-8 sm:mt-16 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-0.5 sm:mb-1">
                Butuh Server Khusus atau Migrasi Website Existing?
              </h4>
              <p className="text-[11px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Untuk aplikasi web dengan kebutuhan Virtual Private Server (VPS), backend Node.js / Python, database enterprise, atau pemindahan website lama, kami menyediakan penawaran kustom terpisah.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const text = encodeURIComponent('Halo 1sLabs, saya ingin konsultasi kebutuhan server kustom / migrasi website.');
              window.open(`https://wa.me/6285156296580?text=${text}`, '_blank');
            }}
            className="w-full sm:w-auto shrink-0 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 px-4 py-2 text-xs font-semibold"
          >
            Konsultasi Kustom <ExternalLink className="w-3.5 h-3.5 ml-1.5 inline" />
          </Button>
        </motion.div>

      </div>
    </section>
  );
};

export default Hosting;
