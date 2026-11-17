# Strategi Konten Berorientasi Layanan 1sLabs (Service-Oriented Content Strategy)

Dokumen ini mendefinisikan **11 Content Pillars Strategis**, pemetaan layanan & konversi CTA, mekanisme penemuan peluang topik otonom (*AI Autonomous Content Discovery*), AI Content Calendar, analisis *content gap*, serta aturan anti-kanibalisasi dan anti-duplikasi untuk sistem otomasi artikel `https://1slabs.my.id/`.

---

## 1. Filosofi Konten: Fully Automated Service-Oriented Content Marketing

Berbeda dengan media berita umum, setiap artikel yang diproduksi oleh engine untuk **1sLabs** dipilih, disusun, dan dioptimalkan secara otonom oleh AI tanpa mengharuskan admin mengisi judul atau isi artikel secara manual:

1. **Multi-Pillar Autonomous Discovery:** Pengguna memilih 1, beberapa, atau seluruh dari 11 Content Pillar, menekan **Run Automation** atau mengaktifkan jadwal harian WIB, lalu AI menemukan sendiri topik berpeluang tinggi yang belum ada di blog maupun antrean aktif.
2. **Menjawab niat pencarian nyata (Search Intent):** Tutorial praktis, panduan teknis, perbandingan objektif, atau solusi masalah bisnis/developer Indonesia dengan perataan teks body *justified* (`rata kanan-kiri`) agar rapi dan nyaman dibaca.
3. **Menunjukkan kapabilitas nyata 1sLabs:** Mengutip fitur, alur kerja, atau studi kasus portofolio yang **terverifikasi** di dalam Company Knowledge Base — tanpa klaim berlebihan atau angka fiktif.
4. **Mengarahkan ke aksi yang relevan (Contextual CTA & Internal Link):** Mengarahkan pembaca ke halaman layanan atau dokumentasi yang paling tepat (`/portal?tab=freeplan`, `/hosting`, `/jasa-pembuatan-website`, `/software-development`, `/it-consulting`, `/docs`, `/schedule`).

---

## 2. Pemetaan 11 Strategic Content Pillars

| # | Kode Pilar | Nama Pilar | Search Intent Dominan | Halaman Target & Internal Link | CTA Utama | Kategori Blog (`blog_categories`) |
|---|---|---|---|---|---|---|
| 1 | `free-hosting-domain` | **Free Hosting & Free Domain** | Transactional & How-To | `/portal?tab=freeplan`, `/hosting`, `/docs` | Klaim Subdomain Gratis `*.1slabs.my.id` & Free Hosting | `cloud-hosting` |
| 2 | `website-development` | **Website Development** | Commercial & Decision | `/jasa-pembuatan-website`, `/schedule`, `/#contact` | Konsultasi Pembuatan Website Pay Once Gratis | `web-development` |
| 3 | `software-development` | **Custom Software Development** | Commercial & Problem-Solution | `/software-development`, `/#portfolio`, `/schedule` | Diskusi Sistem Custom Tanpa Biaya per User | `custom-software` |
| 4 | `it-consulting` | **IT Consulting** | Consideration & Advisory | `/it-consulting`, `/schedule`, `/#contact` | Jadwalkan Sesi Konsultasi Teknis / Audit Sistem | `engineering-guide` |
| 5 | `hosting-infrastructure` | **Hosting & Infrastructure** | Tutorial Deploy & Commercial | `/hosting`, `/docs`, `/hosting/plan/business` | Pilih Managed Hosting NVMe / Cek Panduan Deploy | `cloud-hosting` |
| 6 | `portfolio-showcase` | **Portfolio & Project Showcase** | Proof / Case Study | `/#portfolio`, `/software-development`, `/schedule` | Konsultasikan Kebutuhan Serupa untuk Organisasi Anda | `custom-software` |
| 7 | `website-maintenance` | **Website Maintenance & Support** | Commercial & Operational | `/hosting`, `/it-consulting`, `/schedule` | Evaluasi Kesehatan & Maintenance Website | `engineering-guide` |
| 8 | `digital-transformation` | **Digital Transformation** | Commercial & Strategic | `/software-development`, `/it-consulting`, `/schedule` | Jadwalkan Audit Transformasi Digital Bisnis | `ai-automation` |
| 9 | `technology-insights` | **Technology Insights** | Informational & Thought Leadership | `/blog`, `/jasa-pembuatan-website`, `/it-consulting` | Evaluasi Kesiapan Sistem & Automasi Bisnis Anda | `ai-automation` |
| 10 | `business-tech-education` | **Business & Technology Education** | Informational / Edukasi UMKM | `/jasa-pembuatan-website`, `/docs`, `/schedule` | Pelajari Solusi Web & Software Tepat Guna | `web-development` |
| 11 | `case-study-solutions` | **Case Study & Client Solutions** | Consideration & Proof | `/#portfolio`, `/software-development`, `/schedule` | Diskusikan Implementasi Solusi Serupa | `custom-software` |

---

## 3. Funnel Stage, Balanced Distribution & AI Content Calendar

- **Balanced Pillar Distribution (`selectBalancedTopics`):** Ketika pengguna memilih N pillar untuk satu kali Run Automation atau jadwal harian, algoritma distribusi *round-robin* menyeimbangkan kandidat topik terpilih antar seluruh pillar yang dipilih sehingga tidak menumpuk pada satu kategori saja.
- **Content Gap Analysis:** Menganalisis jumlah artikel terbit, artikel dalam antrean, dan rencana kalender di setiap dari ke-11 pillar agar admin maupun AI mengetahui pillar mana yang masih *High Gap*, *Growing*, atau *Covered*.
- **AI Content Calendar (`content_calendar_items`):** Menyusun rencana editorial 3, 7, atau 14 hari ke depan lintas pillar dengan judul AI, target keyword, audiens sasaran, search intent, dan tombol eksekusi 1-klik ke antrean generasi.
- **Standar Format Body Artikel:** Paragraf isi dan butir list menggunakan perataan *justified* (`text-align: justify`) pada HTML tergenerasi (`slabs_pipeline.py` dan `applyJustifiedBodyAlignment`) maupun renderer halaman publik (`/blog/:slug`) dan Editor CMS, sementara heading, tabel, serta CTA block tetap rata kiri demi keterbacaan optimal.

---

## 4. Sistem Skor Peluang Topik & Ambang Quality Tier

Setiap kandidat topik dinilai `0–100` dari relevansi layanan 1sLabs, niat komersial, sinyal GSC *content gap*, serta penalti otomatis bila mirip dengan artikel terbit, antrean 30 hari terakhir, atau kalender konten.

Setelah artikel ditulis oleh Python Engine, Quality Gate mengelompokkan skor gabungan:
- `90–100`: **Excellent SEO/GEO & Siap Publish Optimal**
- `80–89`: **Layak & Siap Publish**
- `70–79`: **Auto-Optimized** oleh AI (`auto_optimize_below_threshold`) sebelum audit ulang
- `< 70` atau pelanggaran keras (`FORBIDDEN_CLAIMS_RULES`, duplikasi slug/keyphrase): Diteruskan ke *bounded auto-regeneration* (`max_auto_regenerations`, maks 1-2x sesuai pengaturan) atau ditahan di antrean review/rejected — **tidak pernah auto-publish jika tidak lolos**.

---

## 5. Standar Fakta Terverifikasi dalam Artikel

Semua prompt generasi dan Quality Gate wajib mematuhi pagar pembatas:

- **Boleh digunakan:** Fitur panel Node.js / Laravel, File Manager & FTP, Database & Backup Manager, metode bayar QRIS manual proof + PPN 11%, prinsip *Pay Once* untuk custom build, kontak resmi `+62 851-5629-6580` / `info@1slabs.my.id`, studi kasus portofolio yang terverifikasi.
- **Harus disampaikan secara netral / tandai bila dinamis:** Harga paket hosting (`hosting_plans` dinamis di database, salinan UI mencantumkan mulai Rp750rb–Rp1,2jt/tahun), estimasi harga jasa ("mulai dari"), dan detail masa aktif Free Plan.
- **Dilarang keras (ditolak Quality Gate):** Klaim angka fiktif (`200+ klien`, `500+ proyek`, `10+ tahun`, `25+ ahli`), `aktivasi instan` (pembayaran QRIS memerlukan verifikasi admin), `CageFS per akun` / `phpMyAdmin SSO otomatis`, `domain gratis .com` di Free Plan (Free Plan memakai subdomain `*.1slabs.my.id`), atau testimoni klien fiktif.
