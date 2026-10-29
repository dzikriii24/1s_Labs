import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Instagram, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

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
  { label: 'Custom Software / Web App', msg: 'Halo 1sLabs, saya membutuhkan custom software / web app untuk alur kerja perusahaan.' },
  { label: 'Cloud Hosting & Domain', msg: 'Halo 1sLabs, saya ingin berlangganan paket managed cloud hosting tahunan.' },
  { label: 'Konsultasi & Estimasi Biaya', msg: 'Halo 1sLabs, saya ingin konsultasi teknis dan minta estimasi biaya proyek.' }
];

export const Contact = () => {
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

  return (
    <section id="contact" className="relative antialiased bg-white dark:bg-gray-900 font-sans py-10 sm:py-16 md:py-20 px-3 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Judul Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3 h-3" />
            Siap Membantu Kapan Saja
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white font-['Mori',_sans-serif] mb-2 sm:mb-4">
            Let's Connect.
          </h2>

          <p className="text-xs sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed px-2">
            Punya ide proyek, kebutuhan sistem bisnis, atau ingin berdiskusi santai? Hubungi kami melalui kanal komunikasi resmi di bawah ini.
          </p>
        </motion.div>

        {/* Grid Kartu Kontak */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 mb-8 sm:mb-12"
        >
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <motion.a 
                key={method.title} 
                variants={itemVariants} 
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block group h-full"
              >
                <div className={`h-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between border ${
                  method.highlight
                    ? 'bg-gradient-to-b from-blue-50/70 via-white to-blue-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5 hover:border-blue-500 hover:shadow-xl'
                    : 'bg-white dark:bg-neutral-900/60 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md'
                }`}>
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${
                        method.highlight
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          method.highlight
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          {method.badge}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-0.5 font-['Mori',_sans-serif]">
                      {method.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-3 sm:mb-4 break-all">
                      {method.handle}
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                      {method.cta}
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Quick Conversation Launcher */}
        <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-center">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1">
            Topik Pembahasan Cepat via WhatsApp
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mb-3.5">
            Klik salah satu topik di bawah untuk membuka chat dengan pesan yang sudah disiapkan:
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {quickTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  const url = `https://wa.me/6285156296580?text=${encodeURIComponent(topic.msg)}`;
                  window.open(url, '_blank');
                }}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium transition-all shadow-2xs hover:border-blue-400 cursor-pointer"
              >
                {topic.label} &rarr;
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Contact;
