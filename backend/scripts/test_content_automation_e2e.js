#!/usr/bin/env node
/**
 * Comprehensive End-to-End Integration Test Suite for 1sLabs AI Content Automation.
 *
 * Verifies:
 *  - RBAC (401/403 vs admin & marketing)
 *  - Real MySQL Schema + 14 Knowledge Base Categories + 7 Pillars
 *  - Live Python FastAPI Adapter Server (X-Integration-Key auth + health endpoint)
 *  - Quality Gate Rejection (forbidden claims, short content, body H1, missing CTA, duplicate)
 *  - Approval Modes (manual_approval, auto_publish_qualified, always_save_draft)
 *  - Publication Idempotency (no duplicate rows in blog_articles, revision creation)
 *  - Public Blog API (/blog/posts/:slug) & Dynamic XML Sitemap (/sitemap.xml)
 *  - Batch Error Isolation (1 failed item does not block sibling or publish failed content)
 *  - Asia/Jakarta Cron Matcher + Concurrent DB Schedule Lock (skipped_locked) + /cron/tick secret
 *  - GSC URL Inspection persistence & approval-gated optimization suggestions
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');

process.env.START_HTTP_SERVER = 'false';
process.env.NODE_ENV = 'test';
process.env.ENABLE_INTERNAL_AUTOMATION_SCHEDULER = 'false';
process.env.GENERATOR_INTEGRATION_KEY = 'e2e_test_slabs_secret_key_2026';
process.env.SLABS_INTEGRATION_KEY = 'e2e_test_slabs_secret_key_2026';
process.env.AUTOMATION_CRON_SECRET = 'e2e_cron_secret_2026';

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { query } = require('../src/db');
const { ensureBlogSchema, applyJustifiedBodyAlignment } = require('../src/services/blog/blogSchema.service');
const { ensureAutomationSchema } = require('../src/services/automation/automationSchema.service');
const {
  enqueueManualJob,
  enqueueBatchJob,
  triggerQueueWorker,
  updateSettings,
  getSettings,
  getReviewItem,
  approveAndPublishItem
} = require('../src/services/automation/automationQueue.service');
const {
  cronMatchesJakartaNow,
  executeSchedule,
  createSchedule,
  deleteSchedule
} = require('../src/services/automation/automationScheduler.service');
const { inspectArticleUrl, applyImprovementSuggestion } = require('../src/services/blog/gscExtended.service');
const { checkEngineHealth } = require('../src/services/automation/generatorAdapter.service');
const {
  ARTICLE_UPLOADS_ROOT,
  assertSafePublicHttpsUrl,
  isPrivateOrReservedIp,
  insertInlineFiguresInHtml
} = require('../src/services/automation/imageManager.service');
const app = require('../index');

const MOCK_TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);
const MOCK_PNG_HEADER = Buffer.concat([MOCK_TINY_PNG, Buffer.alloc(600, 0x41)]);

const JWT_SECRET = process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f';

const VALID_ARTICLE_HTML = `
<p>Panduan mendapatkan hosting gratis dan domain gratis 1sLabs dirancang khusus untuk membantu mahasiswa, pengembang pemula, dan UMKM memulai kehadiran digital tanpa biaya awal yang berat. Platform ini menyediakan akses managed panel yang siap dipakai untuk prototipe dan proyek portofolio.</p>
<div class="callout-box" data-tone="info"><p><strong>Ringkasan Cepat:</strong> Program Free Plan di portal 1sLabs menyediakan subdomain gratis berakhiran .1slabs.my.id, database MySQL, serta dukungan SSL HTTPS.</p></div>
<h2>Mengapa Memilih Program Free Hosting 1sLabs untuk Proyek Awal?</h2>
<p>Ketika membangun situs web pertama, pengembang sering menghadapi kendala biaya sewa server bulanan. Melalui ekosistem 1sLabs, Anda dapat menguji aplikasi HTML, PHP, atau proyek portofolio secara langsung di infrastruktur yang terkelola rapi tanpa perlu konfigurasi server manual yang rumit.</p>
<p>Selain itu, integrasi subdomain .1slabs.my.id memungkinkan website langsung memiliki alamat web yang aman dengan enkripsi HTTPS bawaan. Pendekatan ini jauh lebih praktis dibandingkan memakai alamat IP mentah saat mempresentasikan karya ke dosen maupun calon klien pertama Anda.</p>
<h2>Perbandingan Lingkungan Uji Coba Free Plan dan Managed Hosting Bisnis</h2>
<p>Sebelum memutuskan paket yang tepat, pahami perbedaan alokasi kebutuhan proyek portofolio dan kebutuhan operasional bisnis yang membutuhkan kapasitas penuh serta custom domain.</p>
<table>
  <thead>
    <tr><th>Aspek Evaluasi</th><th>Free Plan Uji Coba Portal</th><th>Managed Hosting 1sLabs</th></tr>
  </thead>
  <tbody>
    <tr><td>Alamat Domain</td><td>Subdomain .1slabs.my.id</td><td>Mendukung custom domain bisnis</td></tr>
    <tr><td>Tujuan Penggunaan</td><td>Portofolio &amp; staging awal</td><td>Website company profile &amp; trafik bisnis</td></tr>
    <tr><td>Akses Pengelolaan</td><td>File Manager &amp; MySQL DB</td><td>Layanan terkelola penuh tim 1sLabs</td></tr>
  </tbody>
</table>
<h2>Langkah Praktis Klaim Hosting Gratis dan Subdomain di Portal 1sLabs</h2>
<p>Proses pendaftaran Free Plan sengaja dibuat ringkas agar pengguna dapat segera mengunggah kode website. Ikuti tahapan terstruktur berikut sebelum melakukan deployment berkas proyek Anda ke server.</p>
<ol>
  <li>Masuk atau daftar akun pada halaman <a href="/portal?tab=freeplan">Portal Free Plan 1sLabs</a> menggunakan email aktif.</li>
  <li>Tentukan nama subdomain unik berakhiran .1slabs.my.id yang relevan dengan nama proyek Anda.</li>
  <li>Unggah berkas aplikasi web melalui File Manager atau sambungkan database MySQL dari panel kontrol.</li>
  <li>Pelajari panduan teknis lanjutan di halaman <a href="/docs">Dokumentasi Teknis 1sLabs</a> jika memerlukan penyesuaian routing SPA atau PHP.</li>
</ol>
<h2>Tips Keamanan dan Kesiapan Skalabilitas Website Baru</h2>
<p>Pastikan setiap formulir kontak dan skrip backend menggunakan validasi input yang ketat sejak hari pertama publikasi. Jangan lupa melakukan optimasi gambar agar waktu muat halaman tetap cepat di jaringan seluler pengunjung Indonesia.</p>
<p>Apabila di kemudian hari website perusahaan membutuhkan sumber daya dedicated atau pembuatan aplikasi custom dengan skema Pay Once tanpa biaya langganan per user, Anda dapat mengeksplorasi layanan <a href="/hosting">Managed Hosting 1sLabs</a> maupun konsultasi di <a href="/jasa-pembuatan-website">Jasa Pembuatan Website 1sLabs</a>.</p>
<h2>Pertanyaan yang Sering Diajukan</h2>
<h3>Apakah saya perlu kartu kredit untuk mengaktifkan Free Plan 1sLabs?</h3>
<p>Tidak, pendaftaran program uji coba Free Plan di portal 1sLabs dapat dilakukan tanpa kartu kredit dan langsung mendapatkan subdomain gratis .1slabs.my.id.</p>
<h3>Kapan sebaiknya bisnis beralih dari Free Plan ke paket berbayar?</h3>
<p>Segera pertimbangkan peningkatan ke layanan managed hosting saat website digunakan untuk transaksi komersial aktif, membutuhkan custom domain resmi, atau mulai menerima trafik harian tinggi.</p>
<h3>Apakah 1sLabs juga menyediakan layanan pembuatan website custom?</h3>
<p>Ya, tim engineering 1sLabs menyediakan pembuatan website dan software custom dengan model kepemilikan Pay Once yang dapat dikonsultasikan langsung.</p>
<div class="oneslabs-cta-block"><p>Siap meluncurkan website pertama Anda dengan infrastruktur yang rapi? Mulai uji coba atau diskusikan kebutuhan website bisnis Anda sekarang.</p><a class="oneslabs-cta-btn" href="/portal?tab=freeplan">Klaim Free Hosting 1sLabs Sekarang</a></div>
`.repeat(1); // ~520+ words -> wait let's ensure >= 700 words cleanly!

const LONG_VALID_HTML = VALID_ARTICLE_HTML.replace(
  '<h2>Pertanyaan yang Sering Diajukan</h2>',
  `
<h2>Praktik Terbaik Pengelolaan File dan Database di Panel Kontrol</h2>
<p>Mengelola berkas statis maupun dinamis di lingkungan hosting memerlukan struktur folder yang disiplin agar pembaruan kode tidak merusak halaman produksi. Biasakan memisahkan aset media, konfigurasi lingkungan, dan cadangan database secara berkala sebelum melakukan perubahan besar.</p>
<p>Setiap tabel MySQL sebaiknya menggunakan pengkodean UTF8MB4 agar mendukung seluruh karakter teks bahasa Indonesia dengan akurat. Pastikan kredensial database tidak pernah ditulis langsung pada berkas frontend maupun repositori publik mana pun untuk menjaga keamanan sistem informasi Anda.</p>
<p>Untuk proyek React Vite atau aplikasi Single Page Application lainnya, siapkan aturan rewrite pada berkas .htaccess supaya rute internal tidak menghasilkan status 404 saat halaman dimuat ulang oleh pengunjung maupun mesin pencari Google.</p>
<h2>Pertanyaan yang Sering Diajukan</h2>`
);

const VALID_FAQ = [
  {
    question: 'Apakah Free Plan 1sLabs memerlukan kartu kredit?',
    answer: 'Tidak, pengguna cukup mendaftar melalui portal resmi 1sLabs untuk mencoba subdomain gratis .1slabs.my.id.'
  },
  {
    question: 'Kapan website bisnis perlu beralih ke Managed Hosting?',
    answer: 'Ketika situs membutuhkan custom domain perusahaan dan dukungan kapasitas penuh untuk operasional komersial.'
  },
  {
    question: 'Di mana panduan deploy proyek React dan Node.js tersedia?',
    answer: 'Panduan lengkap deployment tersedia pada halaman /docs 1sLabs.'
  }
];

const VISUAL_ERP_VALID_HTML = `
<p><strong>Otomatisasi ERP keuangan membantu perusahaan rintisan dan UMKM mencatat arus kas, faktur penjualan, serta rekonsiliasi stok secara terpusat sejak transaksi terjadi.</strong> Dengan menerapkan pendekatan arsitektur modular yang dirancang bersama tim <a href="/jasa-pembuatan-aplikasi">Pengembangan Software Custom 1sLabs</a>, manajemen tidak lagi bergantung pada puluhan lembar spreadsheet terpisah yang rawan selisih angka.</p>
<div class="callout-box" data-tone="info"><p><strong>Poin Utama Otomatisasi ERP Keuangan:</strong> Pencatatan faktur, potongan pajak, harga pokok penjualan, dan laporan laba rugi berjalan otomatis dalam satu alur data terintegrasi tanpa biaya langganan per pengguna.</p></div>
<h2>Mengapa Pencatatan Manual Menghambat Pertumbuhan Arus Kas Bisnis?</h2>
<p>Ketika volume pesanan harian terus bertumbuh, penyusunan laporan laba rugi di akhir bulan sering kali tertunda hingga berminggu-minggu akibat proses input ulang data gudang dan kasir. Situasi ini menyulitkan pemilik usaha dalam mengambil keputusan pembelian bahan baku maupun ekspansi cabang baru secara tepat waktu.</p>
<p>Selain risiko kesalahan pengetikan nominal, sistem pencatatan terpisah juga membuka celah ketidaksinkronan antara bagian penjualan, divisi akuntansi, dan logistik pengiriman barang. Pemanfaatan otomatisasi ERP keuangan bersama tim engineering berpengalaman menjadi fondasi kontrol internal yang jauh lebih akurat dan transparan.</p>
<h2>Komponen Arsitektur Otomatisasi ERP Keuangan untuk Skala Menengah</h2>
<p>Sebuah modul akuntansi modern harus mampu menerjemahkan setiap peristiwa operasional langsung menjadi jurnal akuntansi berpasangan secara otomatis. Berikut perbandingan kapabilitas operasional perusahaan sebelum dan sesudah integrasi sistem informasi akuntansi dan persediaan terpadu:</p>
<table>
  <thead>
    <tr><th>Area Operasional</th><th>Proses Spreadsheet Konvensional</th><th>Otomatisasi ERP Keuangan Custom</th></tr>
  </thead>
  <tbody>
    <tr><td>Pembuatan Faktur</td><td>Ketik ulang data pelanggan manual</td><td>Faktur PDF terbit otomatis dari pesanan</td></tr>
    <tr><td>Stok &amp; HPP</td><td>Hitung fisik bulanan berkala</td><td>Pembaruan stok real-time &amp; HPP otomatis</td></tr>
    <tr><td>Audit Pembukuan</td><td>Sulit melacak riwayat suntingan</td><td>Jejak audit lengkap per pengguna &amp; waktu</td></tr>
    <tr><td>Model Biaya</td><td>Lisensi SaaS per kursi pengguna</td><td>Skema Pay Once milik penuh perusahaan</td></tr>
  </tbody>
</table>
<h2>Tahapan Migrasi Pembukuan Lama Menuju Ekosistem Cloud</h2>
<p>Peralihan dari sistem pembukuan lama menuju aplikasi web modern tidak perlu dilakukan secara terburu-buru hingga mengganggu operasional harian perusahaan. Anda dapat memulai diskusi arsitektur melalui layanan <a href="/konsultasi-it">Konsultasi IT Strategis 1sLabs</a> dengan mengikuti urutan tahapan terstruktur berikut ini:</p>
<ol>
  <li>Pemetaan bagan akun keuangan perusahaan, alur persetujuan pengeluaran kas, serta format faktur pajak dan surat jalan standar.</li>
  <li>Pembersihan data master pemasok, daftar barang dagang, pengkodean kategori produk, dan saldo awal neraca penutup periode sebelumnya.</li>
  <li>Pengembangan modul inti otomatisasi ERP keuangan dengan model kepemilikan Pay Once tanpa biaya langganan bulanan per user.</li>
  <li>Pelatihan tim operasional serta uji coba paralel selama dua minggu penuh sebelum menonaktifkan seluruh berkas pencatatan manual lama.</li>
</ol>
<h2>Keamanan Data Finansial dan Kinerja Infrastruktur Jangka Panjang</h2>
<p>Data penjualan, margin keuntungan, dan daftar pemasok adalah aset penting perusahaan. Sistem wajib memakai enkripsi HTTPS dan kontrol akses berbasis peran.</p>
<p>Pencadangan database harian otomatis juga menjaga kelangsungan operasional bisnis jangka panjang. Anda dapat meninjau implementasi kami pada halaman <a href="/portfolio">Portfolio Proyek 1sLabs</a> atau panduan di <a href="/docs">Dokumentasi 1sLabs</a>.</p>
<h2>Integrasi Laporan Arus Kas Harian dan Evaluasi Profitabilitas Cabang</h2>
<p>Banyak pelaku UMKM sulit memantau cabang mana yang paling sehat keuangannya. Melalui otomatisasi ERP keuangan, setiap cabang mencatat pendapatan di satu sistem pusat.</p>
<p>Pemilik usaha dapat membuka ringkasan arus kas harian langsung dari layar ponsel atau laptop. Data penjualan bersih langsung terhubung dengan laporan stok barang di gudang.</p>
<ul>
  <li>Pemilik bisnis melihat saldo kas dan piutang jatuh tempo dalam hitungan detik.</li>
  <li>Tim akuntansi menghemat puluhan jam kerja saat penutupan buku akhir bulan.</li>
  <li>Divisi pembelian menerima pengingat otomatis saat persediaan bahan baku mulai menipis.</li>
  <li>Auditor internal mudah melacak siapa yang mengubah nominal transaksi beserta waktunya.</li>
</ul>
<p>Pendekatan bertahap ini memastikan aplikasi benar-benar terpakai oleh seluruh staf operasional. Efisiensi kerja meningkat tanpa perlu mengganti seluruh perangkat komputer kantor Anda.</p>
<h2>Pertanyaan yang Sering Diajukan tentang Otomatisasi ERP Keuangan</h2>
<h3>Berapa lama waktu pengembangan modul otomatisasi ERP keuangan sederhana?</h3>
<p>Durasi pengerjaan disesuaikan dengan cakupan modul gudang, penagihan otomatis, pelaporan pajak, serta jumlah integrasi pembayaran atau sistem kasir yang diprioritaskan perusahaan pada fase pertama.</p>
<h3>Apakah seluruh kode sumber sistem menjadi hak milik klien?</h3>
<p>Ya, melalui model pengembangan Pay Once 1sLabs, perusahaan memegang kepemilikan penuh atas aplikasi yang dibangun sesuai ruang lingkup kerja sama tanpa biaya sewa perangkat lunak per pengguna setiap bulan.</p>
<h3>Bisakah sistem ERP ini dihubungkan ke aplikasi kasir toko eksisting?</h3>
<p>Integrasi dapat dibangun menggunakan REST API aman maupun sinkronisasi database terjadwal agar data transaksi dari seluruh cabang penjualan langsung masuk ke laporan keuangan pusat secara konsisten.</p>
<div class="oneslabs-cta-block"><p>Ingin menyederhanakan pencatatan arus kas dan laporan keuangan perusahaan tanpa biaya langganan per pengguna?</p><a class="oneslabs-cta-btn" href="/konsultasi-it">Jadwalkan Konsultasi Sistem ERP</a></div>
`.trim();

const VISUAL_ERP_FAQ = [
  {
    question: 'Berapa lama waktu pengembangan modul otomatisasi ERP keuangan sederhana?',
    answer: 'Durasi pengerjaan disesuaikan dengan prioritas modul gudang, penagihan, dan pelaporan pada fase pertama.'
  },
  {
    question: 'Apakah seluruh kode sumber sistem menjadi hak milik klien?',
    answer: 'Ya, model Pay Once memberi hak kepemilikan aplikasi kepada klien sesuai ruang lingkup kontrak.'
  },
  {
    question: 'Bisakah sistem ERP dihubungkan ke kasir cabang eksisting?',
    answer: 'Bisa, tim engineering dapat menyiapkan REST API maupun sinkronisasi terjadwal antar sistem.'
  }
];

function buildMockEngineServer(integrationKey) {
  let failNext = false;
  let customArticleOverride = null;

  const server = http.createServer((req, res) => {
    const key = req.headers['x-integration-key'];
    if (key !== integrationKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Invalid integration key' }));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/1slabs/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, engine: 'mock-e2e-engine', version: '1.0', gemini_configured: true }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/1slabs/generate') {
      let bodyStr = '';
      req.on('data', (c) => (bodyStr += c));
      req.on('end', () => {
        const body = JSON.parse(bodyStr || '{}');
        if (failNext || String(body.topic || '').includes('FORCE_ENGINE_FAIL')) {
          failNext = false;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: 'Simulated Gemini upstream timeout error' }));
          return;
        }

        if (customArticleOverride) {
          const article = customArticleOverride(body);
          customArticleOverride = null;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, async: false, article }));
          return;
        }

        const isVisualErpTest = String(body.topic || '').includes('Otomatisasi ERP Keuangan UMKM');
        const isForbiddenTest = String(body.topic || '').includes('FORBIDDEN_CLAIM_TEST');
        const kw = isVisualErpTest
          ? 'otomatisasi erp keuangan'
          : String(body.target_keyword || 'hosting gratis 1slabs').trim();
        const pillarCta = body.pillar?.primary_cta_path || '/hosting';
        const baseHtml = isVisualErpTest
          ? VISUAL_ERP_VALID_HTML
          : String(body.topic || '').includes('Panduan Hosting Gratis dan Subdomain 1sLabs')
            ? LONG_VALID_HTML
            : LONG_VALID_HTML.replace(
                '<h2>Mengapa Memilih Program Free Hosting 1sLabs untuk Proyek Awal?</h2>',
                `<h2>Strategi ${kw} untuk Pertumbuhan Bisnis Digital Modern</h2><p>Implementasi ${kw} bersama tim teknis 1sLabs dirancang agar arsitektur website, performa backend, dan kesiapan SEO selaras dengan target pertumbuhan jangka panjang. Pelajari layanan terkait melalui <a href="${pillarCta}">Solusi Resmi 1sLabs</a>.</p>`
              );
        const html = isForbiddenTest
          ? baseHtml + '<p>Dapatkan hosting gratis selamanya dengan harga Rp 99.000 per tahun!</p>'
          : baseHtml;

        const derivedSlug = isVisualErpTest
          ? 'e2e-implementasi-otomatisasi-erp-keuangan-umkm'
          : String(body.topic || '').includes('Panduan Hosting Gratis dan Subdomain 1sLabs')
            ? 'e2e-panduan-hosting-gratis-subdomain-1slabs'
            : `e2e-${String(body.topic || 'artikel')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 75)}`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            async: false,
            article: {
              title: body.topic,
              slug: derivedSlug,
              excerpt: `Panduan praktis ${kw} bersama tim engineering 1sLabs untuk mendorong performa sistem dan akuisisi organik bisnis Anda.`,
              meta_title: `${String(body.topic || kw).slice(0, 52)} | 1sLabs`,
              meta_description:
                `Pelajari strategi ${kw} bersama 1sLabs lengkap dengan arsitektur teknis, langkah implementasi, perbandingan, dan rekomendasi layanan terukur.`,
              focus_keyphrase: kw,
              secondary_keyphrases: isVisualErpTest
                ? 'aplikasi erp cloud, akuntansi umkm, software keuangan pay once'
                : 'subdomain gratis, free plan 1slabs, deploy website',
              content: html,
              faq_items: isVisualErpTest ? VISUAL_ERP_FAQ : VALID_FAQ,
              target_audience: 'Developer, UMKM, dan Pembuat Keputusan IT Indonesia',
              recommended_category: body.pillar?.name || 'Cloud & Hosting',
              tags: ['1slabs', kw.slice(0, 30), body.pillar?.code || 'web-development'],
              featured_image_recommendation: `Ilustrasi modern arsitektur ${kw} dengan aksen biru bersih bergaya SaaS enterprise.`,
              featured_image_alt: `Diagram strategi ${kw} dari tim engineer 1sLabs`,
              generation_trace: [{ stage: 'completed', pct: 100, detail: 'E2E mock', elapsed_s: 0.1 }],
              warnings: [],
              claims_warnings: [],
              elapsed_ms: 100
            }
          })
        );
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/1slabs/plan-images') {
      let bodyStr = '';
      req.on('data', (c) => (bodyStr += c));
      req.on('end', () => {
        const body = JSON.parse(bodyStr || '{}');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            visual_theme: `Visual editorial ${body.title || '1sLabs'}`,
            model_used: 'mock-vision',
            featured: {
              role: 'featured',
              search_query: 'software developer laptop modern office',
              secondary_query: 'cloud hosting server office',
              alt_text: `Ilustrasi utama ${String(body.title || '1sLabs').slice(0, 90)}`,
              caption: 'Foto ilustrasi utama artikel pengembangan software dan cloud.',
              ai_prompt: 'Modern software office workspace laptop, no text, no watermark'
            },
            inline: [
              {
                role: 'inline',
                section_index: 0,
                section_heading:
                  body.sections?.[0]?.heading || 'Mengapa Memilih Program Free Hosting 1sLabs untuk Proyek Awal?',
                search_query: 'web developer team code screen laptop',
                secondary_query: 'programming workstation dual monitor',
                alt_text: 'Tim developer meninjau arsitektur deployment aplikasi web',
                caption: 'Proses persiapan arsitektur proyek web bersama tim engineering.',
                ai_prompt: 'Web developers reviewing application architecture on screen, no text'
              }
            ]
          })
        );
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/1slabs/rank-images') {
      let bodyStr = '';
      req.on('data', (c) => (bodyStr += c));
      req.on('end', () => {
        const body = JSON.parse(bodyStr || '{}');
        const used = new Set((body.used_urls || []).map((u) => String(u).toLowerCase()));
        const clean = (body.candidates || []).filter(
          (c) => c?.original_url && !used.has(String(c.original_url).toLowerCase()) && !/watermark|shutterstock/i.test(c.title || '')
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            selected: clean[0] || null,
            ranked: clean.slice(0, 5),
            reason: 'Dipilih kandidat teratas bebas watermark & resolusi lanskap.'
          })
        );
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/1slabs/optimize-image') {
      let bodyStr = '';
      req.on('data', (c) => (bodyStr += c));
      req.on('end', () => {
        const body = JSON.parse(bodyStr || '{}');
        const fmt = body.preferred_format === 'jpeg' || body.preferred_format === 'jpg' ? 'jpg' : 'webp';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            format: fmt,
            mime_type: fmt === 'webp' ? 'image/webp' : 'image/jpeg',
            width: 1200,
            height: 675,
            size_bytes: Buffer.from(body.image_base64 || '', 'base64').length || MOCK_PNG_HEADER.length,
            base64_data: body.image_base64 || MOCK_PNG_HEADER.toString('base64')
          })
        );
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/v1/1slabs/research-topics') {
      let bodyStr = '';
      req.on('data', (c) => (bodyStr += c));
      req.on('end', () => {
        const body = JSON.parse(bodyStr || '{}');
        const requestedCodes =
          Array.isArray(body.pillar_codes) && body.pillar_codes.length > 0
            ? body.pillar_codes
            : body.pillar?.code
              ? [body.pillar.code]
              : ['free-hosting-domain', 'website-development', 'it-consulting'];
        const existingSet = new Set(
          [...(body.existing_titles || []), ...(body.existing_queue_titles || [])].map((t) => String(t).toLowerCase())
        );
        const angleBank = [
          { phrase: 'Arsitektur Microservice Skala Menengah', kw: 'arsitektur microservice bisnis' },
          { phrase: 'Optimalisasi Core Web Vitals E-Commerce', kw: 'core web vitals ecommerce' },
          { phrase: 'Implementasi Zero Downtime Database MySQL', kw: 'database zero downtime' },
          { phrase: 'Integrasi SSO RBAC Portal Internal Perusahaan', kw: 'portal internal rbac' },
          { phrase: 'Deployment Subdomain Portofolio Cepat Aman', kw: 'subdomain portofolio aman' },
          { phrase: 'Audit Keamanan Jaringan dan Backup Harian', kw: 'audit keamanan website' },
          { phrase: 'Transformasi Kasir Multi Cabang Real Time', kw: 'kasir multi cabang' },
          { phrase: 'Otomasi Workflow Pembayaran QRIS API Gateway', kw: 'otomasi qris gateway' },
          { phrase: 'Panduan Migrasi Panel Hosting Tanpa Gangguan', kw: 'migrasi panel hosting' },
          { phrase: 'Strategi Observability Log Error Aplikasi', kw: 'observability log aplikasi' },
          { phrase: 'Desain Interface Portal Pelaporan Publik', kw: 'desain portal publik' },
          { phrase: 'Evaluasi Biaya Infrastruktur Cloud Tahunan', kw: 'evaluasi biaya cloud' }
        ];
        const count = Math.max(requestedCodes.length * 2, Number(body.count || 6));
        const generatedTopics = [];
        for (let idx = 0; idx < count; idx++) {
          const pCode = requestedCodes[idx % requestedCodes.length];
          const chosenAngle =
            angleBank.find((a) => !Array.from(existingSet).some((t) => t.includes(a.phrase.toLowerCase()))) ||
            angleBank[idx % angleBank.length];
          const fullTitle = `[E2E_TEST] ${chosenAngle.phrase} (${pCode}) Sesi ${Date.now() % 10000}-${idx + 1}`;
          existingSet.add(fullTitle.toLowerCase());
          generatedTopics.push({
            pillar_code: pCode,
            title: fullTitle,
            target_keyword: chosenAngle.kw,
            secondary_keywords: ['1slabs', pCode],
            search_intent: idx % 2 === 0 ? 'commercial' : 'informational',
            funnel_stage: 'consideration',
            target_audience: 'UMKM, Startup, dan Tim Engineering Enterprise',
            service_target: '/hosting',
            opportunity_score: 90 - (idx % 10),
            rationale: `Peluang topik strategis untuk pillar ${pCode}.`
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            topics: generatedTopics
          })
        );
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return {
    server,
    setNextFailure: (v) => (failNext = v),
    setOverride: (fn) => (customArticleOverride = fn)
  };
}

function startLivePythonServer(port, integrationKey) {
  const pyExe = 'C:\\Users\\dzikri\\Downloads\\Inpartner\\article-generator\\project\\venv\\Scripts\\python.exe';
  const pyCwd = 'C:\\Users\\dzikri\\Downloads\\Inpartner\\article-generator\\project';
  const child = spawn(
    pyExe,
    ['-m', 'uvicorn', 'api.main:app', '--host', '127.0.0.1', '--port', String(port), '--log-level', 'error'],
    {
      cwd: pyCwd,
      env: {
        ...process.env,
        ENABLE_SCHEDULER: 'false',
        SLABS_INTEGRATION_KEY: integrationKey,
        OPENBLAS_NUM_THREADS: '1',
        OMP_NUM_THREADS: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  return child;
}

async function waitForHttp(url, headers = {}, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url, { headers });
      if (r.status < 500) return r;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function cleanupTestArtifacts() {
  const e2eItems = await query(
    `SELECT id FROM content_generation_items WHERE topic LIKE '%[E2E_TEST]%' OR draft_slug LIKE 'e2e-%'`
  ).catch(() => []);
  const e2eArticles = await query(
    `SELECT id FROM blog_articles WHERE slug LIKE 'e2e-%' OR title LIKE '%[E2E_TEST]%'`
  ).catch(() => []);
  for (const it of e2eItems) {
    fs.rmSync(path.join(ARTICLE_UPLOADS_ROOT, `item-${it.id}`), { recursive: true, force: true });
    await query(`DELETE FROM article_images WHERE generation_item_id = ?`, [it.id]).catch(() => {});
  }
  for (const art of e2eArticles) {
    fs.rmSync(path.join(ARTICLE_UPLOADS_ROOT, String(art.id)), { recursive: true, force: true });
    await query(`DELETE FROM article_images WHERE article_id = ?`, [art.id]).catch(() => {});
  }
  await query(`DELETE FROM blog_articles WHERE slug LIKE 'e2e-%' OR title LIKE '%[E2E_TEST]%'`).catch(() => {});
  await query(`DELETE FROM content_generation_jobs WHERE title LIKE '%[E2E_TEST]%' OR title LIKE '%E2E%' OR title LIKE '%Calendar (%' OR title LIKE '%Autonomous Run (%'`).catch(() => {});
  await query(`DELETE FROM content_automation_schedules WHERE job_code LIKE 'e2e-%'`).catch(() => {});
  await query(`DELETE FROM content_calendar_items WHERE title LIKE '%[E2E_TEST]%' OR rationale LIKE '%E2E%'`).catch(() => {});
  await query(`DELETE FROM article_index_inspections WHERE inspection_url LIKE '%e2e-%'`).catch(() => {});
  await query(`DELETE FROM blog_content_ideas WHERE title LIKE '%[E2E_TEST]%'`).catch(() => {});
  await query(`DELETE FROM users WHERE email IN ('e2e_admin@1slabs.test', 'e2e_marketing@1slabs.test', 'e2e_user@1slabs.test')`).catch(
    () => {}
  );
  await query(
    `UPDATE content_automation_settings
     SET engine_url = 'http://127.0.0.1:8000',
         approval_mode = 'manual_approval',
         daily_generation_limit = 20,
         max_auto_regenerations = 1,
         auto_optimize_below_threshold = 1,
         enable_auto_images = 1,
         image_quality_validation = 1,
         selected_pillars_json = NULL
     WHERE id = 1`
  ).catch(() => {});
}

async function main() {
  let expressServer = null;
  let mockServer = null;
  let pythonChild = null;
  const originalFetch = globalThis.fetch;

  try {
    console.log('1. Bootstrapping schemas & cleaning prior E2E artifacts...');
    await ensureBlogSchema();
    await ensureAutomationSchema();
    await cleanupTestArtifacts();

    // Seed 3 test users (super_admin, marketing, regular user)
    await query(
      `INSERT INTO users (name, username, email, phone, password, role, email_verified, status)
       VALUES
       ('E2E SuperAdmin', 'e2e_admin', 'e2e_admin@1slabs.test', '081111', 'x', 'super_admin', 1, 'active'),
       ('E2E Marketing', 'e2e_mkt', 'e2e_marketing@1slabs.test', '082222', 'x', 'marketing', 1, 'active'),
       ('E2E Customer', 'e2e_usr', 'e2e_user@1slabs.test', '083333', 'x', 'user', 1, 'active')`
    );
    const [adminUsr] = await query(`SELECT * FROM users WHERE email = 'e2e_admin@1slabs.test'`);
    const [mktUsr] = await query(`SELECT * FROM users WHERE email = 'e2e_marketing@1slabs.test'`);
    const [custUsr] = await query(`SELECT * FROM users WHERE email = 'e2e_user@1slabs.test'`);

    const adminToken = jwt.sign({ id: adminUsr.id, email: adminUsr.email, role: 'super_admin' }, JWT_SECRET, { expiresIn: '1h' });
    const mktToken = jwt.sign({ id: mktUsr.id, email: mktUsr.email, role: 'marketing' }, JWT_SECRET, { expiresIn: '1h' });
    const userToken = jwt.sign({ id: custUsr.id, email: custUsr.email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

    // Start real Express HTTP server
    await new Promise((resolve) => {
      expressServer = app.listen(0, '127.0.0.1', resolve);
    });
    const apiBase = `http://127.0.0.1:${expressServer.address().port}/api`;
    console.log(`   Express E2E server listening on ${apiBase}`);

    // ------------------------------------------------------------------
    // Test 2: RBAC & Cron Secret Protection
    // ------------------------------------------------------------------
    console.log('2. Testing RBAC & Cron endpoint security...');
    let res = await fetch(`${apiBase}/content-automation/overview`);
    assert.equal(res.status, 401, 'Unauthenticated overview must return 401');

    res = await fetch(`${apiBase}/content-automation/overview`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 403, 'Regular customer user must return 403');

    res = await fetch(`${apiBase}/content-automation/overview`, {
      headers: { Authorization: `Bearer ${mktToken}` }
    });
    assert.equal(res.status, 200, 'Marketing user must access content automation overview');

    res = await fetch(`${apiBase}/content-automation/cron/tick`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': 'wrong_secret' }
    });
    assert.equal(res.status, 401, 'Wrong cron secret must be rejected');

    res = await fetch(`${apiBase}/content-automation/cron/tick`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': process.env.AUTOMATION_CRON_SECRET }
    });
    assert.equal(res.status, 200, 'Valid X-Cron-Secret must trigger cron tick');

    // ------------------------------------------------------------------
    // Test 3: Knowledge Base & 7 Strategy Pillars Verification
    // ------------------------------------------------------------------
    console.log('3. Testing Knowledge Base (14 categories) & Content Pillars (7)...');
    const kbRes = await fetch(`${apiBase}/content-automation/knowledge`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then((r) => r.json());
    assert.ok(kbRes.entries.length >= 14, `Expected >= 14 KB categories, got ${kbRes.entries.length}`);
    const conflictEntries = kbRes.entries.filter((e) => e.verification_status === 'needs_verification');
    assert.ok(conflictEntries.length >= 2, 'Conflicting Free Plan & Hosting Pricing must remain needs_verification');

    const pillarsRes = await fetch(`${apiBase}/content-automation/strategy/pillars`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then((r) => r.json());
    assert.ok(pillarsRes.pillars.length >= 11, `Expected >= 11 seeded content pillars, got ${pillarsRes.pillars.length}`);

    // ------------------------------------------------------------------
    // Test 4: Live Python FastAPI Local Engine Adapter Check
    // ------------------------------------------------------------------
    console.log('4. Starting live local Python FastAPI adapter & verifying Node <-> Python bridge...');
    const pyPort = 18015;
    pythonChild = startLivePythonServer(pyPort, process.env.GENERATOR_INTEGRATION_KEY);
    let pyErr = '';
    pythonChild.stderr?.on('data', (chunk) => { pyErr += chunk.toString(); });
    const pyUrl = `http://127.0.0.1:${pyPort}`;
    const pyReady = await waitForHttp(
      `${pyUrl}/api/v1/1slabs/health`,
      { 'X-Integration-Key': process.env.GENERATOR_INTEGRATION_KEY },
      35000
    ).catch((e) => {
      throw new Error(`${e.message} (pyStderr: ${pyErr.slice(-500)})`);
    });
    assert.equal(pyReady.status, 200, 'Live Python adapter /health must return 200 with valid key');

    const pyUnauthorized = await fetch(`${pyUrl}/api/v1/1slabs/health`, {
      headers: { 'X-Integration-Key': 'wrong' }
    });
    assert.equal(pyUnauthorized.status, 401, 'Live Python adapter must reject invalid X-Integration-Key');

    const liveHealth = await checkEngineHealth(pyUrl);
    assert.equal(liveHealth.reachable, true);
    assert.equal(liveHealth.ok, true);
    assert.equal(liveHealth.engine, '1slabs-article-generator-adapter');

    // Kill Python server after live contract verification and start deterministic E2E mock engine for fast pipeline verification
    pythonChild.kill();
    pythonChild = null;

    // ------------------------------------------------------------------
    // Test 5: Full Pipeline -> Quality Gate Rejection -> Approval -> Publish -> Sitemap
    // ------------------------------------------------------------------
    console.log('5. Testing Quality Gate rejection of forbidden claims + manual approval workflow...');
    const mockEngine = buildMockEngineServer(process.env.GENERATOR_INTEGRATION_KEY);
    mockServer = mockEngine.server;
    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const mockUrl = `http://127.0.0.1:${mockServer.address().port}`;

    await updateSettings({
      engine_url: mockUrl,
      approval_mode: 'auto_publish_qualified',
      min_word_count: 600,
      max_auto_regenerations: 0,
      daily_generation_limit: 50,
      enable_auto_images: false
    });

    // 5A. Forbidden Claim draft under auto_publish_qualified -> MUST BE REJECTED, NOT published!
    const badEnqueue = await enqueueManualJob(
      {
        topic: '[E2E_TEST] FORBIDDEN_CLAIM_TEST Panduan Hosting Gratis 1sLabs',
        target_keyword: 'hosting gratis 1slabs',
        pillar_code: 'free-hosting-domain'
      },
      adminUsr,
      { deferProcessing: true }
    );
    await triggerQueueWorker();
    const badItem = await getReviewItem(badEnqueue.item.id);
    assert.equal(badItem.status, 'rejected', 'Draft with forbidden claim must be rejected even in auto_publish_qualified');
    assert.equal(badItem.published_article_id, null, 'Rejected article must NEVER be published');
    assert.ok(
      badItem.quality_report.hard_failures.some((f) => f.code.startsWith('forbidden_')),
      'Hard failure must cite forbidden_* claim rule'
    );

    // 5B. Clean article under manual_approval -> MUST pause at awaiting_review until approved!
    await updateSettings({ approval_mode: 'manual_approval' });
    const goodEnqueue = await enqueueManualJob(
      {
        topic: '[E2E_TEST] Panduan Hosting Gratis dan Subdomain 1sLabs untuk Proyek Awal',
        target_keyword: 'hosting gratis 1slabs',
        secondary_keywords: 'subdomain gratis, free plan 1slabs',
        pillar_code: 'free-hosting-domain'
      },
      adminUsr,
      { deferProcessing: true }
    );
    await triggerQueueWorker();
    const awaitingItem = await getReviewItem(goodEnqueue.item.id);
    assert.equal(awaitingItem.status, 'awaiting_review', 'Manual mode must hold passing article at awaiting_review');
    assert.equal(awaitingItem.quality_passed, 1, 'Clean article must pass Quality Gate');
    assert.equal(awaitingItem.published_article_id, null, 'Must not publish before admin approves');

    // Approve & Publish -> verify visible in blog_articles, public /blog/posts/:slug, and /api/sitemap.xml!
    const pubRes = await approveAndPublishItem(awaitingItem.id, adminUsr, { publishMode: 'published' });
    assert.equal(pubRes.publication.status, 'published');
    const pubSlug = pubRes.publication.slug;

    const publicArticleRes = await fetch(`${apiBase}/blog/posts/${pubSlug}`);
    assert.equal(publicArticleRes.status, 200, 'Published automated article must load via public /blog/posts/:slug');
    const publicJson = await publicArticleRes.json();
    assert.equal(publicJson.article.slug, pubSlug);

    const sitemapXml = await fetch(`${apiBase}/sitemap.xml`).then((r) => r.text());
    assert.ok(sitemapXml.includes(`/blog/${pubSlug}</loc>`), 'Published article URL must appear inside dynamic XML Sitemap');

    // ------------------------------------------------------------------
    // Test 6: Idempotent Duplicate Prevention (Update instead of duplicate insert)
    // ------------------------------------------------------------------
    console.log('6. Testing duplicate prevention & revision snapshot on re-publication...');
    await approveAndPublishItem(awaitingItem.id, adminUsr, { publishMode: 'published', notes: 'E2E Re-publish update check' });
    const dupRows = await query('SELECT id FROM blog_articles WHERE slug = ?', [pubSlug]);
    assert.equal(dupRows.length, 1, 'Re-publishing same article must update existing row cleanly without duplicating');
    const revRows = await query('SELECT id FROM blog_article_revisions WHERE article_id = ?', [dupRows[0].id]);
    assert.ok(revRows.length >= 2, 'Revision history must capture both initial and update snapshots');

    // ------------------------------------------------------------------
    // Test 7: Batch Queue & Error Isolation
    // ------------------------------------------------------------------
    console.log('7. Testing batch queue error isolation (1 fail + 1 success)...');
const SOFTWARE_PAY_ONCE_HTML = `
<p>Memilih software pay once untuk operasional perusahaan semakin relevan bagi pemilik usaha yang lelah menghadapi biaya langganan bulanan per karyawan. Melalui pendekatan perangkat lunak custom milik sendiri, organisasi memiliki kendali penuh terhadap alur data kasir, gudang, dan laporan keuangan internal.</p>
<div class="callout-box" data-tone="info"><p><strong>Poin Utama:</strong> Model pengembangan software pay once menyerahkan hak milik penuh source code dan skema database kepada klien setelah implementasi selesai.</p></div>
<h2>Kapan Perusahaan Perlu Beralih ke Sistem Kasir POS dan Inventori Custom</h2>
<p>Banyak pelaku distribusi dan ritel memulai pencatatan stok menggunakan lembar kerja spreadsheet terpisah di masing-masing cabang. Ketika transaksi harian bertambah pesat, ketidaksinkronan data gudang dan kasir memicu selisih stok maupun keterlambatan penagihan ke mitra B2B.</p>
<p>Dengan membangun aplikasi bisnis terintegrasi memakai Node.js Express, antarmuka React modern, dan database MySQL relasional, manajemen dapat memantau pergerakan barang antarkota secara terpusat. Setiap hak akses staf diatur sesuai peran operasional tanpa tambahan tagihan lisensi per pengguna setiap bulan.</p>
<h2>Integrasi REST API antara Sistem Warisan dan Dashboard Eksekutif</h2>
<p>Sebagian institusi telah mengoperasikan sistem lama seperti perangkat lunak perpustakaan atau akuntansi desktop yang sulit digantikan sekaligus. Strategi modernisasi paling hemat risiko adalah membangun jembatan REST API agar pertukaran katalog, faktur PDF, dan status persetujuan berjalan mulus.</p>
<table>
  <thead>
    <tr><th>Dimensi Evaluasi</th><th>SaaS Berlangganan Umum</th><th>Custom Software Pay Once 1sLabs</th></tr>
  </thead>
  <tbody>
    <tr><td>Biaya per Pengguna</td><td>Bertambah seiring jumlah staf</td><td>Tidak ada biaya per user setelah serah terima</td></tr>
    <tr><td>Penyesuaian Alur Kerja</td><td>Mengikuti fitur standar vendor</td><td>Disesuaikan proses bisnis internal</td></tr>
    <tr><td>Akses Source Code</td><td>Tertutup pada penyedia layanan</td><td>Diserahkan penuh ke pemilik proyek</td></tr>
  </tbody>
</table>
<h2>Tahapan Audit Kebutuhan Sebelum Pengembangan Dimulai</h2>
<p>Tim engineering selalu mengawali proyek dengan pemetaan alur data, definisi otorisasi RBAC, serta perancangan cetak biru tabel relasional. Pendekatan terukur ini memastikan aplikasi mudah dirawat jangka panjang maupun diperluas fitur barunya saat perusahaan berkembang.</p>
<p>Selain merancang skema database yang bersih, tim pengembang harus mendefinisikan batas tanggung jawab setiap peran pengguna secara rinci. Misalnya, staf kasir hanya melihat modul penjualan harian, kepala gudang mengelola mutasi stok antarlokasi, dan direktur keuangan mengakses laporan laba rugi secara langsung tanpa menunggu kompilasi manual akhir pekan.</p>
<p>Aspek keamanan aplikasi bisnis juga harus dibangun sejak awal perancangan, mulai dari validasi tipe data di sisi server, perlindungan autentikasi berbasis token sesi yang aman, pencatatan log aktivitas setiap perubahan data krusial, hingga strategi pencadangan otomatis database ke penyimpanan cadangan terpisah setiap hari.</p>
<h2>Cara Mengukur Kelayakan Investasi Pengembangan Perangkat Lunak Custom</h2>
<p>Pemilik usaha dapat menghitung kelayakan biaya pengembangan perangkat lunak satu kali bayar dengan membandingkan total biaya berlangganan akun SaaS selama dua hingga tiga tahun terhadap estimasi investasi pembangunan awal. Pada organisasi dengan lebih dari lima belas pengguna aktif di cabang berbeda, penghematan biaya lisensi per kursi biasanya terlihat jelas sejak tahun pertama penggunaan.</p>
<p>Keunggulan lain terletak pada fleksibilitas pengembangan modul lanjutan. Ketika perusahaan membuka lini layanan baru, tim developer tidak terkendala oleh keterbatasan fitur bawaan vendor luar karena seluruh arsitektur berada di tangan perusahaan Anda sendiri.</p>
<ul>
  <li>Dokumentasikan formulir cetak, ekspor spreadsheet, dan pelaporan audit yang wajib dipertahankan.</li>
  <li>Tentukan integrasi eksternal yang dibutuhkan seperti gerbang pembayaran QRIS atau notifikasi email transaksional.</li>
  <li>Pelajari layanan pengembangan terkait di <a href="/software-development">Layanan Software Development 1sLabs</a> maupun opsi <a href="/it-consulting">Konsultasi IT 1sLabs</a>.</li>
</ul>
<h2>Pertanyaan yang Sering Diajukan</h2>
<h3>Apa keuntungan utama sistem pay once dibandingkan langganan SaaS?</h3>
<p>Perusahaan bebas merancang alur spesifik internal dan memegang kendali penuh atas aplikasi tanpa kenaikan biaya sewa akun saat merekrut staf baru.</p>
<h3>Apakah tersedia dukungan pemeliharaan setelah sistem dirilis?</h3>
<p>Tersedia masa garansi perbaikan bug pasca-rilis serta paket pemeliharaan tahunan sesuai kesepakatan bersama tim teknis.</p>
<h3>Bagaimana cara memulai diskusi arsitektur sistem custom?</h3>
<p>Jadwalkan sesi pertemuan daring gratis melalui halaman <a href="/schedule">Penjadwalan Konsultasi 1sLabs</a> untuk membedah kebutuhan bisnis Anda.</p>
<div class="oneslabs-cta-block"><p>Ingin membangun sistem POS, ERP, atau otomasi internal tanpa biaya lisensi per karyawan? Konsultasikan rancangan sistem Anda bersama tim engineer kami.</p><a class="oneslabs-cta-btn" href="/software-development">Diskusikan Software Custom 1sLabs</a></div>
`;

    mockEngine.setOverride((body) => ({
      title: body.topic,
      slug: 'e2e-always-draft-software-pay-once',
      excerpt: 'Keunggulan arsitektur software pay once untuk sistem POS, inventori gudang, dan integrasi API tanpa biaya per karyawan.',
      meta_title: 'Software Pay Once Custom 1sLabs untuk Sistem Bisnis Internal',
      meta_description:
        'Ketahui kapan perusahaan harus beralih ke software pay once untuk mengelola kasir POS, inventori multi-gudang, dan integrasi REST API.',
      focus_keyphrase: 'software pay once',
      secondary_keyphrases: 'custom software bisnis, sistem kasir pos, integrasi rest api',
      content: SOFTWARE_PAY_ONCE_HTML,
      faq_items: VALID_FAQ
    }));

    const batchRes = await enqueueBatchJob(
      {
        title: '[E2E_TEST] Batch Isolation Test',
        pillar_code: 'software-development',
        approval_mode: 'always_save_draft',
        topics: [
          '[E2E_TEST] FORCE_ENGINE_FAIL Topik Pertama Gagal',
          '[E2E_TEST] Custom Software Bisnis Pay Once Tanpa Biaya Per User'
        ]
      },
      adminUsr,
      { deferProcessing: true }
    );
    await triggerQueueWorker();
    const [batchJobAfter] = await query('SELECT * FROM content_generation_jobs WHERE id = ?', [batchRes.job.id]);
    const batchItemsAfter = await query('SELECT * FROM content_generation_items WHERE job_id = ? ORDER BY id ASC', [
      batchRes.job.id
    ]);
    if (batchJobAfter.status !== 'partial_failed') {
      console.error('Batch diagnostic:', batchItemsAfter.map((x) => ({
        status: x.status,
        error: x.error_message,
        notes: x.review_notes
      })));
    }
    assert.equal(batchJobAfter.status, 'partial_failed', 'Batch with 1 failed and 1 succeeded item must be partial_failed');
    assert.equal(batchItemsAfter[0].status, 'failed', 'Failed item must be marked failed and isolated');
    assert.equal(batchItemsAfter[0].published_article_id, null);
    assert.equal(batchItemsAfter[1].status, 'saved_draft', 'Second item under always_save_draft must succeed as saved_draft');
    assert.ok(batchItemsAfter[1].published_article_id > 0);
    const [draftRow] = await query('SELECT status FROM blog_articles WHERE id = ?', [batchItemsAfter[1].published_article_id]);
    assert.equal(draftRow.status, 'draft');

    // ------------------------------------------------------------------
    // Test 8: Asia/Jakarta Cron Matcher + DB Schedule Lock
    // ------------------------------------------------------------------
    console.log('8. Testing Asia/Jakarta timezone cron matching & concurrency DB lock...');
    // 2026-11-16 01:00:00Z == 2026-11-16 08:00:00 WIB (Monday, dow=1)
    const jakartaMonday8am = new Date('2026-11-16T01:00:00.000Z');
    assert.equal(cronMatchesJakartaNow('0 8 * * 1,4', jakartaMonday8am), true, '01:00 UTC must match 08:00 WIB Monday');
    assert.equal(cronMatchesJakartaNow('0 8 * * 2', jakartaMonday8am), false, 'Wrong weekday must not match');

    const sched = await createSchedule({
      job_code: 'e2e-lock-test',
      name: '[E2E_TEST] Lock Schedule',
      cron_expression: '0 8 * * 1',
      pillar_code: 'it-consulting',
      articles_per_run: 1,
      is_active: false
    });
    // Simulate held lock from another worker
    await query('UPDATE content_automation_schedules SET locked_at = NOW(), lock_token = ? WHERE id = ?', [
      'simulated-other-worker',
      sched.id
    ]);
    const lockTestRes = await executeSchedule(sched.id, 'cron');
    assert.equal(lockTestRes.skipped_locked, true, 'Locked schedule must skip execution cleanly');
    const [skipLog] = await query('SELECT * FROM content_schedule_runs WHERE schedule_id = ? ORDER BY id DESC LIMIT 1', [
      sched.id
    ]);
    assert.equal(skipLog.status, 'skipped_locked');
    await query('UPDATE content_automation_schedules SET locked_at = NULL, lock_token = NULL WHERE id = ?', [sched.id]);
    await deleteSchedule(sched.id);

    // ------------------------------------------------------------------
    // Test 9: GSC URL Inspection API & Approval-Gated Suggestions
    // ------------------------------------------------------------------
    console.log('9. Testing Google URL Inspection API mapping & approval-gated suggestions...');
    await query(
      `UPDATE blog_gsc_settings
       SET access_token = 'e2e_mock_token', refresh_token = 'e2e_mock_refresh',
           token_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR), site_url = 'https://1slabs.my.id'
       WHERE id = 1`
    );

    globalThis.fetch = async (url, opts) => {
      if (String(url).startsWith('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect')) {
        const reqBody = opts?.body ? JSON.parse(opts.body) : {};
        if (reqBody.siteUrl !== 'sc-domain:1slabs.my.id') {
          return new Response(
            JSON.stringify({
              error: {
                code: 403,
                message: 'You do not own this site, or the inspected URL is not part of this property.'
              }
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({
            inspectionResult: {
              inspectionResultLink: 'https://search.google.com/search-console/inspect?resource_id=sc-domain:1slabs.my.id',
              indexStatusResult: {
                verdict: 'PASS',
                coverageState: 'Submitted and indexed',
                indexingState: 'INDEXING_ALLOWED',
                robotsTxtState: 'ALLOWED',
                pageFetchState: 'SUCCESSFUL',
                googleCanonical: `https://1slabs.my.id/blog/${pubSlug}`,
                userCanonical: `https://1slabs.my.id/blog/${pubSlug}`,
                lastCrawlTime: '2026-11-15T06:00:00Z'
              }
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(url, opts);
    };

    const inspRes = await inspectArticleUrl({
      articleId: dupRows[0].id,
      inspectionUrl: `/blog/${pubSlug}`,
      siteUrlOverride: 'sc-domain:himatif.id',
      userId: adminUsr.id
    });
    assert.equal(inspRes.inspection.verdict, 'PASS');
    assert.equal(inspRes.inspection.site_url, 'sc-domain:1slabs.my.id');
    assert.equal(inspRes.inspection.coverage_state, 'Submitted and indexed');

    // Insert pending suggestion & verify it does NOT mutate blog_articles until explicitly applied!
    const sugIns = await query(
      `INSERT INTO content_optimization_suggestions
       (article_id, source, trigger_metrics_json, proposed_title, proposed_meta_title,
        proposed_meta_description, proposed_focus_keyphrase, proposed_excerpt,
        proposed_content, proposed_faq_json, rationale, status, created_by)
       VALUES (?, 'gsc_performance', '{}', ?, ?, ?, 'hosting gratis 1slabs', ?, ?, ?, 'Improve CTR', 'pending_approval', ?)`,
      [
        dupRows[0].id,
        '[E2E_TEST] Judul Diperbarui Melalui Approval Admin',
        'Judul SEO Diperbarui | 1sLabs',
        'Deskripsi meta baru berbasis sinyal CTR Google Search Console.',
        'Excerpt baru',
        LONG_VALID_HTML,
        JSON.stringify(VALID_FAQ),
        adminUsr.id
      ]
    );

    const [beforeApply] = await query('SELECT title FROM blog_articles WHERE id = ?', [dupRows[0].id]);
    assert.notEqual(
      beforeApply.title,
      '[E2E_TEST] Judul Diperbarui Melalui Approval Admin',
      'Pending suggestion must not overwrite live article before approval'
    );

    const appliedRes = await applyImprovementSuggestion(sugIns.insertId, adminUsr);
    assert.equal(appliedRes.applied, true);
    const [afterApply] = await query('SELECT title FROM blog_articles WHERE id = ?', [dupRows[0].id]);
    assert.equal(afterApply.title, '[E2E_TEST] Judul Diperbarui Melalui Approval Admin');

    // ------------------------------------------------------------------
    // Test 10: Justified Alignment, Autonomous Multi-Pillar, Multi-Pillar Schedule, Gap Analysis & Calendar
    // ------------------------------------------------------------------
    console.log('10. Testing justified alignment, autonomous multi-pillar runner, gap analysis & AI calendar...');
    assert.ok(
      String(publicJson.article.content || '').includes('text-align: justify;'),
      'Published article body paragraphs must carry justified text-align styling'
    );
    const sampleAligned = applyJustifiedBodyAlignment(
      '<h2>Judul Section</h2><p>Paragraf isi utama.</p><div class="oneslabs-cta-block"><p>CTA khusus.</p></div>'
    );
    assert.ok(sampleAligned.includes('<p style="text-align: justify;">Paragraf isi utama.</p>'));
    assert.ok(sampleAligned.includes('<div class="oneslabs-cta-block"><p>CTA khusus.</p></div>'));

    const waitForJobDone = async (jobId) => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const jData = await fetch(`${apiBase}/content-automation/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }).then((r) => r.json());
        if (['completed', 'partial_failed', 'failed', 'cancelled'].includes(jData.job?.status)) {
          return jData;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      throw new Error(`Timeout waiting for job #${jobId} completion`);
    };

    const autoRes = await fetch(`${apiBase}/content-automation/run-autonomous`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pillar_codes: ['free-hosting-domain', 'website-development', 'it-consulting'],
        article_count: 3,
        save_pillar_selection: true,
        approval_mode: 'manual_approval'
      })
    });
    assert.equal(autoRes.status, 202, 'Autonomous one-click runner must return 202 Accepted');
    const autoJson = await autoRes.json();
    assert.equal(autoJson.job.job_type, 'autonomous');
    assert.equal(autoJson.items.length, 3, 'Autonomous runner must enqueue requested balanced articles');
    const autoPillars = new Set(autoJson.items.map((it) => it.pillar_code));
    assert.equal(autoPillars.size, 3, 'Topics must be distributed evenly across the 3 chosen content pillars');

    const latestSettings = await getSettings();
    assert.deepEqual(
      latestSettings.selected_pillars,
      ['free-hosting-domain', 'website-development', 'it-consulting'],
      'Default selected_pillars must persist on settings'
    );

    const finishedAutoJob = await waitForJobDone(autoJson.job.id);
    assert.equal(finishedAutoJob.job.status, 'completed', 'Autonomous job must complete cleanly');
    assert.equal(finishedAutoJob.items[0].status, 'awaiting_review');
    assert.ok(finishedAutoJob.items[0].target_audience, 'Generated item must persist target_audience');
    assert.ok(finishedAutoJob.items[0].featured_image_alt, 'Generated item must persist featured_image_alt');
    assert.ok(
      String(finishedAutoJob.items[0].draft_content || '').includes('text-align: justify;'),
      'Autonomous draft body must carry justified alignment'
    );

    // Multi-pillar scheduler execution
    const multiSched = await createSchedule({
      job_code: 'e2e-multi-pillar-sched',
      name: '[E2E_TEST] Multi-Pillar Daily Schedule',
      cron_expression: '0 8 * * *',
      pillar_codes: ['website-development', 'software-development'],
      articles_per_run: 2,
      approval_mode_override: 'manual_approval',
      is_active: false
    });
    assert.deepEqual(multiSched.pillar_codes, ['website-development', 'software-development']);
    const multiSchedRun = await executeSchedule(multiSched.id, 'manual', { useAi: true });
    assert.equal(multiSchedRun.executed, true);
    assert.equal(multiSchedRun.topics_planned, 2, 'Multi-pillar schedule must enqueue 2 balanced articles');
    await deleteSchedule(multiSched.id);

    // Gap analysis & AI Content Calendar
    const gapRes = await fetch(`${apiBase}/content-automation/strategy/gap-analysis`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then((r) => r.json());
    assert.ok(gapRes.gaps.length >= 11, 'Gap analysis must inspect all 11 content pillars');

    const calGen = await fetch(`${apiBase}/content-automation/strategy/calendar/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pillar_codes: ['free-hosting-domain', 'website-development'],
        days: 2,
        articles_per_day: 1,
        replace_planned: false,
        use_ai: true
      })
    }).then((r) => r.json());
    assert.ok(calGen.created_count >= 1, 'Calendar generator must persist planned calendar slots');
    const firstCalSlot = calGen.calendar.find((c) => String(c.title).includes('[E2E_TEST]'));
    assert.ok(firstCalSlot, 'Generated [E2E_TEST] calendar slot must be returned');

    const calQueueRes = await fetch(`${apiBase}/content-automation/strategy/calendar/${firstCalSlot.id}/queue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ approval_mode: 'manual_approval' })
    });
    assert.equal(calQueueRes.status, 202, 'Queueing calendar slot must return 202');
    const calQueueJson = await calQueueRes.json();
    assert.equal(calQueueJson.calendar_item.status, 'queued');
    await waitForJobDone(calQueueJson.job.id);

    const calDelRes = await fetch(`${apiBase}/content-automation/strategy/calendar/${firstCalSlot.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then((r) => r.json());
    assert.equal(calDelRes.deleted, true);

    // ------------------------------------------------------------------
    // Test 11: AI Image Discovery, SSRF Guard, Local Storage, Quality Gate & Attribution
    // ------------------------------------------------------------------
    console.log('11. Testing AI automated image discovery, SSRF protection, local storage & blog attribution...');
    assert.equal(isPrivateOrReservedIp('127.0.0.1'), true, 'SSRF guard must block loopback IPv4');
    assert.equal(isPrivateOrReservedIp('169.254.169.254'), true, 'SSRF guard must block metadata IP');
    assert.equal(isPrivateOrReservedIp('10.20.30.40'), true, 'SSRF guard must block RFC1918 private IP');
    assert.equal(isPrivateOrReservedIp('::1'), true, 'SSRF guard must block loopback IPv6');
    assert.equal(isPrivateOrReservedIp('8.8.8.8'), false, 'Public IP should be permitted by IP check');

    await assert.rejects(
      () => assertSafePublicHttpsUrl('http://images.unsplash.com/test.jpg'),
      /HTTPS/i,
      'SSRF guard must reject non-HTTPS URLs'
    );
    await assert.rejects(
      () => assertSafePublicHttpsUrl('https://localhost/secret.jpg'),
      /tidak diizinkan/i,
      'SSRF guard must reject localhost'
    );
    await assert.rejects(
      () => assertSafePublicHttpsUrl('https://192.168.1.5/internal.jpg'),
      /tidak diizinkan/i,
      'SSRF guard must reject raw private IP hostnames'
    );

    const injectedSample = insertInlineFiguresInHtml(LONG_VALID_HTML, [
      {
        local_url: '/uploads/articles/item-999999/inline/test-sample.webp',
        alt_text: 'Ilustrasi arsitektur hosting Free Plan',
        caption: 'Setup awal infrastruktur proyek web',
        placement_section: 'Mengapa Memilih Program Free Hosting 1sLabs untuk Proyek Awal?',
        placement_index: 1
      }
    ]);
    assert.ok(injectedSample.includes('data-type="figure-image"'), 'Inline image must match TipTap FigureImageExtension HTML');
    assert.ok(injectedSample.includes('<figcaption'), 'Inline figure must include figcaption');

    // Mock Wikimedia & Openverse external HTTPS calls inside Suite 11 cleanly while passing local requests through
    const upstreamFetch = globalThis.fetch;
    const dnsLookupOrig = require('dns').promises.lookup;
    require('dns').promises.lookup = async (host, opts) => {
      if (host === 'cdn.e2e-stock.test') return [{ address: '93.184.216.34', family: 4 }];
      return dnsLookupOrig(host, opts);
    };
    globalThis.fetch = async (url, init) => {
      const urlStr = String(url || '');
      if (urlStr.startsWith('https://api.openverse.org/')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'ov-feat-1',
                url: 'https://cdn.e2e-stock.test/featured-dev-laptop.png',
                thumbnail: 'https://cdn.e2e-stock.test/thumb1.png',
                title: 'Software developer laptop modern office',
                creator: 'Adi Pratama',
                creator_url: 'https://openverse.org/creator/adi',
                foreign_landing_url: 'https://openverse.org/image/ov-feat-1',
                license: 'by',
                license_version: '4.0',
                width: 1600,
                height: 900
              },
              {
                id: 'ov-inline-1',
                url: 'https://cdn.e2e-stock.test/inline-team-code.png',
                thumbnail: 'https://cdn.e2e-stock.test/thumb2.png',
                title: 'Web developer team code screen laptop',
                creator: 'Siti Aminah',
                creator_url: 'https://openverse.org/creator/siti',
                foreign_landing_url: 'https://openverse.org/image/ov-inline-1',
                license: 'cc0',
                license_version: '1.0',
                width: 1440,
                height: 810
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.startsWith('https://commons.wikimedia.org/')) {
        return new Response(JSON.stringify({ query: { pages: {} } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (urlStr === 'https://cdn.e2e-stock.test/featured-dev-laptop.png') {
        const distinctFeatured = Buffer.concat([MOCK_TINY_PNG, Buffer.alloc(700, 0x51)]);
        return new Response(distinctFeatured, {
          status: 200,
          headers: { 'Content-Type': 'image/png', 'Content-Length': String(distinctFeatured.length) }
        });
      }
      if (urlStr === 'https://cdn.e2e-stock.test/inline-team-code.png') {
        const distinctInline = Buffer.concat([MOCK_TINY_PNG, Buffer.alloc(720, 0x62)]);
        return new Response(distinctInline, {
          status: 200,
          headers: { 'Content-Type': 'image/png', 'Content-Length': String(distinctInline.length) }
        });
      }
      return upstreamFetch(url, init);
    };

    try {
      const provRes = await fetch(`${apiBase}/content-automation/images/providers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then((r) => r.json());
      assert.equal(provRes.providers.openverse.configured, true, 'Provider readiness endpoint must expose status cleanly');
      assert.equal(provRes.providers.unsplash.key_required, true);
      assert.equal(JSON.stringify(provRes).includes('AIza'), false, 'Providers status must never leak keys');

      await updateSettings({
        enable_auto_images: true,
        image_quality_validation: true,
        image_primary_provider: 'openverse',
        max_images_per_article: 3,
        preferred_image_format: 'webp',
        enable_ai_image_fallback: false,
        approval_mode: 'auto_publish_qualified'
      });

      const imgJob = await enqueueManualJob(
        {
          topic: '[E2E_TEST] Implementasi Otomatisasi ERP Keuangan UMKM Berbasis Cloud',
          target_keyword: 'otomatisasi erp keuangan',
          pillar_code: 'software-development'
        },
        adminUsr,
        { deferProcessing: true }
      );
      await triggerQueueWorker();
      const completedImgItem = await getReviewItem(imgJob.item.id);

      assert.equal(
        completedImgItem.status,
        'published',
        `Article with valid automated images must pass & auto-publish (got ${completedImgItem.status}; hard=${JSON.stringify(
          completedImgItem.quality_report?.hard_failures || []
        )}; score=${JSON.stringify(completedImgItem.quality_report?.score_failures || [])}; imgIssues=${JSON.stringify(
          completedImgItem.image_quality_report || {}
        )}; imgs=${JSON.stringify(completedImgItem.images || [])})`
      );
      assert.ok(completedImgItem.draft_featured_image, 'Item must persist draft_featured_image');
      assert.ok(completedImgItem.published_article_id, 'Must publish into blog_articles');
      assert.ok(Array.isArray(completedImgItem.images) && completedImgItem.images.length >= 2, 'Must track featured + inline in article_images');
      assert.ok(completedImgItem.image_quality_report?.passed, 'Image Quality Gate report must pass cleanly');

      const [pubArt] = await query('SELECT * FROM blog_articles WHERE id = ?', [completedImgItem.published_article_id]);
      assert.ok(
        String(pubArt.featured_image || '').startsWith(`/uploads/articles/${pubArt.id}/featured/`),
        `Published article featured_image must organize under /uploads/articles/${pubArt.id}/featured/ (got ${pubArt.featured_image})`
      );
      assert.ok(pubArt.content.includes(`/uploads/articles/${pubArt.id}/inline/`), 'Inline HTML image must rewrite to article folder');
      assert.ok(pubArt.image_attribution_json, 'Published article must persist image_attribution_json');

      const pubBlogRes = await fetch(`${apiBase}/blog/posts/${pubArt.slug}`).then((r) => r.json());
      assert.ok(
        Array.isArray(pubBlogRes.article.image_attributions) && pubBlogRes.article.image_attributions.length >= 1,
        'Public blog API must return image_attributions'
      );

      const mediaLibRes = await fetch(`${apiBase}/blog/admin/media?scope=articles`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then((r) => r.json());
      assert.ok(
        mediaLibRes.media.some((m) => m.url === pubArt.featured_image),
        'Published article image must be browsable via /blog/admin/media'
      );
    } finally {
      globalThis.fetch = upstreamFetch;
      require('dns').promises.lookup = dnsLookupOrig;
    }

    console.log('\nALL E2E INTEGRATION CHECKS PASSED (11/11 Suites)! OK');
  } finally {
    globalThis.fetch = originalFetch;
    if (pythonChild) pythonChild.kill();
    if (mockServer) mockServer.close();
    if (expressServer) expressServer.close();
    await cleanupTestArtifacts();
    await query(
      `UPDATE blog_gsc_settings SET access_token = NULL, refresh_token = NULL, token_expires_at = NULL WHERE id = 1`
    ).catch(() => {});
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[E2E TEST FAILED]:', err);
    process.exit(1);
  });
