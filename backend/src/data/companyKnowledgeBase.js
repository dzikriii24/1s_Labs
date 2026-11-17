/**
 * 1sLabs Verified Company Knowledge Base (14 Categories)
 *
 * Strictly grounded in verified source files, routes, UI components, services, and documentation
 * inside C:\Users\dzikri\Downloads\1sLabs-website.
 *
 * Verification statuses:
 * - 'verified': Explicitly backed by source code, routes, or official public site copy.
 * - 'needs_verification': Internal inconsistency found across files (e.g., pricing/duration) or
 *   company marketing text without code-level enforcement; AI must NOT invent or overstate.
 *
 * Forbidden claims list prevents hallucinations during AI generation and triggers Quality Gate flags.
 */

const COMPANY_KNOWLEDGE_SEED = [
  {
    entry_key: 'company_profile',
    category_number: 1,
    category_label: 'Company Profile',
    title: 'Profil Resmi 1sLabs',
    verification_status: 'verified',
    source_reference: 'index.html, src/components/sections/About.tsx, public/llms.txt, src/pages/InvoicePage.tsx',
    summary: '1sLabs adalah tim engineering teknologi Indonesia yang mengembangkan website, custom software, integrasi AI, dan mengoperasikan platform cloud hosting mandiri dengan prinsip Pay Once untuk pembangunan custom.',
    facts: [
      { label: 'Nama Brand', value: '1sLabs (penulisan copy juga memakai 1s Labs)', status: 'verified' },
      { label: 'Website Resmi', value: 'https://1slabs.my.id/', status: 'verified' },
      { label: 'Lokasi Operasional', value: 'Bandung, Jawa Barat, Indonesia', status: 'verified' },
      { label: 'Jam Layanan', value: 'Senin–Sabtu, 08:00–21:00 WIB (berdasarkan JSON-LD situs)', status: 'verified' },
      { label: 'Bentuk Badan / Sebutan', value: 'Gunakan "tim engineer 1sLabs" (hindari menyebut badan PT sebelum konfirmasi legal formal; llms.txt menyebut "PT / Engineering Team")', status: 'needs_verification' },
      { label: 'Lokasi & Tier Datacenter', value: 'IP server produksi 103.119.237.132; README menyebut Tier-3 Jakarta namun tidak diverifikasi lewat kode server', status: 'needs_verification' }
    ],
    content_markdown: '1sLabs berfokus menjembatani rekayasa perangkat lunak modern dengan kepemilikan aset digital penuh tanpa biaya langganan software berulang (Pay Once), serta menyediakan platform panel hosting untuk developer dan bisnis Indonesia.'
  },
  {
    entry_key: 'services_overview',
    category_number: 2,
    category_label: 'Services',
    title: 'Daftar Layanan Utama 1sLabs',
    verification_status: 'verified',
    source_reference: 'src/components/sections/Services.tsx, src/pages/ServiceLandingPage.tsx, public/llms.txt',
    summary: 'Layanan inti meliputi Web Development, Custom Business Software, API & System Integration, AI & Workflow Automation, Cloud/VPS & Managed Hosting, Database Management, Annual Website Maintenance, dan IT Consulting.',
    facts: [
      { label: 'Jasa Pembuatan Website', value: '/jasa-pembuatan-website', status: 'verified' },
      { label: 'Custom Software Development', value: '/software-development', status: 'verified' },
      { label: 'Managed Web Hosting', value: '/hosting', status: 'verified' },
      { label: 'IT Consulting & Audit', value: '/it-consulting', status: 'verified' },
      { label: 'Free Plan Developer Program', value: '/portal?tab=freeplan', status: 'verified' },
      { label: 'Annual Website Maintenance', value: 'Pemeliharaan tahunan mencakup bug fix, patching dependensi, tuning database, dan backup; menerima website buatan pihak lain setelah technical assessment', status: 'verified' },
      { label: 'Mobile App Development', value: 'Tidak ditawarkan di situs live saat ini — jangan diklaim', status: 'needs_verification' }
    ],
    content_markdown: 'Seluruh layanan custom software dan website dibangun dengan stack modern seperti React.js, Next.js, TypeScript, Tailwind CSS, Node.js Express, PHP/Laravel, Python, PostgreSQL, dan MySQL.'
  },
  {
    entry_key: 'hosting_products',
    category_number: 3,
    category_label: 'Hosting Products',
    title: 'Produk Managed Cloud Hosting 1sLabs',
    verification_status: 'verified',
    source_reference: 'src/components/sections/Hosting.tsx, src/pages/HostingPlanDetailPage.tsx, backend/src/routes/plans.routes.js, nodejs.routes.js, laravel.routes.js, database.routes.js',
    summary: 'Platform panel hosting yang dibangun sendiri dengan Node.js & Laravel app manager, File Manager web + drag-and-drop + extract ZIP, MySQL manager + daily DB backup, FTP, visitor analytics, dan pembayaran QRIS.',
    facts: [
      { label: 'Paket yang Tersedia', value: 'Starter Hosting, Business Hosting (Recommended), Professional Hosting (data dinamis dari tabel hosting_plans)', status: 'verified' },
      { label: 'Node.js Manager', value: 'Create/start/stop/restart app, npm install, env editor, log viewer, ZIP deploy hingga 50 MB (CloudLinux Node.js Selector)', status: 'verified' },
      { label: 'Laravel Manager', value: 'ZIP deploy hingga 100 MB, PHP 8.1–8.3, artisan console, Composer install, env editor, logs', status: 'verified' },
      { label: 'File & Database Manager', value: 'Edit kode di browser, extract ZIP, akun FTP, buat DB MySQL, SQL console, export/import hingga 50 MB, backup harian (menyimpan 14 backup otomatis)', status: 'verified' },
      { label: 'Pembayaran & Aktivasi', value: 'Pembayaran via QRIS + upload bukti transfer + PPN 11%, diverifikasi admin (TIDAK ada aktivasi instan otomatis / payment gateway)', status: 'verified' },
      { label: 'Uptime 99.9% / CageFS / phpMyAdmin SSO', value: 'Tercantum pada teks marketing/UI statis namun tidak ada SLA monitor atau phpMyAdmin SSO di kode, dan semua pelanggan berbagi satu akun cPanel dengan isolasi path aplikasi', status: 'needs_verification' }
    ],
    content_markdown: 'Developer dapat mengelola aplikasi Node.js, Laravel, file website, database MySQL, subdomain, dan analitik pengunjung dari satu Customer Portal tanpa wajib menguasai SSH manual.'
  },
  {
    entry_key: 'free_hosting_program',
    category_number: 4,
    category_label: 'Free Hosting Program',
    title: 'Program Free Plan (Hosting Gratis untuk Pelajar & Developer)',
    verification_status: 'needs_verification',
    source_reference: 'backend/src/routes/freeplan.routes.js, backend/src/services/freePlan.service.js, src/components/portal/FreePlanTab.tsx, src/data/docsData.ts, public/llms.txt',
    summary: 'Program Free Plan memberikan 1 kali klaim per akun seumur hidup berupa subdomain *.1slabs.my.id dan slot Cloud Hosting dengan Node.js app untuk belajar dan deploy proyek.',
    facts: [
      { label: 'Kelayakan Klaim', value: '1 kali klaim seumur hidup per akun email terverifikasi (dijaga transaksi FOR UPDATE di free_plan_claims)', status: 'verified' },
      { label: 'Syarat & Fair Usage Policy', value: 'Dilarang untuk phishing, malware, brute-force, crypto mining, atau konten ilegal', status: 'verified' },
      { label: 'Masa Aktif Free Hosting & Storage (Konflik Sumber)', value: 'Perlu verifikasi pemilik: FreePlanTab & query DB freePlan.service.js menetapkan hosting 14 hari, sementara docsData.ts & llms.txt menulis 1 GB NVMe selama 30 hari yang dapat diperpanjang gratis. Hindari menyebut angka durasi sepihak.', status: 'needs_verification' }
    ],
    content_markdown: 'Fokus narasi aman untuk Free Plan adalah mengajak pelajar dan developer pemula berlatih deploy aplikasi frontend maupun Node.js API tanpa biaya awal atau kartu kredit melalui /portal?tab=freeplan.'
  },
  {
    entry_key: 'free_domain_program',
    category_number: 5,
    category_label: 'Free Domain Program',
    title: 'Program Subdomain Gratis & Dukungan Custom Domain',
    verification_status: 'needs_verification',
    source_reference: 'backend/src/services/freePlan.service.js, backend/src/routes/domains.routes.js, src/data/docsData.ts, src/pages/ServiceLandingPage.tsx',
    summary: 'Program gratis menyediakan subdomain {pilihan}.1slabs.my.id otomatis via cPanel, sedangkan domain TLD (.com/.id) dimiliki klien atau dihubungkan lewat DNS A Record / Nameserver.',
    facts: [
      { label: 'Subdomain Gratis Resmi', value: 'Format namaanda.1slabs.my.id dengan pengecekan ketersediaan real-time di portal', status: 'verified' },
      { label: 'Parameter DNS 1sLabs', value: 'IP Server 103.119.237.132 atau Nameserver ns1.domainmurah.net dan ns2.domainmurah.net', status: 'verified' },
      { label: 'Kepemilikan Domain TLD & Masa Aktif Subdomain Free Plan', value: 'Tidak ada API registrar domain otomatis (klien membawa domain atau memesan lewat pendampingan). Masa aktif subdomain di UI/email tertulis 1 tahun sedangkan query domain_reservations di freePlan.service.js tertulis 1 bulan; klaim "free .com di Business/Professional" pada ServiceLandingPage perlu konfirmasi pemilik.', status: 'needs_verification' }
    ],
    content_markdown: 'Pengguna dapat langsung online menggunakan subdomain *.1slabs.my.id atau mengarahkan custom domain dari registrar eksternal melalui A Record atau Nameserver.'
  },
  {
    entry_key: 'website_development',
    category_number: 6,
    category_label: 'Website Development',
    title: 'Layanan Jasa Pembuatan Website Profesional',
    verification_status: 'verified',
    source_reference: 'src/pages/ServiceLandingPage.tsx (web-dev), src/components/sections/Services.tsx',
    summary: 'Pembuatan company profile, landing page konversi tinggi, portal berita, toko online, dan web app modern berkonsep Pay Once dengan optimasi SEO teknis.',
    facts: [
      { label: 'Alur Kerja 5 Tahap', value: '1. Discovery & Consultation -> 2. UI/UX Wireframing -> 3. Clean Development -> 4. Testing & SEO Audit -> 5. Deployment & Handover', status: 'verified' },
      { label: 'Tech Stack Utama', value: 'React.js, Next.js, TypeScript, Tailwind CSS, Node.js, PHP/Laravel, PostgreSQL/MySQL', status: 'verified' },
      { label: 'Estimasi Waktu Copy Situs', value: '5–10 hari kerja (landing/company profile standar) atau 2–4 minggu (web app kompleks)', status: 'verified' },
      { label: 'Harga Awal di Landing Page', value: 'Tercantum "Mulai dari Rp1.500.000" (tergantung kompleksitas halaman & integrasi) — perlu konfirmasi sebelum mengklaim harga tetap', status: 'needs_verification' }
    ],
    content_markdown: 'Setiap proyek menekankan tampilan responsif mobile-first, metadata SEO on-page, sitemap XML, serta serah terima hak penuh source code kepada klien.'
  },
  {
    entry_key: 'software_development',
    category_number: 7,
    category_label: 'Software Development',
    title: 'Layanan Custom Business Software & Integrasi Sistem',
    verification_status: 'verified',
    source_reference: 'src/pages/ServiceLandingPage.tsx (custom-software), src/components/sections/Services.tsx',
    summary: 'Pengembangan software bisnis yang mengikuti SOP unik perusahaan (POS/kasir, inventori & gudang, ERP/CRM, sistem akademik/perpustakaan SLiMS, integrasi API & AI) tanpa biaya lisensi per karyawan.',
    facts: [
      { label: 'Cakupan Fitur Utama', value: 'Dashboard operasional, kontrol stok & gudang, Role-Based Access Control (RBAC), ekspor PDF/Excel/CSV, integrasi API/webhook & payment gateway', status: 'verified' },
      { label: 'Model Kepemilikan', value: 'Pay Once (sekali bayar tanpa lisensi per user bulanan untuk aplikasi custom)', status: 'verified' },
      { label: 'Harga Awal di Landing Page', value: 'Tercantum "Mulai dari Rp3.000.000" — tergantung jumlah modul & integrasi [perlu konfirmasi jika dikutip sebagai angka pasti]', status: 'needs_verification' }
    ],
    content_markdown: 'Cocok bagi bisnis yang mengalami keterbatasan software SaaS pasaran, data tersebar di spreadsheet manual, atau pembengkakan biaya lisensi per staf.'
  },
  {
    entry_key: 'it_consulting',
    category_number: 8,
    category_label: 'IT Consulting',
    title: 'Layanan IT Consulting & Arsitektur Sistem',
    verification_status: 'verified',
    source_reference: 'src/pages/ServiceLandingPage.tsx (it-consulting), src/pages/MeetingSchedulePage.tsx, Faq.tsx',
    summary: 'Konsultasi pemilihan tech stack, audit source code dan performa server/database, perencanaan infrastruktur cloud/AI, hingga pengawasan vendor IT secara objektif.',
    facts: [
      { label: 'Konsultasi Awal Gratis & Booking', value: 'Diskusi kebutuhan awal & estimasi proyek tersedia gratis via WhatsApp atau halaman jadwal /schedule (/meeting)', status: 'verified' },
      { label: 'Sesi Audit & Pendampingan Mendalam', value: 'Mencakup Technical Audit & Profiling, Architecture Blueprint, dan Review Kualitas Kode', status: 'verified' },
      { label: 'Tarif Sesi Terstruktur', value: 'Copy situs menyebut "Mulai dari Rp750.000 / sesi" [perlu konfirmasi paket aktif]', status: 'needs_verification' }
    ],
    content_markdown: 'Membantu pemilik bisnis menghindari salah pilih teknologi, bottleneck performa saat trafik melonjak, maupun risiko pengawasan vendor eksternal.'
  },
  {
    entry_key: 'portfolio_showcase',
    category_number: 9,
    category_label: 'Portfolio & Project Showcase',
    title: 'Portofolio Proyek & Klien Terverifikasi',
    verification_status: 'verified',
    source_reference: 'src/components/sections/Portfolio.tsx, ExperiencePartners.tsx, ServiceLandingPage.tsx',
    summary: 'Daftar 15 proyek yang terdokumentasi di situs resmi 1sLabs mencakup platform institusi, SaaS/UMKM, otomasi AI, POS/inventori, serta jembatan API perpustakaan.',
    facts: [
      { label: 'Enterprise & Web Platforms', value: 'DPD RI Jawa Barat (inventaris gudang & monitoring lapangan), Saffix.id (SaaS REST API), Yuk-Mari Platform (backend & TSX admin), KampEase/Unicamp (navigasi kampus)', status: 'verified' },
      { label: 'AI, Data & IoT', value: 'Vocallet (keuangan & zakat berbasis perintah suara), Autism Smart Assistant, Yareunsnap (pengolahan citra AI), Tanduria (sensor IoT pertanian)', status: 'verified' },
      { label: 'Business, POS & System Integration', value: 'Smart POS System (Java desktop), Smart Laundry App (Spring Boot), Sportify.id, Sea Salon, Canteen Go, Digital Wedding (1sUndangan), Automasi API Perpustakaan UIN (bridge OpenBiblio ke SLiMS)', status: 'verified' },
      { label: 'Batasan Klaim Portofolio', value: 'DILARANG menyertakan angka tak terverifikasi (seperti "efisiensi 80%", penghargaan Dicoding Top 15 sebagai jaminan layanan, atau memakai logo pihak ketiga seolah endorsement berbayar). Tidak ada testimoni di repo.', status: 'needs_verification' }
    ],
    content_markdown: 'Gunakan portofolio sebagai konteks kapabilitas teknis konkret (mis. arsitektur backend, API bridge, AI audio/image, dashboard operasional), bukan klaim ROI bisnis fiktif.'
  },
  {
    entry_key: 'pricing_terms',
    category_number: 10,
    category_label: 'Pricing & Terms',
    title: 'Kebijakan Harga, Pembayaran QRIS & Ketentuan Layanan',
    verification_status: 'needs_verification',
    source_reference: 'deploy/update_plans.sql, src/components/sections/Hosting.tsx, ServiceLandingPage.tsx, backend/src/routes/orders.routes.js',
    summary: 'Custom software menggunakan prinsip Pay Once; hosting dibayar tahunan lewat QRIS + PPN 11% dengan verifikasi admin. Terdapat perbedaan angka harga paket hosting di kode sumber sehingga wajib ditandai untuk verifikasi.',
    facts: [
      { label: 'Pajak & Metode Pembayaran Hosting', value: 'QRIS manual upload bukti bayar + PPN 11%, diverifikasi admin (pesanan mengunci reservasi domain selama 24 jam)', status: 'verified' },
      { label: 'Perbedaan Harga Paket Hosting di Sumber', value: 'Fallback UI Hosting.tsx menulis Rp750rb / Rp970rb / Rp1,12jt per tahun; sedangkan ServiceLandingPage & deploy/update_plans.sql menulis Rp850rb / Rp1jt / Rp1,2jt per tahun (Starter 30GB/10DB, Business 60GB/25DB, Professional Unlimited). Sumber utama sebenarnya adalah tabel hosting_plans di DB.', status: 'needs_verification' },
      { label: 'Prinsip Custom Software', value: 'Pay Once: 100% kepemilikan source code, database, dan aset digital diserahkan ke klien tanpa biaya langganan SaaS bulanan', status: 'verified' }
    ],
    content_markdown: 'Saat menyebut harga pada artikel, gunakan frasa "mulai dari" sesuai konteks umum atau arahkan pembaca ke halaman paket resmi /hosting dan konsultasi agar tidak salah mengutip angka promo/paket terbaru.'
  },
  {
    entry_key: 'faq_items',
    category_number: 11,
    category_label: 'Frequently Asked Questions',
    title: 'FAQ Resmi Pelanggan & Klien 1sLabs',
    verification_status: 'verified',
    source_reference: 'src/components/sections/Faq.tsx, src/pages/ServiceLandingPage.tsx',
    summary: 'Pertanyaan yang paling sering diajukan meliputi alur pengerjaan website, konsep Pay Once, ketersediaan konsultasi gratis, migrasi hosting lama, dan garansi bug-fix pasca rilis.',
    facts: [
      { label: 'Konsultasi Awal Gratis', value: 'Tersedia via WhatsApp atau sesi Google Meet (/schedule) tanpa ikatan kontrak awal', status: 'verified' },
      { label: 'Kepemilikan Source Code', value: '100% kode sumber, desain, dan akses database menjadi milik klien setelah serah terima proyek Pay Once', status: 'verified' },
      { label: 'Migrasi Website Lama', value: 'Tim 1sLabs membantu memindahkan file dan database dari hosting lama ke server 1sLabs (hindari mengklaim "zero-downtime" mutlak karena belum ada mekanisme otomatis khusus di kode)', status: 'verified' },
      { label: 'Garansi & Maintenance', value: 'Tersedia masa perbaikan bug pasca-rilis sesuai kesepakatan proyek, serta paket pemeliharaan tahunan', status: 'verified' }
    ],
    content_markdown: 'FAQ di FAQ Section dapat dijadikan inspirasi blok Tanya Jawab / schema FAQPage di akhir artikel blog agar ramah AI Search (GEO).'
  },
  {
    entry_key: 'customer_benefits',
    category_number: 12,
    category_label: 'Customer Benefits',
    title: 'Keunggulan Nyata & Nilai Tambah untuk Pelanggan',
    verification_status: 'verified',
    source_reference: 'marketing-video/brand/brand-context.md, About.tsx, Product Catalog',
    summary: 'Keunggulan yang terbukti secara langsung di kode dan alur layanan 1sLabs.',
    facts: [
      { label: 'Pay Once Ownership', value: 'Bebas biaya sewa platform bulanan untuk software/website custom; aset sepenuhnya milik bisnis', status: 'verified' },
      { label: 'Panel Manajemen Runtime Mandiri', value: 'Kelola aplikasi Node.js & Laravel, upload ZIP, file manager, database, FTP, dan analitik dalam satu portal web tanpa harus mahir SSH', status: 'verified' },
      { label: 'Pembayaran Lokal QRIS', value: 'Mendukung seluruh aplikasi Mobile Banking & e-Wallet Indonesia dengan faktur resmi PPN 11%', status: 'verified' },
      { label: 'Program Belajar Free Plan', value: 'Pelajar & pemula dapat mencoba deploy web & Node.js API lewat subdomain *.1slabs.my.id tanpa biaya awal', status: 'verified' },
      { label: 'Komunikasi Langsung dengan Tim Engineer', value: 'Dibangun langsung oleh tim engineer yang juga mengoperasikan infrastrukturnya, bukan sekadar reseller pasif', status: 'verified' }
    ],
    content_markdown: 'Tekankan manfaat konkret ini daripada slogan kosong seperti "terbaik di Indonesia" atau "solusi revolusioner".'
  },
  {
    entry_key: 'contact_and_cta',
    category_number: 13,
    category_label: 'Contact & CTA',
    title: 'Saluran Kontak Resmi & Internal Link Tujuan CTA',
    verification_status: 'verified',
    source_reference: 'Contact.tsx, Footer.tsx, App.tsx, public/llms.txt',
    summary: 'Seluruh tautan internal dan kontak bisnis resmi yang valid untuk dipakai dalam artikel blog.',
    facts: [
      { label: 'WhatsApp Resmi', value: '+62 851-5629-6580 (https://wa.me/6285156296580)', status: 'verified' },
      { label: 'Email Bisnis Resmi', value: 'info@1slabs.my.id (catatan: Faq.tsx juga pernah mencantumkan 1slabs.id@gmail.com; utamakan info@1slabs.my.id)', status: 'verified' },
      { label: 'Instagram Resmi', value: '@1slabs.id', status: 'verified' },
      { label: 'Halaman Publik Valid untuk Internal Link', value: '/, /blog, /docs, /hosting, /jasa-pembuatan-website, /software-development, /it-consulting, /schedule, /portal?tab=freeplan, /register', status: 'verified' }
    ],
    content_markdown: 'Setiap artikel wajib memakai minimal 2 internal link valid di atas dan minimal 1 CTA relevan yang mengajak pembaca mencoba layanan atau berdiskusi gratis.'
  },
  {
    entry_key: 'existing_article_topics',
    category_number: 14,
    category_label: 'Existing Article Topics',
    title: 'Topik Artikel & Dokumentasi yang Sudah Ada di Ekosistem 1sLabs',
    verification_status: 'verified',
    source_reference: 'src/data/docsData.ts, backend/src/services/blog/blogSchema.service.js',
    summary: 'Daftar kategori blog, topic clusters awal, dan panduan dokumentasi yang telah tersedia agar artikel baru saling melengkapi dan tidak tumpang tindih.',
    facts: [
      { label: 'Kategori Blog Tersedia', value: 'Web Development (/blog?category=web-development), Custom Software, Cloud & Hosting, AI & Automation, SEO & GEO, Engineering Guide', status: 'verified' },
      { label: 'Topik Dokumentasi Resmi (/docs)', value: 'Mengenal 1sLabs, Membuat Akun & Verifikasi, Mengenal Free Plan, Klaim & Renewal Free Plan, Custom Domain & DNS, SSL & HTTPS, File Manager & Document Root, Deploy React/Vue/Vite, Node.js Selector & Restart, Koneksi MySQL aman, Alur QRIS, Annual Website Maintenance, Keamanan Akun', status: 'verified' }
    ],
    content_markdown: 'Artikel blog sebaiknya berfungsi sebagai panduan edukatif, perbandingan strategis, dan studi kasus yang menautkan ke panduan teknis praktis di /docs maupun halaman layanan terkait.'
  }
];

const FORBIDDEN_CLAIMS_RULES = [
  {
    id: 'fake_scale_metrics',
    label: 'Angka Skala Fiktif (200+ klien / 500+ proyek / 10+ tahun / 25+ ahli)',
    patterns: [/\b200\+\s*(active\s*)?(clients?|klien)/i, /\b500\+\s*(projects?|proyek)/i, /\b10\+\s*(years?|tahun)\s*(experience|pengalaman)?/i, /\b25\+\s*(team\s*)?(experts?|ahli|tim)/i],
    reason: 'Angka hard-coded tidak berbukti pada Stats.tsx; dilarang keras digunakan.'
  },
  {
    id: 'unverified_sla_hardware',
    label: 'Klaim Teknis Statis Tanpa Bukti (Anti-DDoS L3/4/7 / 1 Gbps / LiteSpeed Enterprise / CageFS per akun)',
    patterns: [/anti[-\s]?ddos\s*layer\s*3\/4\/7/i, /\b1\s*gbps\b/i, /\bcagefs\b/i, /phpmyadmin\s*sso/i],
    reason: 'Belum didukung implementasi teknis di codebase backend saat ini.'
  },
  {
    id: 'instant_activation_claim',
    label: 'Klaim Aktivasi Instan Pembayaran Hosting',
    patterns: [/aktivasi\s+instan/i, /instant\s+activation/i, /otomatis\s+aktif\s+tanpa\s+verifikasi/i],
    reason: 'Pembayaran menggunakan QRIS manual dengan upload bukti transfer dan verifikasi admin.'
  },
  {
    id: 'free_com_domain_in_free_plan',
    label: 'Klaim Domain Gratis .com Tanpa Syarat / pada Free Plan',
    patterns: [/free\s+plan.*domain\s+gratis\s+\.com/i, /domain\s+\.com\s+gratis.*free\s+plan/i],
    reason: 'Program Free Plan menyediakan subdomain *.1slabs.my.id, bukan domain .com gratis.'
  },
  {
    id: 'free_forever_claim',
    label: 'Klaim Durasi Gratis Selamanya Tanpa Perpanjangan / Batas Uji Coba',
    patterns: [/gratis\s+selamanya/i, /lifetime\s+free\s+(hosting|plan)/i, /tanpa\s+perpanjangan\s+selamanya/i],
    reason: 'Durasi Free Plan memiliki siklus uji coba/perpanjangan yang perlu dikonfirmasi, bukan klaim gratis selamanya.'
  },
  {
    id: 'placeholder_text',
    label: 'Teks Placeholder / Draft Belum Selesai',
    patterns: [/lorem\s+ipsum/i, /\[\s*(isi|insert|todo|placeholder|harga|nama)[^\]]*\]/i, /\bTBD\b/, /\bTODO:\b/i],
    reason: 'Draft masih mengandung placeholder yang belum dilengkapi.'
  },
  {
    id: 'unverified_uin_80_pct',
    label: 'Klaim Efisiensi 80% Studi Kasus UIN',
    patterns: [/efisiensi.*80%/i, /up\s+to\s+80%\s+transfer/i],
    reason: 'Angka efisiensi 80% berasal dari klaim mandiri tanpa metrik verifikasi.'
  }
];

const VERIFIED_INTERNAL_PATHS = [
  '/',
  '/blog',
  '/artikel',
  '/docs',
  '/hosting',
  '/jasa-pembuatan-website',
  '/software-development',
  '/it-consulting',
  '/schedule',
  '/portal?tab=freeplan',
  '/register',
  '/workplace-policy',
  '/#portfolio',
  '/#contact',
  '/#faq'
];

module.exports = {
  COMPANY_KNOWLEDGE_SEED,
  FORBIDDEN_CLAIMS_RULES,
  VERIFIED_INTERNAL_PATHS
};
