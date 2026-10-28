"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Cpu,
  Server,
  Wrench,
  Layers,
  Database,
  Bot,
  ShieldCheck,
  Palette,
  Workflow,
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ServiceItem {
  id: string;
  category: 'development' | 'ai-automation' | 'infrastructure' | 'consulting';
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}

const servicesData: ServiceItem[] = [
  {
    id: 'web-dev',
    category: 'development',
    icon: Code2,
    title: 'Web & Web App Development',
    description: 'High-performing company profiles, landing pages, and interactive web applications engineered with modern frameworks.',
    features: ['React.js & Next.js', 'TypeScript & Tailwind CSS', 'PHP & Laravel', 'SEO & Performance Tuned'],
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'custom-software',
    category: 'development',
    icon: Cpu,
    title: 'Custom Business Software',
    description: 'Tailored enterprise software, inventory systems, cashier/POS platforms, and operational dashboards built for your workflow.',
    features: ['Operational Dashboards', 'Warehouse & Stock Control', 'Role-Based Access (RBAC)', 'Report Generation (PDF/Excel)'],
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'api-integration',
    category: 'development',
    icon: Layers,
    title: 'API & System Integration',
    description: 'Scalable RESTful API development, third-party payment integrations, and seamless data bridging between legacy and modern systems.',
    features: ['RESTful API Architecture', 'Payment Gateway Integration', 'SLiMS & Legacy Data Sync', 'Microservices & Webhooks'],
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'ai-integration',
    category: 'ai-automation',
    icon: Bot,
    title: 'AI Integration & Intelligent Models',
    description: 'Leverage machine learning, deep learning models, and smart AI assistants directly integrated into your business application.',
    features: ['AI Assistant & Chatbots', 'Computer Vision & Image Models', 'Python & Machine Learning', 'NLP & Voice Processing'],
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'automation-scraping',
    category: 'ai-automation',
    icon: Workflow,
    title: 'Workflow Automation & Data Scraping',
    description: 'Eliminate repetitive manual tasks with automated data pipelines, web scrapers, and background processing workers.',
    features: ['Automated Data Extraction', 'Scheduled Background Jobs', 'Real-Time Notification Bots', 'Custom Business Automations'],
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'cloud-hosting',
    category: 'infrastructure',
    icon: Server,
    title: 'Cloud, VPS & Server Deployment',
    description: 'Reliable cloud environment configuration, Virtual Private Server (VPS) setup, automated SSL, and domain routing.',
    features: ['VPS & Linux Server Setup', 'Cloud Services (Vercel, Render)', 'Domain & DNS Configuration', 'Automated SSL & Security'],
    gradient: 'from-sky-500 to-blue-600'
  },
  {
    id: 'database-mgmt',
    category: 'infrastructure',
    icon: Database,
    title: 'Database Architecture & Management',
    description: 'Robust database modeling, query tuning, automated backup mechanisms, and cloud database administration.',
    features: ['PostgreSQL & MySQL', 'Supabase & Cloud Relational DB', 'Query Latency Optimization', 'Automated Backup Routines'],
    gradient: 'from-violet-500 to-indigo-600'
  },
  {
    id: 'maintenance-updates',
    category: 'consulting',
    icon: Wrench,
    title: 'System Maintenance & Software Updates',
    description: 'Proactive application maintenance, bug fixing, dependency updates, and continuous performance enhancements.',
    features: ['Regular Bug Fixes', 'Dependency Security Patches', 'Speed & Latency Audits', 'Ongoing Technical Support'],
    gradient: 'from-rose-500 to-red-500'
  },
  {
    id: 'it-consulting',
    category: 'consulting',
    icon: ShieldCheck,
    title: 'IT Consulting & Architecture Advisory',
    description: 'Strategic technology advisory, system architecture design, and digital transformation roadmaps for businesses.',
    features: ['Tech Stack Selection', 'Software Architecture Review', 'Feasibility & Cost Estimation', 'Digital Transformation'],
    gradient: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'ui-ux',
    category: 'development',
    icon: Palette,
    title: 'UI/UX Design & Prototyping',
    description: 'Human-centered, modern design systems and intuitive user interfaces that convert visitors into active customers.',
    features: ['Responsive UI Design', 'Interactive Wireframes', 'Design Systems & Tokens', 'Design-to-Code Precision'],
    gradient: 'from-fuchsia-500 to-rose-500'
  }
];

const categories = [
  { id: 'all', label: 'All Services' },
  { id: 'development', label: 'Development & Software' },
  { id: 'ai-automation', label: 'AI & Automation' },
  { id: 'infrastructure', label: 'Cloud & Infrastructure' },
  { id: 'consulting', label: 'Consulting & Maintenance' }
];

export const Services: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredServices = activeCategory === 'all'
    ? servicesData
    : servicesData.filter(item => item.category === activeCategory);

  const handleConsultation = (serviceTitle?: string) => {
    const text = serviceTitle
      ? encodeURIComponent(`Halo 1sLabs, saya ingin konsultasi mengenai layanan: ${serviceTitle}.`)
      : encodeURIComponent('Halo 1sLabs, saya ingin konsultasi mengenai kebutuhan proyek teknologi kami.');
    window.open(`https://wa.me/6285156296580?text=${text}`, '_blank');
  };

  return (
    <section id="services" className="py-10 sm:py-20 md:py-28 bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-14"
        >
         
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-5 tracking-tight font-['Mori',_sans-serif]">
            Comprehensive IT &amp; Software Services
          </h2>
          <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            Dari web application custom, sistem informasi bisnis, hingga otomatisasi AI dan cloud hosting, kami menghadirkan rekayasa teknologi berkualitas tinggi untuk pertumbuhan bisnis Anda.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-8">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Services Grid: 2 Columns on Mobile, 3 on Desktop */}
        <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  layout
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="h-full"
                >
                  <div className="h-full bg-white dark:bg-neutral-900/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-7 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xl dark:hover:shadow-neutral-950/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      {/* Icon */}
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br ${service.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-5 text-white shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xs sm:text-base md:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-3 tracking-tight line-clamp-2 leading-tight">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {service.description}
                      </p>

                      {/* Feature Checklist (visible on tablet/desktop, compact) */}
                      <ul className="hidden sm:block space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                        {service.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-center text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card CTA */}
                    <button
                      onClick={() => handleConsultation(service.title)}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors pt-2 sm:pt-4 border-t border-neutral-100 dark:border-neutral-800/80"
                    >
                      Konsultasi <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Dedicated Service Landing Pages Hub */}
        <div className="mt-10 sm:mt-16 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-blue-50/40 dark:bg-neutral-800/40 border border-blue-200/60 dark:border-neutral-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-2 sm:gap-3">
            <div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Eksplorasi Halaman Khusus
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white font-['Mori',_sans-serif]">
                Halaman Panduan &amp; Spesifikasi Lengkap Layanan
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
              Akses informasi terperinci mengenai alur kerja, cakupan teknis, dan portofolio untuk setiap layanan 1sLabs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <a
              href="/jasa-pembuatan-website"
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  01. Website Development
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Jasa Pembuatan Website
                </h4>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2.5">
                  Landing page konversi tinggi, profil perusahaan modern, UI/UX eksklusif, &amp; siap SEO.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                Pelajari Layanan &rarr;
              </span>
            </a>

            <a
              href="/software-development"
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 hover:border-indigo-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                  02. Custom Software
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Software Development
                </h4>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2.5">
                  Sistem enterprise, manajemen gudang, kasir POS, &amp; arsitektur cloud PostgreSQL/MySQL.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                Pelajari Layanan &rarr;
              </span>
            </a>

            <a
              href="/it-consulting"
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 hover:border-purple-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                  03. IT Architecture
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  IT Consulting
                </h4>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2.5">
                  Konsultasi digitalisasi, audit infrastruktur sistem, roadmap teknologi, &amp; efisiensi biaya.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                Pelajari Layanan &rarr;
              </span>
            </a>

            <a
              href="/hosting"
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  04. Managed Hosting
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Cloud Hosting &amp; Domain
                </h4>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2.5">
                  Penyimpanan NVMe 30GB hingga Unlimited, cPanel mandiri, gratis SSL, &amp; migrasi website.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                Pelajari Layanan &rarr;
              </span>
            </a>
          </div>
        </div>

        {/* Global CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-8 sm:mt-16 md:mt-20 p-5 sm:p-10 rounded-2xl sm:rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-center relative overflow-hidden"
        >
          <div className="max-w-2xl mx-auto relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Need a Custom Solution for Your Business?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base mb-8 leading-relaxed">
              We provide technical consultations and cost estimates with clear specifications. No hidden fees or unnecessary upsells.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleConsultation()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Get Free Consultation
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto"
              >
                View Contact Info
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Services;