# Migration Mapping: Kim Holiday Article Management & SEO Intelligence to 1sLabs

> **Dokumen ini dibuat pada fase audit sebelum implementasi** untuk memetakan secara menyeluruh arsitektur sumber (`KimHolidayTravel-SC`), arsitektur target (`1sLabs-website`), pemetaan database, pemetaan endpoint API, dependensi, risiko kompatibilitas, serta tahapan implementasi agar seluruh kapabilitas editorial, SEO/Readability/GEO Intelligence, Gemini AI Consultant, Google Search Console, dan Editorial Kanban dapat berjalan native pada infrastruktur 1sLabs.

---

## 1. Arsitektur Sumber (Kim Holiday Travel)

Project referensi `KimHolidayTravel-SC` dibangun di atas stack tradisional LAMP/MPA:

- **Frontend / Presentation:** Static Multi-Page HTML + Tailwind CSS (CDN/DaisyUI) + Vanilla JavaScript + jQuery + FontAwesome Icons + SortableJS (Kanban).
  - Halaman publik: `src/pages/artikel.html`, `src/pages/artikel-detail.html`.
  - Halaman admin & editor: `src/pages/admin.html`, `src/pages/admin-artikel-editor.html`.
- **Backend / API:** PHP 8+ prosedural berbasis PDO (`api/db.php`, `api/articles.php`, `api/seo.php`, `api/sitemap.php`, `api/robots.php`) dengan autentikasi hash admin tunggal (`AUTH_HASH`) dan eksekusi routing via `.htaccess` + `router.php`.
- **Database:** MySQL/MariaDB (`u1zh8984_s6_kimhtravel`) dengan tabel `articles`, `article_categories`, `gsc_settings`, `gsc_performance`, `topic_clusters`, `seo_content_ideas`, dan `seo_redirects`.
- **AI & Search Console Integration:**
  - Gemini REST API via PHP `curl` dengan multi-model fallback, JSON extractor, deterministic SEO/Readability/GEO scoring (`analyzeSeoReadabilityGeo`), serta One-Click Optimizer dengan diff preview dan snapshot revert in-memory.
  - Google Search Console OAuth 2.0 via `api/seo.php?action=gsc_*`.
- **Media Storage:** Lokal disk di `uploads/articles/`.

---

## 2. Arsitektur Target (1sLabs Website & Platform)

Project target `1sLabs-website` (`https://1slabs.my.id/`) menggunakan arsitektur modern SPA + Modular REST API yang juga melayani portal pelanggan hosting, HR recruitment, dan B2B lead acquisition:

- **Frontend:**
  - React `18.3.1` + TypeScript `5.5.3` + Vite `5.4.2`.
  - Routing: `react-router-dom` `7.8.2` (`BrowserRouter`, lazy-loaded pages).
  - SEO Head Management: `react-helmet-async` `2.0.5` sudah terpasang di `src/App.tsx`.
  - Styling & Design System: Tailwind CSS `3.4.1`, font `Inter` (`Plus Jakarta Sans` / `Bodoni Moda` sekunder), skema warna dominan **White (`bg-white` / `bg-zinc-50`)** dengan aksen **Light Blue / Blue (`primary-50` `#eff6ff` s/d `primary-600` `#2563eb`)**, dark-mode support (`darkMode: 'class'`), ikon `lucide-react` `0.344.0`, notifikasi SweetAlert2 via `src/lib/notify.ts`.
  - Admin Dashboard: `src/pages/AdminDashboardPage.tsx` + `src/components/admin/AdminLayout.tsx` + `src/components/admin/AdminSidebar.tsx` dengan kontrol akses RBAC (`super_admin` / `admin` dan `marketing`) melalui `AuthContext`.
  - Dokumentasi eksisting: `src/pages/DocumentationPage.tsx` dan `src/components/admin/views/DocsManagementView.tsx` menggunakan tabel `documentation_articles` (tetap dipertahankan terpisah agar fitur dokumentasi layanan tidak terganggu).
- **Backend:**
  - Node.js + Express `4.19.2` (`backend/index.js`) berjalan di atas CloudLinux Phusion Passenger (`PassengerAppRoot /home/u1zh8984/oneslabs-backend`, `PassengerBaseURI /api`, Node v22).
  - Database driver: `mysql2/promise` (`backend/src/db.js`) terhubung ke database `u1zh8984_oneslabs`.
  - Autentikasi & RBAC: JWT (`jsonwebtoken`) + `requireAuth` & `requireAdminOrMarketing` di `backend/src/middleware/auth.js`.
  - File Upload: `multer` (`backend/uploads` di-symlink ke `public_html/1slabs.my.id/uploads`).
  - AI Service eksisting: `backend/src/services/marketing/gemini.service.js` sudah membaca `process.env.GEMINI_API`, memaksa DNS IPv4-first untuk kompabilitas cPanel, dan mencatat log token/latensi di `marketing_ai_logs`.
- **Web Server / Hosting:** LiteSpeed / Apache `.htaccess` di `/home/u1zh8984/public_html/1slabs.my.id` meneruskan `/api/*` dan `/uploads/*` langsung ke backend / symlink uploads, sementara route lainnya fallback ke `index.html`.

---

## 3. Daftar Fitur yang Dimigrasi & Disesuaikan

Seluruh kemampuan sistem artikel dan SEO Kim Holiday akan dihadirkan secara native di 1sLabs:

1. **Article Management Dashboard (`Admin > Content & SEO > Manajemen Artikel`)**
   - Tabel/grid artikel dengan metrik SEO Score, Readability Score, GEO Score, views, status (`draft`, `in_review`, `needs_revision`, `scheduled`, `published`), kategori, author, tags, tanggal publikasi & pembaruan.
   - Search, filter status, filter kategori, filter kesehatan SEO (`good` >= 80, `needs_improvement` 60-79, `poor` < 60), sorting, dan pagination.
   - Quick publish/unpublish toggle, scheduled publishing otomatis (auto-publish saat melewati `published_at`), hapus dengan konfirmasi aman, serta tombol One-Click Optimize langsung dari daftar.
2. **Article Editor Lengkap (`Admin > Content & SEO > Editor Artikel`)**
   - Dikelompokkan menjadi 7 area kerja terstruktur: Article Information, Content Editor, Media & Images, SEO Settings, AI SEO Assistant, SEO & GEO Audit, serta Publishing Settings.
   - Rich Text Content Editor (H1/H2/H3, paragraf, bold/italic/underline, lists, blockquote, callout box info/tips, table insert, links, inline image insertion + image toolbar alignment/alt/replace/delete).
   - Media uploader berbasis Multer + validasi tipe/ukuran, media library explorer (`/uploads/blog/`), preview hero image, serta generator Alt Text berbasis Gemini AI.
   - Auto-slug (dapat diedit), auto-excerpt, auto reading time (atau manual override), tags chip, kategori dinamis (tambah/hapus kategori), author attribution (terhubung ke user admin/marketing atau custom pen name).
   - **Revision History & Revert:** Menyimpan snapshot riwayat edit dan snapshot pra-optimasi AI di database (`blog_article_revisions`) dan state editor agar admin bisa memulihkan versi sebelumnya kapan saja.
3. **Yoast-Style SEO, Readability & GEO Readiness Analyzer (Deterministic Engine)**
   - **SEO Analyzer:** Mengevaluasi Focus Keyphrase (panjang & relevansi), Keyphrase di SEO Title (posisi awal & variasi), Meta Description (keberadaan keyphrase & panjang ideal 115-165 karakter + pixel bar), URL Slug, Opening Paragraph (100 kata pertama), Heading H2/H3, Keyword Distribution & Density (0.5%-2.8%, anti-stuffing), Internal Links, External Links, Image Alt Text, panjang konten, dan Search Intent.
   - **Readability Analyzer:** Persentase kalimat panjang (>22 kata), paragraf monolitik (>130 kata), distribusi subheading (H2/H3), persentase kata transisi Indonesia & teknis, heuristik kalimat pasif (`di-` berlebih), serta keterlibatan elemen terstruktur.
   - **GEO Readiness Analyzer:** Jawaban/ringkasan langsung di pembuka (direct answer), definisi/penjelasan konsep teknis, keterstruktur konten (lists/tables/callout), konteks entitas 1sLabs (Web Dev, Software, Cloud Hosting, Node.js, SaaS, ERP, API, Indonesia), keberadaan data/fakta terukur, referensi/sumber atau tautan otoritatif, FAQ section, serta kredibilitas penulis (E-E-A-T). Memberikan status `good` / `warning` / `problem`, tingkat prioritas, dan skor transparan deterministik 0-100.
4. **Gemini AI SEO Consultant & One-Click Optimization**
   - **AI Audit Report:** Analisis search intent, topical authority, content gaps, dan rekomendasi terprioritas yang membedakan perbaikan otomatis (`auto_fixable: true`) vs verifikasi manual tim engineering 1sLabs.
   - **AI Writing Assistant:** Saran 3 judul SEO optimal CTR, 3 meta deskripsi + CTA, rekomendasi focus keyphrase, optimasi paragraf pembuka (GEO Direct Answer), perapian subheading & readability, distribusi keyphrase natural, generator FAQ relevan, saran internal link ke artikel blog maupun halaman layanan resmi 1sLabs (`/jasa-pembuatan-website`, `/software-development`, `/it-consulting`, `/hosting`, `/docs`), serta generator 3 opsi Image Alt Text.
   - **Optimalkan Artikel Sekarang (1-Klik AI):** Progress indicator bertahap, QA & Content Preservation Guard (mencegah pemangkasan artikel, hilangnya gambar, link, fakta teknis, atau penambahan harga palsu), pratinjau Before/After per field & perbandingan HTML konten yang dapat diedit manual, terapkan semua atau sebagian (*Apply Selected*), lalu Revert jika diinginkan.
5. **SEO Intelligence & Google Search Console Dashboard**
   - Skor rata-rata SEO/Readability/GEO seluruh blog, Bulk Analyze All Articles, daftar kesehatan SEO per artikel.
   - OAuth 2.0 Google Search Console (`https://1slabs.my.id`), pengaturan Client ID/Secret/Property URL (`https://1slabs.my.id` atau `sc-domain:1slabs.my.id`), Auto Token Refresh, Sync Metrik Organik (Clicks, Impressions, CTR, Avg Position), Top Queries, High-Potential Keyword Opportunities dengan konversi 1-klik ke Kanban Ide Konten, Declining Pages alert, dan Top Pages.
6. **SEO Content Strategy & Internal Linking Hub**
   - Topic Clusters (Pillar Topic + Supporting Articles) disesuaikan untuk domain 1sLabs: *IT Consulting*, *Web Development*, *Custom Software Solutions*, *Managed Cloud Hosting & Infrastructure*, *AI & Automation*, *Technology & Business*.
   - AI Content Gap Generator & Internal Link Opportunities matrix.
7. **Editorial Kanban Pipeline & Content Calendar**
   - 6 kolom tahapan editorial: `ideas` (Content Ideas), `draft` (Draft), `in_review` (In Review), `needs_revision` (Needs Revision), `scheduled` (Scheduled), `published` (Published).
   - Drag & drop antar kolom dengan rollback otomatis jika API gagal, detail modal saat kartu diklik, assignee penulis, due date, target word count, outline, konversi ide menjadi draft artikel CMS, filter kategori/prioritas/pencarian, dan tampilan Kalender Konten terjadwal.
8. **Public Blog (`/blog` & `/blog/:slug`) & Technical SEO**
   - `/blog`: Hero, artikel unggulan (Featured), filter kategori, pencarian, pagination, topik cluster populer, CTA konsultasi 1sLabs.
   - `/blog/:slug`: Hero image + caption, breadcrumb, metadata penulis/tanggal/waktu baca/views, tombol share sosial media + copy link, Table of Contents otomatis (desktop sticky + mobile accordion) dengan scrollspy, typography nyaman dibaca (`prose`), tags, artikel terkait, navigasi prev/next, CTA layanan 1sLabs. Artikel `draft`/`scheduled`/`in_review` diblokir dari API publik dan merender 404.
   - Technical SEO: Dinamis `/sitemap.xml` & `/robots.txt`, dynamic Open Graph / Twitter Card / Canonical / JSON-LD (`BlogPosting`, `BreadcrumbList`, `FAQPage`), **plus Crawler SSR Metadata & 301 Redirect Handler** di backend/Apache agar bot Google, Bing, AI Search, maupun WhatsApp/LinkedIn preview menerima metadata spesifik artikel serta status HTTP 404/301 asli meski aplikasi frontend berbentuk React SPA.

---

## 4. File Sumber Referensi (`KimHolidayTravel-SC`)

| Area Fitur | File Referensi di `KimHolidayTravel-SC` |
|---|---|
| Skema Database Artikel, GSC, Strategy, Redirects | `database.sql` |
| REST API Artikel, Kategori, Upload, Media Library | `api/articles.php` |
| Deterministic SEO/Readability/GEO Engine, Gemini AI, GSC, Kanban, Clusters, Redirects | `api/seo.php` |
| Dynamic Sitemap & Robots | `api/sitemap.php`, `api/robots.php`, `router.php`, `.htaccess` |
| Rich Editor, SEO Sidebar, One-Click Optimizer Diff Modal, Revert, AI Tools | `src/pages/admin-artikel-editor.html` |
| Admin Dashboard, SEO Health, GSC Dashboard/Modal, Topic Clusters, Kanban + Detail Modal, Redirects | `src/pages/admin.html` |
| Public Blog Index & Article Detail (TOC, Share, Related, JSON-LD) | `src/pages/artikel.html`, `src/pages/artikel-detail.html` |

---

## 5. Modul Target pada `1sLabs-website`

### A. Backend (`c:\Users\dzikri\Downloads\1sLabs-website\backend`)
| File Target | Status | Deskripsi |
|---|---|---|
| `src/services/blog/blogSchema.service.js` | Baru | Inisialisasi idempoten 9 tabel `blog_*`, seeding kategori 1sLabs, auto-publisher jadwal artikel |
| `src/services/blog/seoAnalyzer.service.js` | Baru | Engine deterministik SEO, Readability (ID/EN), dan GEO Readiness |
| `src/services/blog/blogAi.service.js` | Baru | Integrasi Gemini API berbasis `.env`, log pemakaian AI, Audit, Writing Assist, One-Click Optimize + Preservation Guard, AI Content Ideas |
| `src/services/blog/gsc.service.js` | Baru | Google Search Console OAuth 2.0, token refresh, property matching, sync & agregasi performa |
| `src/middleware/blogUpload.js` | Baru | Konfigurasi Multer khusus gambar artikel (`uploads/blog/`) dengan validasi MIME & ukuran |
| `src/routes/blog.routes.js` | Baru | Endpoint publik (`/api/blog/posts`, `/categories`, `/tags`) & endpoint admin CRUD artikel, kategori, media, revisi/revert |
| `src/routes/seoIntelligence.routes.js` | Baru | Endpoint analyzer, Gemini AI, GSC OAuth, Topic Clusters, Kanban Ideas, 301 Redirects, `/sitemap.xml`, `/robots.txt`, serta crawler meta renderer |
| `index.js` | Modifikasi | Mount `/api/blog`, `/api/seo-intelligence`, `/api/sitemap.xml`, `/api/robots.txt`, serta scheduler auto-publish artikel terjadwal |

### B. Frontend (`c:\Users\dzikri\Downloads\1sLabs-website\src`)
| File Target | Status | Deskripsi |
|---|---|---|
| `services/api.ts` | Modifikasi | TypeScript types dan client methods `api.blog` & `api.seoIntelligence` |
| `App.tsx` | Modifikasi | Daftarkan route publik `/blog`, `/blog/:slug` (serta redirect alias `/artikel` -> `/blog`) |
| `components/layout/Header.tsx` | Modifikasi | Tambahkan navigasi ke `/blog` di header desktop & mobile |
| `components/layout/Footer.tsx` | Modifikasi | Tambahkan link Blog / Tech Insights di footer |
| `components/admin/AdminSidebar.tsx` | Modifikasi | Tambahkan menu group `CONTENT & SEO INTELLIGENCE` (`blog-articles`, `blog-editor`, `blog-seo`, `blog-strategy`, `blog-kanban`, `blog-technical`) untuk Super Admin & Marketing |
| `components/admin/AdminHeader.tsx` | Modifikasi | Tambahkan judul header untuk tab `blog-*` |
| `components/admin/AdminLayout.tsx` | Modifikasi | Izinkan akses `marketing` role pada tab `blog-*` dan render view baru |
| `pages/BlogListPage.tsx` | Baru | Halaman daftar artikel publik 1sLabs `/blog` lengkap dengan fitur search, filter, featured post, pagination & Helmet SEO |
| `pages/BlogDetailPage.tsx` | Baru | Halaman detail artikel publik `/blog/:slug` lengkap dengan TOC, share, related posts, CTA layanan 1sLabs, JSON-LD & Helmet SEO |
| `components/admin/views/content/ArticlesDashboardTab.tsx` | Baru | Dashboard manajemen artikel (filter status/kategori/SEO health, sort, pagination, publish toggle, quick optimize modal) |
| `components/admin/views/content/ArticleEditorView.tsx` | Baru | Editor artikel rich-text + 7 area terkelompok + SERP Preview Desktop/Mobile + Live Yoast/GEO Checks + One-Click Optimizer + Before/After Diff + Revert/Revision History + Media Library |
| `components/admin/views/content/SeoIntelligenceTab.tsx` | Baru | Dashboard kesehatan SEO global + integrasi & sinkronisasi Google Search Console |
| `components/admin/views/content/ContentStrategyTab.tsx` | Baru | Manajemen Topic Clusters 1sLabs + AI Content Gaps + Internal Linking Opportunities |
| `components/admin/views/content/EditorialKanbanTab.tsx` | Baru | 6-column Editorial Kanban (drag & drop + detail popup modal + kalender konten + AI Idea Generator + Convert to Draft) |
| `components/admin/views/content/TechnicalSeoTab.tsx` | Baru | Status Sitemap, Robots.txt, Schema Validator overview, dan Manajemen 301 Redirects |
| `public/robots.txt` & `public/.htaccess` | Modifikasi | Izinkan crawling `/blog` & `/blog/*`; arahkan `/sitemap.xml`, `/robots.txt`, serta crawler `/blog*` ke backend dinamis |

---

## 6. Database Mapping (`u1zh8984_oneslabs`)

Untuk menjaga isolasi total terhadap 61 tabel yang sudah berjalan (`documentation_articles`, `marketing_*`, `hr_*`, `users`, `hosting_*`), seluruh tabel baru menggunakan prefix `blog_`:

| Tabel Kim Holiday (`api/*.php`) | Tabel 1sLabs (`u1zh8984_oneslabs`) | Penyesuaian Utama |
|---|---|---|
| `article_categories` | `blog_categories` | Ditambah kolom `color`, default kategori IT/Software/Cloud/AI 1sLabs |
| `articles` | `blog_articles` | Tambah `author_id` FK ke `users(id)`, perluas status ke `draft`, `in_review`, `needs_revision`, `scheduled`, `published` |
| *(Belum ada di Kim Holiday)* | `blog_tags`, `blog_article_tags` | Dukungan tag relasional di samping kolom string `tags` |
| *(Snapshot JS lokal saja)* | `blog_article_revisions` | Persistensi riwayat revisi artikel & snapshot pra-optimasi AI di server untuk Revert aman |
| `gsc_settings` | `blog_gsc_settings` | Default `property_url = 'https://1slabs.my.id'`, simpan OAuth `state` CSRF token |
| `gsc_performance` | `blog_gsc_performance` | Kolom sama (`date`, `page_path`, `article_id`, `query`, `clicks`, `impressions`, `ctr`, `position`) |
| `topic_clusters` | `blog_topic_clusters` | Tambah `target_audience` dan `updated_at` untuk klaster topik IT/Software/Hosting |
| `seo_content_ideas` | `blog_content_ideas` | Kolom status diselaraskan: `ideas`, `draft`, `in_review`, `needs_revision`, `scheduled`, `published` + `category_id`, `assigned_to`, `due_date`, `notes` |
| `seo_redirects` | `blog_seo_redirects` | Manajemen pengalihan 301/302 untuk URL 1sLabs |
| *(Baru)* | `marketing_ai_logs` (reuse) | Pemakaian Gemini AI Blog dicatat di tabel log AI eksisting agar kuota & latensi terpantau |

---

## 7. API Mapping

| Fitur | Endpoint Kim Holiday | Endpoint Native 1sLabs (`/api/...`) | Auth |
|---|---|---|---|
| Daftar Artikel Publik | `GET /api/articles.php` | `GET /api/blog/posts` | Public |
| Detail Artikel Publik | `GET /api/articles.php?slug=...` | `GET /api/blog/posts/:slug` | Public |
| Kategori & Tag Publik | `GET /api/articles.php?action=categories` | `GET /api/blog/categories`, `GET /api/blog/tags` | Public |
| Daftar & Detail Artikel Admin | `GET /api/articles.php?admin=1` | `GET /api/blog/admin/posts`, `GET /api/blog/admin/posts/:id` | Admin / Marketing |
| Simpan / Edit / Hapus Artikel | `POST /api/articles.php` | `POST /api/blog/admin/posts`, `PUT /api/blog/admin/posts/:id`, `DELETE /api/blog/admin/posts/:id` | Admin / Marketing |
| Publish / Schedule / Status | `POST /api/articles.php?action=toggle_status` | `PATCH /api/blog/admin/posts/:id/status` | Admin / Marketing |
| Riwayat & Revert Artikel | *(Snapshot client)* | `GET /api/blog/admin/posts/:id/revisions`, `POST /api/blog/admin/posts/:id/revert/:revId` | Admin / Marketing |
| Upload, Library & Hapus Media | `POST /api/articles.php?action=upload_image` | `POST /api/blog/admin/media/upload`, `GET /api/blog/admin/media`, `DELETE /api/blog/admin/media` | Admin / Marketing |
| Deterministic Analyzer & Bulk | `POST /api/seo.php?action=analyze` | `POST /api/seo-intelligence/analyze`, `POST /api/seo-intelligence/bulk-analyze` | Admin / Marketing |
| Gemini AI Audit & Writing Assist | `POST /api/seo.php?action=ai_audit` / `ai_assist` | `POST /api/seo-intelligence/ai/audit`, `POST /api/seo-intelligence/ai/assist` | Admin / Marketing |
| One-Click Optimize & Apply | `POST /api/seo.php?action=ai_optimize_all` / `apply_optimization` | `POST /api/seo-intelligence/ai/optimize-all`, `POST /api/seo-intelligence/ai/apply-optimization` | Admin / Marketing |
| AI Internal Links & Ideas | `POST /api/seo.php?action=ai_internal_links` / `ai_generate_ideas` | `POST /api/seo-intelligence/ai/internal-links`, `POST /api/seo-intelligence/ai/generate-ideas` | Admin / Marketing |
| Google Search Console OAuth & Sync | `api/seo.php?action=gsc_*` | `GET /api/seo-intelligence/gsc/status`, `POST /api/seo-intelligence/gsc/config`, `GET /api/seo-intelligence/gsc/auth-url`, `GET /api/seo-intelligence/gsc/callback`, `POST /api/seo-intelligence/gsc/sync`, `GET /api/seo-intelligence/gsc/dashboard`, `POST /api/seo-intelligence/gsc/disconnect` | Admin (kecuali callback OAuth tervalidasi `state`) |
| Topic Clusters & Kanban Ideas | `api/seo.php?action=clusters_*`, `ideas_*` | `/api/seo-intelligence/clusters*` & `/api/seo-intelligence/ideas*` | Admin / Marketing |
| Sitemap, Robots & Redirects | `sitemap.php`, `robots.php`, `seo.php?action=redirects_*` | `GET /api/sitemap.xml`, `GET /api/robots.txt`, `/api/seo-intelligence/redirects*` | Public (sitemap/robots) / Admin |

---

## 8. Dependensi yang Dibutuhkan

Audit `package.json` frontend dan `backend/package.json` menunjukkan **tidak ada dependensi eksternal baru yang wajib diinstal**:
- **Frontend:** `react`, `react-router-dom`, `react-helmet-async`, `lucide-react`, `sweetalert2`, `framer-motion`, `tailwindcss` sudah tersedia. Rich Text editor dan Drag-and-Drop Kanban akan dibangun secara native dengan React + ContentEditable/Range Selection API + HTML5 Drag-and-Drop API (ringan, tanpa membebani bundle chunk). *(Catatan: `dompurify` opsional; kita akan menerapkan sanitasi HTML berbasis whitelist yang aman di sisi backend & frontend agar tidak ada XSS pada konten HTML rich-text)*.
- **Backend:** `express`, `mysql2`, `multer`, `jsonwebtoken`, `dotenv`, `cors`, dan Node v22 built-in `fetch` + `crypto` sudah siap pakai di server produksi CloudLinux.

---

## 9. Risiko Kompatibilitas & Mitigasi

| Risiko | Dampak | Strategi Mitigasi |
|---|---|---|
| **SPA Client-Side Rendering vs SEO Bot & Social Preview** | Crawler non-JS (WhatsApp, LinkedIn, X, Facebook) hanya melihat tag `<meta>` default di `index.html`; slug non-existent bisa menjadi Soft 404. | Endpoint crawler/SSR meta renderer pada Express + aturan `.htaccess` untuk menyajikan HTML dengan `<title>`, `<meta>`, Canonical, OG/Twitter, dan JSON-LD dinamis serta HTTP status 404/301 asli bagi bot/crawler, atau pre-check status pada `/blog/:slug`. |
| **Sitemap Statis vs Dinamis** | `public/sitemap.xml` statis menimpa `/sitemap.xml` sehingga artikel baru tidak otomatis terindeks. | Hapus `sitemap.xml` statis atau rewrite `^sitemap\.xml$` & `^robots\.txt$` ke `/api/sitemap.xml` dan `/api/robots.txt` + auto-regenerate file fallback di docroot bila tersedia izin tulis. |
| **Collision dengan Sistem Dokumentasi (`/docs`)** | `documentation_articles` dipakai portal bantuan hosting. | Gunakan prefix tabel `blog_*` dan route `/blog` agar sistem dokumentasi lama tetap 100% utuh dan justru dapat ditautkan sebagai internal link oleh SEO assistant. |
| **Keamanan HTML Rich Text (XSS) & Auth OAuth** | Artikel berisi tag HTML custom dapat disalahgunakan jika ada script berbahaya; GSC callback tidak membawa header `Bearer`. | Terapkan HTML sanitizer whitelist (mempertahankan `h1-h3, p, ul, ol, li, blockquote, table, tr, td, th, img, figure, figcaption, a, div.callout-box`, menghapus `<script>`, `on*` event handler, dan `javascript:` URI). Untuk GSC, validasi `state` token terenkripsi/tersimpan di DB pada callback. |
| **Timeout Passenger & Model Deprecation di Gemini API** | CloudLinux Passenger membatasi memori (160MB) dan timeout request HTTP panjang. | Gunakan batas panjang input cerdas, multi-model fallback yang aktif (`gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3-flash-preview`), AbortSignal timeout 35s, dan deterministic fallback guard. |
| **Perubahan Schema Kanban & Konten Editorial** | Status Kim Holiday (`idea..seo_review`) berbeda penamaan dengan alur editorial tim 1sLabs (`ideas, draft, in_review, needs_revision, scheduled, published`). | Gunakan 6 kolom editorial yang jelas untuk tim 1sLabs, simpan relasi `article_id`, serta sediakan auto-sync status saat artikel dipublikasikan atau dijadwalkan. |

---

## 10. Tahapan Implementasi

1. **Tahap 1 — Database & Core Backend Blog (`blogSchema.service.js`, `blogUpload.js`, `blog.routes.js`):** Pembuatan 9 tabel `blog_*`, seed kategori 1sLabs, CRUD artikel, revisi/revert, scheduled auto-publish, upload & media library.
2. **Tahap 2 — Deterministic SEO, Readability & GEO Engine (`seoAnalyzer.service.js`):** Implementasi skoring transparan dan deteksi isu untuk bahasa Indonesia/teknis 1sLabs.
3. **Tahap 3 — Gemini AI Consultant & One-Click Optimizer (`blogAi.service.js`):** Audit SEO/GEO terstruktur, Writing Assistant, FAQ/Alt/Internal-Link suggestion, dan One-Click Optimize dengan Content Preservation Guard.
4. **Tahap 4 — GSC OAuth 2.0, Content Strategy, Kanban & Technical SEO (`gsc.service.js`, `seoIntelligence.routes.js`):** Integrasi Search Console, clusters, pipeline kanban, 301 redirects, dynamic `/sitemap.xml`, `/robots.txt`, dan bot metadata renderer.
5. **Tahap 5 — Frontend API Client & Admin Views (`src/services/api.ts`, `src/components/admin/views/content/*`, Sidebar/Layout):** Antarmuka White + Light Blue 1sLabs dengan UX manajemen artikel, editor rich-text, SERP preview, One-Click Diff Modal, GSC dashboard, dan Kanban interaktif.
6. **Tahap 6 — Public Blog Pages (`/blog` & `/blog/:slug`) & Navigasi Publik (`BlogListPage.tsx`, `BlogDetailPage.tsx`, `Header.tsx`, `Footer.tsx`):** Pengalaman membaca publik, TOC, social sharing, JSON-LD lengkap, dan responsive light/dark UI.
7. **Tahap 7 — Verifikasi Lokal & Deployment Produksi:** Typecheck, Vite build, uji API backend, upload ke server `103.119.237.132`, migrasi database produksi, verifikasi endpoint & halaman live di `https://1slabs.my.id`.
8. **Tahap 8 — Dokumentasi Laporan Implementasi:** Penulisan `docs/article-system-implementation-report.md` berdasarkan hasil pengujian aktual.

