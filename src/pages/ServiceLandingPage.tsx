"use client";
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Code2,
  Cpu,
  Server,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

export interface ServicePageConfig {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  h1: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  problems: { title: string; desc: string }[];
  scope: string[];
  workflow: { step: string; title: string; desc: string }[];
  pricingGuidance: {
    basePrice: string;
    pricingNote: string;
    factors: string[];
  };
  portfolioExamples: {
    title: string;
    category: string;
    role: string;
    tech: string[];
    link?: string;
  }[];
  faq: { question: string; answer: string }[];
  relatedServices: { title: string; path: string; desc: string }[];
}

export const servicesConfig: Record<string, ServicePageConfig> = {
  'web-dev': {
    slug: 'jasa-pembuatan-website',
    metaTitle: 'Jasa Pembuatan Website Profesional & Web App | 1sLabs',
    metaDescription: '1sLabs melayani jasa pembuatan website profesional, company profile modern, landing page konversi tinggi, dan aplikasi web custom dengan kepemilikan kode 100%.',
    canonicalUrl: 'https://1slabs.my.id/jasa-pembuatan-website',
    h1: 'Jasa Pembuatan Website Profesional & Aplikasi Web Terpercaya',
    subtitle: 'Kami merancang dan membangun website modern, cepat, responsif, dan siap SEO dengan sistem Pay Once tanpa biaya sewa berlangganan yang mengikat.',
    badge: 'Web Development Services',
    icon: Code2,
    problems: [
      {
        title: 'Website Lambat & Tidak Mobile-Friendly',
        desc: 'Banyak bisnis kehilangan calon pembeli karena website lambat dimuat dan tampil berantakan saat dibuka dari layar HP.'
      },
      {
        title: 'Biaya Langganan Platform yang Membengkak',
        desc: 'Menyewa platform bulanan (SaaS) membuat bisnis terikat biaya sewa selamanya tanpa pernah benar-benar memiliki aset kode sendiri.'
      },
      {
        title: 'Tampilan Template Pasaran Tanpa Ciri Khas',
        desc: 'Template gratisan yang generik membuat kredibilitas brand Anda terlihat kurang profesional di mata calon klien bernilai tinggi.'
      }
    ],
    scope: [
      'Desain UI/UX Eksklusif & Mobile-First di Figma',
      'Pengembangan Frontend Modern (React.js, Next.js, TypeScript, Tailwind CSS)',
      'Backend & Database Terintegrasi (Node.js, PHP/Laravel, PostgreSQL/MySQL)',
      'Optimasi SEO Teknis & Metadata On-Page Google',
      'Integrasi Domain Resmi & Free SSL HTTPS (Let\'s Encrypt)',
      'Penyerahan 100% Hak Milik Source Code & Dokumentasi'
    ],
    workflow: [
      { step: '01', title: 'Discovery & Consultation', desc: 'Memahami tujuan bisnis, target pengguna, dan spesifikasi fitur yang dibutuhkan.' },
      { step: '02', title: 'UI/UX Wireframing', desc: 'Merancang tata letak antarmuka yang estetis, modern, dan mudah dikonversi oleh pengunjung.' },
      { step: '03', title: 'Clean Development', desc: 'Menulis kode terstruktur, modular, dan berperforma tinggi tanpa script tidak berguna.' },
      { step: '04', title: 'Testing & SEO Audit', desc: 'Uji responsivitas di semua perangkat, audit kecepatan (Lighthouse), dan periksa indeks Google.' },
      { step: '05', title: 'Deployment & Handover', desc: 'Peluncuran ke server cloud/hosting Anda beserta serah terima hak cipta kode seutuhnya.' }
    ],
    pricingGuidance: {
      basePrice: 'Mulai dari Rp1.500.000',
      pricingNote: 'Sistem Pay Once (sekali bayar). Tanpa biaya langganan aplikasi bulanan.',
      factors: [
        'Jumlah halaman dan kompleksitas konten',
        'Kebutuhan integrasi dynamic API (Payment Gateway, WhatsApp Gateway)',
        'Fitur interaktif khusus (CMS, dashboard admin, sistem filter dinamis)'
      ]
    },
    portfolioExamples: [
      {
        title: 'DPD RI Jawa Barat',
        category: 'Enterprise Portal',
        role: 'PM & Fullstack Developer',
        tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        link: '/#portfolio'
      },
      {
        title: 'Saffix Event & Talent Platform',
        category: 'Web Application',
        role: 'Fullstack Web Developer',
        tech: ['Next.js', 'Tailwind CSS', 'REST API'],
        link: '/#portfolio'
      },
      {
        title: 'Yuk-Mari UMKM & Event',
        category: 'Community Web Portal',
        role: 'Fullstack Web Developer',
        tech: ['React', 'Tailwind CSS', 'MySQL'],
        link: '/#portfolio'
      }
    ],
    faq: [
      {
        question: 'Berapa lama proses pembuatan website di 1sLabs?',
        answer: 'Untuk landing page atau company profile standar, pengerjaan memakan waktu 5–10 hari kerja. Untuk web app atau sistem bisnis yang lebih kompleks, waktu pengerjaan berkisar antara 2–4 minggu sesuai kesepakatan cakupan proyek.'
      },
      {
        question: 'Apakah saya mendapatkan hak penuh atas source code website?',
        answer: 'Ya, 100%. Sesuai prinsip Pay Once, seluruh kode sumber, aset desain, dan akses database diserahkan penuh kepada Anda tanpa biaya royalti atau sewa lisensi tahunan.'
      },
      {
        question: 'Apakah website sudah dioptimasi untuk SEO Google?',
        answer: 'Tentu. Setiap website yang kami buat dilengkapi struktur heading semantik (H1–H3), meta tag lengkap, canonical URL, sitemap XML, robots.txt, dan skor performa Core Web Vitals yang optimal.'
      }
    ],
    relatedServices: [
      { title: 'Custom Software Development', path: '/software-development', desc: 'Sistem operasional, kasir POS, dan dashboard bisnis khusus.' },
      { title: 'Managed Web Hosting', path: '/hosting', desc: 'Hosting NVMe cepat, aman, dengan gratis SSL dan bantuan deployment.' },
      { title: 'IT Consulting', path: '/it-consulting', desc: 'Konsultasi arsitektur sistem dan transformasi digital.' }
    ]
  },

  'custom-software': {
    slug: 'software-development',
    metaTitle: 'Jasa Software Development & Custom Business Systems | 1sLabs',
    metaDescription: '1sLabs melayani jasa software development custom, aplikasi kasir POS, sistem inventori, dan dashboard operasional enterprise terukur untuk efisiensi bisnis.',
    canonicalUrl: 'https://1slabs.my.id/software-development',
    h1: 'Jasa Custom Software Development & Sistem Informasi Bisnis',
    subtitle: 'Solusi perangkat lunak terintegrasi yang disesuaikan 100% dengan SOP dan alur kerja unik perusahaan Anda.',
    badge: 'Custom Enterprise Software',
    icon: Cpu,
    problems: [
      {
        title: 'Software Jadi yang Kaku & Tidak Sesuai SOP',
        desc: 'Menggunakan software pasaran seringkali memaksa bisnis mengubah alur kerja mereka karena fitur yang tidak fleksibel.'
      },
      {
        title: 'Biaya Lisensi per Karyawan yang Mahal',
        desc: 'Sistem subscription per user bulanan membebani pertumbuhan bisnis saat tim Anda bertambah banyak.'
      },
      {
        title: 'Data Tersebar & Laporan Manual Lambat',
        desc: 'Pencatatan manual di spreadsheet rawan kesalahan manusia (human error) dan menyulitkan pengambilan keputusan strategis.'
      }
    ],
    scope: [
      'Sistem Kasir & Point of Sale (POS) Multi-Cabang',
      'Sistem Informasi Manajemen Inventori & Gudang',
      'Dashboard Analitik Operasional & Laporan Keuangan Real-Time',
      'Role-Based Access Control (RBAC) Aman untuk Manajemen Karyawan',
      'Ekspor Laporan Otomatis (PDF, Excel, CSV) & WhatsApp Alerts',
      'Integrasi Perangkat Keras (Printer Thermal, Barcode Scanner)'
    ],
    workflow: [
      { step: '01', title: 'Business Process Mapping', desc: 'Menganalisis alur transaksi, inventori, dan hierarki wewenang staf Anda.' },
      { step: '02', title: 'Database & Architecture Design', desc: 'Merancang skema relasional database yang tangguh dan teroptimasi.' },
      { step: '03', title: 'Iterative Development', desc: 'Membangun modul fungsional secara bertahap dengan pelaporan progress berkala.' },
      { step: '04', title: 'User Acceptance Testing (UAT)', desc: 'Pengujian langsung bersama tim Anda untuk memastikan kelancaran operasional.' },
      { step: '05', title: 'Training & Deployment', desc: 'Pelatihan staf, konfigurasi server produksi, dan serah terima penuh.' }
    ],
    pricingGuidance: {
      basePrice: 'Mulai dari Rp3.000.000',
      pricingNote: 'Investasi sekali bayar, dapat digunakan oleh seluruh staf tanpa lisensi per user.',
      factors: [
        'Jumlah modul bisnis (Kasir, Stok, Keuangan, Karyawan, Cabang)',
        'Kebutuhan sinkronisasi multi-outlet offline/online',
        'Kebutuhan integrasi hardware atau API payment gateway'
      ]
    },
    portfolioExamples: [
      {
        title: 'Smart POS & Cashier System',
        category: 'Business Application',
        role: 'Fullstack Developer',
        tech: ['React', 'Node.js', 'PostgreSQL', 'Thermal SDK'],
        link: '/#portfolio'
      },
      {
        title: 'Smart Laundry Tracking System',
        category: 'Operations System',
        role: 'Fullstack Developer',
        tech: ['React', 'Express', 'MySQL', 'WhatsApp API'],
        link: '/#portfolio'
      },
      {
        title: 'KampEase Campus Management',
        category: 'Education Enterprise',
        role: 'Frontend Developer',
        tech: ['React', 'TypeScript', 'REST API'],
        link: '/#portfolio'
      }
    ],
    faq: [
      {
        question: 'Apakah sistem bisa disesuaikan jika alur bisnis kami berubah?',
        answer: 'Tentu. Karena kode dibangun secara custom dan modular, Anda memiliki fleksibilitas penuh untuk menambah fitur baru atau mengubah alur kerja kapan saja.'
      },
      {
        question: 'Apakah ada batasan jumlah staf atau cabang yang menggunakan?',
        answer: 'Tidak ada batasan. Anda tidak dikenakan biaya per akun karyawan atau per cabang. Anda bebas membuat user sebanyak yang dibutuhkan.'
      },
      {
        question: 'Apakah ada pelatihan untuk tim kami?',
        answer: 'Ya, setiap pengerjaan custom software sudah mencakup sesi pelatihan online untuk operator dan administrator, beserta buku panduan penggunaan ringkas.'
      }
    ],
    relatedServices: [
      { title: 'Jasa Pembuatan Website', path: '/jasa-pembuatan-website', desc: 'Website company profile dan landing page penjualan modern.' },
      { title: 'IT Consulting', path: '/it-consulting', desc: 'Konsultasi arsitektur sistem dan efisiensi teknologi.' },
      { title: 'Managed Web Hosting', path: '/hosting', desc: 'Server cloud cepat dan aman untuk sistem informasi Anda.' }
    ]
  },

  'it-consulting': {
    slug: 'it-consulting',
    metaTitle: 'Jasa IT Consulting & Strategic Advisory | 1sLabs',
    metaDescription: '1sLabs menyediakan jasa konsultasi IT profesional, audit arsitektur sistem, pemilihan teknologi teruji, dan roadmap transformasi digital untuk bisnis.',
    canonicalUrl: 'https://1slabs.my.id/it-consulting',
    h1: 'Jasa IT Consulting & Software Architecture Advisory',
    subtitle: 'Panduan strategis berbasis pengalaman nyata untuk membantu bisnis Anda memilih teknologi yang tepat dan hemat biaya.',
    badge: 'Technology Consulting',
    icon: ShieldCheck,
    problems: [
      {
        title: 'Salah Pilih Teknologi yang Mengakibatkan Pemborosan',
        desc: 'Memilih framework atau infrastruktur yang salah dapat membuat biaya pengembangan membengkak ratusan persen tanpa hasil nyata.'
      },
      {
        title: 'Sistem Sering Down Saat Traffic Mengalami Lonjakan',
        desc: 'Kurangnya perencanaan arsitektur server membuat aplikasi lambat dan tumbang ketika pelanggan datang bersamaan.'
      },
      {
        title: 'Kesulitan Mengelola Vendor atau Tim Developer',
        desc: 'Ketidaktahuan aspek teknis sering membuat pemilik bisnis kesulitan mengawasi kualitas kode dan estimasi biaya vendor.'
      }
    ],
    scope: [
      'Audit Arsitektur Software & Review Kualitas Source Code',
      'Evaluasi Pemilihan Tech Stack (React, Next.js, Laravel, Python, Database)',
      'Optimasi Query Database & Penurunan Waktu Respon Server (Latency)',
      'Perencanaan Infrastruktur Cloud (VPS, Docker, CDN, Security SSL)',
      'Konsultasi Integrasi Model AI & Otomasi Alur Kerja',
      'Pendampingan Teknis Negosiasi & Pengawasan Vendor IT'
    ],
    workflow: [
      { step: '01', title: 'Problem Discovery Session', desc: 'Mengidentifikasi bottleneck teknologi, kendala performa, atau rencana pengembangan.' },
      { step: '02', title: 'Technical Audit & Profiling', desc: 'Memeriksa source code, konfigurasi server, skema database, dan beban sistem.' },
      { step: '03', title: 'Architecture Blueprint', desc: 'Menyusun dokumen rekomendasi solusi teknis terstruktur dengan opsi biaya realistis.' },
      { step: '04', title: 'Implementation Guidance', desc: 'Mendampingi tim internal atau vendor dalam mengeksekusi perbaikan arsitektur.' },
      { step: '05', title: 'Review & Quality Sign-Off', desc: 'Memverifikasi bahwa performa, keamanan, dan keandalan sistem telah meningkat.' }
    ],
    pricingGuidance: {
      basePrice: 'Mulai dari Rp750.000 / sesi',
      pricingNote: 'Tersedia paket konsultasi per sesi atau retainer bulanan.',
      factors: [
        'Cakupan audit (aplikasi web tunggal vs multi-server)',
        'Kedalaman audit keamanan & optimasi performa database',
        'Durasi pendampingan konsultasi'
      ]
    },
    portfolioExamples: [
      {
        title: 'Inpartner Consulting',
        category: 'Enterprise IT Advisory',
        role: 'Software Engineer',
        tech: ['Enterprise Solutions', 'IT Architecture', 'Process Automation'],
        link: 'https://inpartner.id'
      },
      {
        title: 'UIN Sunan Gunung Djati Library API',
        category: 'System Integration',
        role: 'IT Support & Developer',
        tech: ['PHP', 'MySQL', 'Database Migration', 'API Bridge'],
        link: '/#portfolio'
      },
      {
        title: 'Vocallet AI Architecture',
        category: 'AI Research & Deployment',
        role: 'AI Engineer (Top 15 Nasional)',
        tech: ['Python', 'TensorFlow', 'FastAPI', 'Cloud Server'],
        link: '/#portfolio'
      }
    ],
    faq: [
      {
        question: 'Kapan bisnis saya membutuhkan jasa IT Consulting?',
        answer: 'Ketika Anda berencana membangun sistem baru dan ingin menghindari salah pilih teknologi, saat sistem existing sering bermasalah atau lambat, atau saat Anda membutuhkan pihak ketiga yang objektif untuk mengaudit pekerjaan vendor IT.'
      },
      {
        question: 'Apakah konsultasi bisa dilakukan secara online?',
        answer: 'Ya. Seluruh sesi konsultasi dapat dilakukan secara daring melalui Google Meet atau Zoom, dilengkapi rekaman sesi dan dokumen rangkuman rekomendasi teknis.'
      },
      {
        question: 'Apakah 1sLabs juga bisa mengeksekusi perbaikan teknisnya?',
        answer: 'Bisa. Selain memberikan rekomendasi arsitektur, tim rekayasa software 1sLabs juga dapat langsung mengimplementasikan solusi yang telah disepakati.'
      }
    ],
    relatedServices: [
      { title: 'Jasa Pembuatan Website', path: '/jasa-pembuatan-website', desc: 'Pengembangan website modern dengan arsitektur teruji.' },
      { title: 'Custom Software Development', path: '/software-development', desc: 'Pembangunan software sistem bisnis yang dirancang khusus.' },
      { title: 'Managed Web Hosting', path: '/hosting', desc: 'Infrastruktur cloud server cepat dan reliabel.' }
    ]
  },

  'hosting': {
    slug: 'hosting',
    metaTitle: 'Layanan Managed Web Hosting Bisnis & Domain | 1sLabs',
    metaDescription: '1sLabs menyediakan layanan cloud hosting website bisnis dengan penyimpanan NVMe berkecepatan tinggi, backup rutin, gratis SSL, konfigurasi domain, dan bantuan deployment.',
    canonicalUrl: 'https://1slabs.my.id/hosting',
    h1: 'Layanan Managed Web Hosting & Domain untuk Bisnis',
    subtitle: 'Infrastruktur server cloud berkecepatan tinggi dengan pendampingan teknis langsung, tanpa repot mengelola konfigurasi DNS atau SSL sendiri.',
    badge: 'Reliable Cloud Infrastructure',
    icon: Server,
    problems: [
      {
        title: 'Website Lambat Akibat Hosting Murah Oversold',
        desc: 'Banyak penyedia shared hosting murah membagi satu server ke ribuan website, membuat loading time lambat dan merugikan reputasi bisnis Anda.'
      },
      {
        title: 'Konfigurasi Server & DNS yang Rumit',
        desc: 'Mengatur DNS record, SSL HTTPS, nameserver, dan alokasi database sering kali memusingkan pemilik bisnis yang tidak memiliki tim teknis internal.'
      },
      {
        title: 'Bantuan Teknis yang Lambat Saat Website Mengalami Error',
        desc: 'Ketika website Anda bermasalah, customer support tiket biasa butuh berjam-jam bahkan berhari-hari untuk merespons.'
      }
    ],
    scope: [
      'Penyimpanan High-Speed NVMe SSD (Mulai 30GB, 60GB, hingga Unlimited Storage)',
      '10 hingga Unlimited MySQL Databases Berkecepatan Tinggi',
      'Unmetered Bandwidth Berkualitas Tinggi dengan Proteksi Anti-DDoS',
      'Gratis Domain (.my.id, .web.id, atau .com sesuai paket)',
      'Sertifikat SSL Let\'s Encrypt Otomatis Aktif (HTTPS)',
      'Bantuan Penuh Setup, Deployment & Pemindahan (Migrasi) Tanpa Downtime'
    ],
    workflow: [
      { step: '01', title: 'Pilih Paket Hosting', desc: 'Pilih paket yang sesuai: Starter 30GB (Rp850rb), Business 60GB (Rp1jt), atau Professional Unlimited (Rp1,2jt).' },
      { step: '02', title: 'Setup Domain & Alokasi Server', desc: 'Kami mendaftarkan domain dan mengkonfigurasi DNS record secara instan.' },
      { step: '03', title: 'Deployment / Migrasi Website', desc: 'Kami mengunggah file website atau memindahkan data dari hosting lama Anda.' },
      { step: '04', title: 'Aktivasi SSL & Optimasi Server', desc: 'Memastikan website berstatus aman (gembok hijau) dan performa server teroptimasi.' },
      { step: '05', title: 'Serah Terima & Monitoring Uptime', desc: 'Klien menerima akses cPanel lengkap dan pemantauan server berkelanjutan.' }
    ],
    pricingGuidance: {
      basePrice: 'Rp850.000 – Rp1.200.000 / tahun',
      pricingNote: 'Harga resmi berlaku per 1 (satu) tahun penuh tanpa biaya tersembunyi.',
      factors: [
        'Kapasitas ruang simpan NVMe (30GB, 60GB, atau Unlimited)',
        'Jumlah database MySQL (10 database, 25 database, atau Unlimited)',
        'Kebutuhan alokasi resource server dan prioritas bantuan teknis'
      ]
    },
    portfolioExamples: [
      {
        title: 'Infrastruktur Platform DPD RI',
        category: 'Cloud Deployment',
        role: 'Infrastructure Setup',
        tech: ['Linux VPS', 'Nginx', 'SSL', 'PostgreSQL'],
        link: '/#portfolio'
      },
      {
        title: 'Hosting Lazismu Portal',
        category: 'Managed Web Hosting',
        role: 'Server Maintenance',
        tech: ['cPanel', 'MySQL', 'Automated Backup'],
        link: '/#portfolio'
      },
      {
        title: 'Menu1s Digital Catalog',
        category: 'Web App Hosting',
        role: 'Deployment & Domain',
        tech: ['Cloud Hosting', 'SSL', 'CDN'],
        link: '/#portfolio'
      }
    ],
    faq: [
      {
        question: 'Apakah paket hosting sudah termasuk nama domain?',
        answer: 'Ya, seluruh paket tahunan sudah mencakup bantuan pendaftaran dan konfigurasi domain resmi (paket Business dan Professional mencakup free domain .com/.id selama 1 tahun).'
      },
      {
        question: 'Apakah tim 1sLabs membantu proses pemindahan dari hosting lama?',
        answer: 'Ya, kami membantu proses migrasi file dan database website Anda dari hosting lama ke server 1sLabs secara gratis tanpa membuat website mati lama.'
      },
      {
        question: 'Bagaimana jika website membutuhkan VPS khusus atau spek lebih besar?',
        answer: 'Kami menyediakan konfigurasi server mandiri (Virtual Private Server) berbasis Ubuntu/Debian untuk aplikasi dengan kebutuhan komputasi tinggi atau backend Python/Node.js.'
      }
    ],
    relatedServices: [
      { title: 'Jasa Pembuatan Website', path: '/jasa-pembuatan-website', desc: 'Paket pembuatan website baru siap online.' },
      { title: 'Custom Software Development', path: '/software-development', desc: 'Aplikasi kasir POS dan sistem informasi bisnis.' },
      { title: 'IT Consulting', path: '/it-consulting', desc: 'Audit dan rekomendasi infrastruktur sistem.' }
    ]
  }
};

interface ServiceLandingPageProps {
  serviceKey: 'web-dev' | 'custom-software' | 'it-consulting' | 'hosting';
}

export const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ serviceKey }) => {
  const config = servicesConfig[serviceKey];
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [serviceKey]);

  if (!config) return null;

  const ServiceIcon = config.icon;

  const handleWhatsApp = (context?: string) => {
    const text = encodeURIComponent(
      `Halo 1sLabs, saya membaca halaman layanan ${config.h1}. ${context || 'Saya ingin konsultasi dan meminta estimasi biaya proyek.'}`
    );
    window.open(`https://wa.me/6285156296580?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 py-3 px-3 sm:px-6 lg:px-8">
      {/* Helmet SEO Metadata */}
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="title" content={config.metaTitle} />
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={config.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={config.canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="1sLabs" />

        {/* Twitter */}
        <meta name="twitter:title" content={config.metaTitle} />
        <meta name="twitter:description" content={config.metaDescription} />
        <meta name="twitter:url" content={config.canonicalUrl} />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://1slabs.my.id/"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": config.h1,
                    "item": config.canonicalUrl
                  }
                ]
              },
              {
                "@type": "Service",
                "name": config.h1,
                "provider": {
                  "@type": "Organization",
                  "name": "1sLabs",
                  "url": "https://1slabs.my.id/"
                },
                "serviceType": config.badge,
                "description": config.metaDescription,
                "areaServed": "Indonesia",
                "url": config.canonicalUrl
              }
            ]
          })}
        </script>
      </Helmet>

      <Header />

      <div className="max-w-[1200px] mx-auto min-h-screen relative -mt-[80px] pt-24 sm:pt-28">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 text-xs text-neutral-500 flex items-center gap-2">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-neutral-900 dark:text-white font-medium line-clamp-1">{config.h1}</span>
        </nav>

        {/* Hero Section */}
        <section className="rounded-3xl p-6 sm:p-10 md:p-12 bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 mb-10 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4 font-['Mori',_sans-serif] leading-tight">
              {config.h1}
            </h1>
            
            <p className="text-xs sm:text-base md:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 sm:mb-8">
              {config.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleWhatsApp('Saya ingin konsultasi gratis.')}
                className="inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Konsultasi Gratis via WhatsApp
              </Button>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
              </Link>
            </div>
          </div>
        </section>

        {/* Problem & Solution Grid */}
        <section className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-['Mori',_sans-serif]">
              Masalah Bisnis yang Kami Selesaikan
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Jangan biarkan kendala teknologi menghambat efisiensi dan potensi omset bisnis Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
            {config.problems.map((prob, idx) => (
              <div key={idx} className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold mb-3">
                  0{idx + 1}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-1.5">
                  {prob.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {prob.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Scope of Deliverables & Pricing */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 mb-12 items-start">
          
          {/* Scope Card */}
          <section className="lg:col-span-7 p-5 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 font-['Mori',_sans-serif]">
              Ruang Lingkup &amp; Fasilitas yang Anda Dapatkan
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Seluruh pekerjaan dikerjakan dengan standar industri profesional dan transparansi total.
            </p>

            <div className="space-y-3">
              {config.scope.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-neutral-800 dark:text-neutral-200 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing Guidance */}
          <section className="lg:col-span-5 p-5 sm:p-8 rounded-3xl bg-neutral-900 text-white dark:bg-neutral-800 border-2 border-blue-500/60 shadow-lg">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2">
              Estimasi Biaya Transparan
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-['Mori',_sans-serif] mb-1">
              {config.pricingGuidance.basePrice}
            </div>
            <p className="text-xs text-neutral-300 mb-4 pb-4 border-b border-neutral-700/60">
              {config.pricingGuidance.pricingNote}
            </p>

            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Faktor Penentu Biaya:
            </div>
            <ul className="space-y-2 mb-6">
              {config.pricingGuidance.factors.map((f, i) => (
                <li key={i} className="text-xs text-neutral-200 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleWhatsApp('Saya ingin meminta rincian penawaran biaya.')}
              className="w-full py-2.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500"
            >
              Minta Penawaran Biaya Sekarang
            </Button>
          </section>

        </div>

        {/* Workflow Steps */}
        <section className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-['Mori',_sans-serif]">
              Alur Kerja Pengerjaan Sistematis
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Setiap langkah terstruktur dan terdokumentasi agar proyek selesai tepat waktu dan sesuai ekspektasi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {config.workflow.map((wf, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
                <div className="text-blue-600 dark:text-blue-400 text-xs font-bold font-mono mb-2">
                  {wf.step}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white mb-1">
                  {wf.title}
                </h3>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                  {wf.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Verified Portfolio Showcase */}
        <section className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-['Mori',_sans-serif]">
              Contoh Proyek Terverifikasi yang Relevan
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Hasil kerja nyata yang pernah dibangun oleh tim rekayasa kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {config.portfolioExamples.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mt-1 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Peran: {item.role}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tech.map((t, ti) => (
                      <span key={ti} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Specific FAQ */}
        <section className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-2 font-['Mori',_sans-serif]">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Jawaban transparan untuk membantu Anda mengambil keputusan yang tepat.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {config.faq.map((item, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 dark:text-white mb-2">
                  {item.question}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal Linking to Other Services */}
        <section className="p-6 sm:p-8 rounded-3xl bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 mb-12">
          <h2 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 font-['Mori',_sans-serif]">
            Jelajahi Layanan Teknologi 1sLabs Lainnya
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Dapatkan integrasi menyeluruh antara software, website, arsitektur sistem, dan cloud hosting.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {config.relatedServices.map((rel, idx) => (
              <Link
                key={idx}
                to={rel.path}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-500/50 transition-all group"
              >
                <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center justify-between mb-1 group-hover:text-blue-600 transition-colors">
                  {rel.title} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {rel.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Final Conversion CTA */}
        <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-neutral-900 to-slate-900 text-white mb-12 relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 font-['Mori',_sans-serif]">
              Mulai Konsultasi Kebutuhan Anda Hari Ini
            </h2>
            <p className="text-xs sm:text-base text-neutral-300 mb-6 leading-relaxed">
              Diskusikan kebutuhan proyek, tantangan bisnis, dan estimasi waktu bersama tim rekayasa teknologi 1sLabs tanpa komitmen awal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleWhatsApp('Saya ingin diskusi proyek sekarang.')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2 inline" /> Chat via WhatsApp
              </Button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium border border-neutral-700 transition-colors"
              >
                Lihat Semua Portofolio
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};
