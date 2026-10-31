export interface DocSection {
  id: string;
  title: string;
}

export interface DocArticle {
  slug: string;
  title: string;
  category: string;
  categoryTitle: string;
  description: string;
  lastUpdated: string;
  readingTime: string;
  keywords: string[];
  toc: DocSection[];
  content: string;
}

export interface DocCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  articles: DocArticle[];
}

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    description: 'Panduan awal mengenal platform, pendaftaran akun, dan navigasi portal 1sLabs.',
    iconName: 'Sparkles',
    articles: [
      {
        slug: 'mengenal-1slabs',
        title: 'Mengenal 1sLabs & Arsitektur Layanan',
        category: 'getting-started',
        categoryTitle: 'Getting Started',
        description: 'Pelajari visi, infrastruktur cloud hosting, dan ekosistem software development 1sLabs.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '3 menit',
        keywords: ['mengenal 1slabs', 'layanan it indonesia', 'arsitektur hosting 1slabs'],
        toc: [
          { id: 'tentang-1slabs', title: 'Tentang 1sLabs' },
          { id: 'ekosistem-layanan', title: 'Ekosistem Layanan Terpadu' },
          { id: 'keunggulan-arsitektur', title: 'Keunggulan Arsitektur Infrastruktur' }
        ],
        content: `
### Tentang 1sLabs
1sLabs adalah penyedia layanan teknologi informasi (IT Services Provider) dan platform hosting berbasis enterprise di Indonesia. Kami berfokus membantu pelaku bisnis, startup, UMKM, institusi pendidikan, dan developer dalam membangun, mendeploy, serta memelihara aplikasi web modern dengan keandalan tinggi.

### Ekosistem Layanan Terpadu
Platform 1sLabs menggabungkan empat pilar utama solusi digital:
1. **Managed Cloud Hosting & Runtime:** Server berkecepatan tinggi dengan cPanel, CloudLinux OS, Node.js Selector, dan Apache/LiteSpeed web server.
2. **Jasa Pembuatan Website & Web Application:** Solusi custom software mulai dari Company Profile, Portal Berita, E-Commerce, hingga Enterprise ERP/CRM.
3. **Annual Website Maintenance:** Layanan kontrak perawatan berkelanjutan mencakup bug fixing, optimasi kecepatan, update framework/dependensi, dan mitigasi keamanan.
4. **Free Plan Developer Program:** Inisiatif CSR 1sLabs yang menyediakan hosting dan subdomain gratis bagi pelajar, developer pemula, dan riset akademik.

### Keunggulan Arsitektur Infrastruktur
Server 1sLabs menggunakan datacenter tier-3 berlokasi di Indonesia dengan latensi rendah (< 15ms ke seluruh penyedia ISP nasional). Seluruh akun hosting diisolasi dengan CageFS untuk mencegah kontaminasi silang antar pengguna.
`
      },
      {
        slug: 'membuat-akun-dan-verifikasi',
        title: 'Membuat Akun & Verifikasi Email',
        category: 'getting-started',
        categoryTitle: 'Getting Started',
        description: 'Langkah registrasi akun pelanggan 1sLabs dan aktivasi autentikasi email.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '3 menit',
        keywords: ['daftar 1slabs', 'verifikasi email', 'akun portal hosting'],
        toc: [
          { id: 'alur-pendaftaran', title: 'Alur Pendaftaran' },
          { id: 'verifikasi-email', title: 'Aktivasi & Verifikasi Email' },
          { id: 'troubleshooting-pendaftaran', title: 'Troubleshooting Registrasi' }
        ],
        content: `
### Alur Pendaftaran
Untuk mulai menggunakan layanan 1sLabs, kunjungi halaman registrasi di \`/register\`.
1. Masukkan **Nama Lengkap**, **Alamat Email Aktif**, dan **Password** minimal 8 karakter.
2. Pastikan email yang dimasukkan valid karena seluruh detail login hosting, invoice tagihan, dan pembaruan SSL akan dikirimkan ke email tersebut.
3. Klik **Daftar Akun Baru**.

### Aktivasi & Verifikasi Email
Setelah mendaftar:
- Sistem akan otomatis mengirimkan surel aktivasi resmi dengan subjek *"[1sLabs] Verifikasi Alamat Email Anda"*.
- Buka kotak masuk email Anda dan klik tombol **Verifikasi Akun Saya**.
- Jika email belum masuk dalam 2 menit, periksa folder *Spam / Promosi*, atau klik tautan **Kirim Ulang Email Verifikasi** di banner Portal Pelanggan.

### Troubleshooting Registrasi
- **Email sudah terdaftar:** Gunakan menu lupa password di \`/login\` jika Anda sebelumnya pernah membuat akun.
- **Tautan kadaluarsa:** Token aktivasi berlaku selama 24 jam. Kirim ulang tautan baru dari dashboard jika sudah expired.
`
      }
    ]
  },
  {
    id: 'free-plan',
    title: '2. Free Plan Program',
    description: 'Panduan lengkap klaim hosting gratis, kuota penggunaan, aturan renewal, dan masa aktif.',
    iconName: 'Gift',
    articles: [
      {
        slug: 'apa-itu-free-plan',
        title: 'Mengenal Program Free Plan 1sLabs',
        category: 'free-plan',
        categoryTitle: 'Free Plan Program',
        description: 'Detail fasilitas, resource limit, dan tujuan program hosting gratis 1sLabs.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['hosting gratis indonesia', 'free plan 1slabs', 'subdomain gratis'],
        toc: [
          { id: 'tujuan-program', title: 'Tujuan Program' },
          { id: 'fasilitas-yang-didapat', title: 'Fasilitas & Spesifikasi' },
          { id: 'kebijakan-fair-usage', title: 'Ketentuan Fair Usage Policy (FUP)' }
        ],
        content: `
### Tujuan Program
Program **Free Plan** adalah komitmen 1sLabs untuk memberdayakan talenta digital Indonesia. Melalui program ini, pelajar, mahasiswa, dan programmer pemula dapat langsung mendeploy portofolio atau API Node.js tanpa kartu kredit dan tanpa biaya tersembunyi.

### Fasilitas & Spesifikasi
Setiap akun yang memenuhi syarat berhak mendapatkan:
- **1x Subdomain Gratis:** Format \`namaanda.1slabs.my.id\` dengan DNS otomatis terhubung.
- **Storage Kuota:** 1 GB NVMe SSD Storage.
- **Node.js Runtime:** 1x Aplikasi Node.js Selector aktif (pilihan Node 20, 22, atau 24).
- **SSL Otomatis:** Sertifikat Let's Encrypt / AutoSSL HTTPS gratis.
- **File Manager & FTP:** Akses manajemen berkas langsung dari browser portal.
- **Masa Aktif Awal:** 30 hari kalender, dapat diperpanjang tanpa batas biaya.

### Ketentuan Fair Usage Policy (FUP)
- Dilarang keras menggunakan resource hosting untuk crypto mining, brute-force hacking, phishing, pornografi, atau konten yang melanggar hukum RI.
- Pelanggaran terhadap FUP akan menyebabkan akun dan subdomain disuspend secara permanen tanpa pemberitahuan.
`
      },
      {
        slug: 'cara-klaim-dan-renewal-free-plan',
        title: 'Cara Klaim & Perpanjangan Masa Aktif Free Plan',
        category: 'free-plan',
        categoryTitle: 'Free Plan Program',
        description: 'Langkah mengklaim kuota dan memperpanjang masa aktif Free Plan sebelum kadaluarsa.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['cara klaim free plan', 'perpanjangan free hosting', 'renewal hosting gratis'],
        toc: [
          { id: 'langkah-klaim', title: 'Langkah Klaim Subdomain' },
          { id: 'sistem-renewal', title: 'Cara Perpanjangan (Renewal)' },
          { id: 'status-suspensi', title: 'Apa yang Terjadi Jika Expired?' }
        ],
        content: `
### Langkah Klaim Subdomain
1. Pastikan Anda sudah login dan email akun telah berstatus terverifikasi.
2. Masuk ke **Customer Portal** (\`/portal\`) dan buka tab **Free Plan**.
3. Masukkan prefiks subdomain yang Anda inginkan (contoh: \`portofolio-dzikri\`).
4. Sistem akan memvalidasi ketersediaan prefiks secara real-time.
5. Klik **Klaim Subdomain Gratis**. Sistem cPanel 1sLabs akan melakukan auto-provisioning direktori \`public_html\` dan konfigurasi vhost dalam 5–10 detik.

### Cara Perpanjangan (Renewal)
- Layanan Free Plan memiliki masa aktif siklus 30 hari.
- Anda dapat mengklik tombol **Perpanjang Masa Aktif (+30 Hari)** kapan saja ketika sisa masa aktif berada di bawah 14 hari.
- Perpanjangan Free Plan adalah 100% gratis dan tidak memotong saldo apapun.

### Status Suspensi
Jika masa aktif habis dan belum diperpanjang:
1. **Hari ke-1 setelah Expired:** Subdomain akan dialihkan ke halaman peringatan suspensi. Berkas dan database Anda tetap aman tersimpan selama 14 hari masa tenggang (grace period).
2. **Hari ke-14 setelah Expired:** Jika tetap tidak diperpanjang, direktori akan dibersihkan oleh sistem scheduler otomatis.
`
      }
    ]
  },
  {
    id: 'domain-management',
    title: '3. Domain Management & DNS',
    description: 'Konfigurasi subdomain, custom domain (.com, .id), DNS records, dan SSL HTTPS.',
    iconName: 'Globe',
    articles: [
      {
        slug: 'konfigurasi-dns-custom-domain',
        title: 'Menghubungkan Custom Domain & Pengaturan DNS',
        category: 'domain-management',
        categoryTitle: 'Domain Management',
        description: 'Cara mengarahkan domain pribadi (.com, .id, .net) ke server hosting 1sLabs.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '5 menit',
        keywords: ['custom domain', 'dns hosting 1slabs', 'nameserver cpanel', 'a record'],
        toc: [
          { id: 'opsi-penghubung', title: 'Pilihan Metode Penghubung DNS' },
          { id: 'metode-a-record', title: 'Metode 1: Menggunakan A Record (Disarankan)' },
          { id: 'metode-nameserver', title: 'Metode 2: Menggunakan Nameserver' },
          { id: 'verifikasi-koneksi', title: 'Memeriksa Propagasi DNS' }
        ],
        content: `
### Pilihan Metode Penghubung DNS
Jika Anda membeli nama domain di registrar luar (seperti Niagahoster, Domainesia, Rumahweb, Namecheap, atau Cloudflare), Anda memiliki 2 cara untuk menghubungkannya ke 1sLabs:

### Metode 1: Menggunakan A Record (Disarankan)
Metode ini memungkinkan Anda tetap mengelola DNS di registrar atau Cloudflare:
1. Buka DNS Management di penyedia domain Anda.
2. Buat **A Record** dengan parameter berikut:
   - **Host / Name:** \`@\` (root domain)
   - **Target / Value:** \`103.119.237.132\` (IP Server 1sLabs)
   - **TTL:** \`3600\` (atau Auto)
3. Buat **CNAME Record** untuk subdomain www:
   - **Host / Name:** \`www\`
   - **Target / Value:** \`domainanda.com\`

### Metode 2: Menggunakan Nameserver
Jika Anda ingin DNS dikelola terpusat oleh server 1sLabs:
- **NS 1:** \`ns1.domainmurah.net\`
- **NS 2:** \`ns2.domainmurah.net\`

### Memeriksa Propagasi DNS
Propagasi DNS global membutuhkan waktu antara 15 menit hingga maksimal 24 jam tergantung penyedia ISP Anda. Anda dapat mengecek status resolusi DNS secara langsung di portal 1sLabs menu **Domains**, atau menggunakan tool pihak ketiga seperti \`whatsmydns.net\`.
`
      },
      {
        slug: 'ssl-dan-https',
        title: 'Penerbitan SSL & Pengalihan HTTPS',
        category: 'domain-management',
        categoryTitle: 'Domain Management',
        description: 'Panduan keamanan AutoSSL, sertifikat Let\'s Encrypt, dan rewrite rules HTTPS.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['ssl gratis', 'autossl cpanel', 'https redirect .htaccess'],
        toc: [
          { id: 'autossl-cpanel', title: 'Penerbitan Otomatis AutoSSL' },
          { id: 'enforce-https', title: 'Memaksa Pengalihan HTTP ke HTTPS (.htaccess)' },
          { id: 'troubleshooting-ssl', title: 'Solusi SSL Pending / Error' }
        ],
        content: `
### Penerbitan Otomatis AutoSSL
Seluruh domain dan subdomain yang terdaftar pada sistem 1sLabs otomatis didukung oleh **cPanel AutoSSL** (Didukung oleh Let's Encrypt / Sectigo).
- Sertifikat SSL akan diterbitkan secara otomatis setelah DNS domain berhasil terhubung ke server \`103.119.237.132\`.
- Masa aktif sertifikat adalah 90 hari dan akan diperbarui otomatis oleh cron server setiap 60 hari.

### Memaksa Pengalihan HTTP ke HTTPS (.htaccess)
Untuk memastikan seluruh pengunjung selalu menggunakan jalur terenkripsi HTTPS, tambahkan aturan rewrite berikut pada file \`.htaccess\` di root direktori website Anda:

\`\`\`apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
\`\`\`

### Solusi SSL Pending / Error
Jika status SSL di portal masih bertuliskan *Pending* atau *Failed*:
1. Pastikan domain sudah benar-benar mengarah ke IP \`103.119.237.132\`. Jika domain masih mengarah ke IP lama, validator SSL tidak dapat menerbitkan sertifikat.
2. Pastikan file \`.well-known/acme-challenge/\` tidak diblokir oleh rewrite rules custom.
`
      }
    ]
  },
  {
    id: 'hosting-management',
    title: '4. Hosting Management & Files',
    description: 'Pengelolaan file manager, struktur direktori, document root, dan FTP.',
    iconName: 'Server',
    articles: [
      {
        slug: 'struktur-folder-dan-document-root',
        title: 'Struktur Folder & Document Root Hosting',
        category: 'hosting-management',
        categoryTitle: 'Hosting Management',
        description: 'Pahami letak berkas publik, log, database backups, dan isolasi direktori pengguna.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['document root', 'public_html', 'struktur folder cpanel'],
        toc: [
          { id: 'hirarki-folder', title: 'Hirarki Direktori Pengguna' },
          { id: 'document-root-penjelasan', title: 'Aturan Document Root' },
          { id: 'izin-file', title: 'Izin Akses Berkas (File Permissions)' }
        ],
        content: `
### Hirarki Direktori Pengguna
Pada ekosistem hosting 1sLabs, setiap akun memiliki struktur direktori terisolasi:
- \`/public_html/\`: Direktori utama untuk domain primer akun Anda.
- \`/public_html/subdomain.domain.com/\`: Direktori publik untuk subdomain atau addon domain yang dibuat.
- \`/ssl/\`: Sertifikat SSL internal (hanya dibaca oleh web server).
- \`/tmp/\`: Berkas sementara runtime dan socket restart.

### Aturan Document Root
- File berkas web (HTML, CSS, JS, Gambar) harus diletakkan langsung di dalam direktori document root yang bersangkutan.
- File awal yang dieksekusi web server secara default adalah \`index.html\`, \`index.php\`, atau file yang didefinisikan pada \`.htaccess\`.

### Izin Akses Berkas (File Permissions)
Demi keamanan server CloudLinux:
- Folder / Direktori: Gunakan permission **755** (\`drwxr-xr-x\`).
- Berkas / Files: Gunakan permission **644** (\`-rw-r--r--\`).
- Hindari mengatur permission **777** karena sistem perlindungan suEXEC akan menolak eksekusi skrip demi mencegah eksploitasi kode.
`
      },
      {
        slug: 'menggunakan-file-manager-dan-ftp',
        title: 'Menggunakan File Manager & Akses Akun FTP',
        category: 'hosting-management',
        categoryTitle: 'Hosting Management',
        description: 'Cara mengunggah berkas web, mengekstrak arsip ZIP, dan menghubungkan FileZilla via FTP.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['file manager hosting', 'ftp filezilla', 'upload file web'],
        toc: [
          { id: 'web-file-manager', title: 'Web File Manager di Customer Portal' },
          { id: 'ekstrak-zip', title: 'Ekstraksi Berkas ZIP Otomatis' },
          { id: 'koneksi-ftp', title: 'Menghubungkan FTP Client (FileZilla / WinSCP)' }
        ],
        content: `
### Web File Manager di Customer Portal
Anda tidak wajib membuka cPanel untuk mengelola berkas. Buka tab **File Manager** pada Customer Portal:
- Anda dapat membuat folder baru, membuat file baru, mengedit kode dengan syntax highlighter, dan menghapus berkas.
- Drag-and-drop berkas langsung dari komputer Anda untuk mengunggah.

### Ekstraksi Berkas ZIP Otomatis
Jika Anda memiliki proyek website dengan puluhan atau ratusan file (misalnya hasil build React atau template HTML):
1. Kompres seluruh isi folder menjadi berkas tunggal bertipe \`.zip\`.
2. Unggah berkas ZIP tersebut ke folder tujuan di File Manager.
3. Klik ikon opsi (\`...\`) pada file ZIP dan pilih **Ekstrak Berkas Arsip**.
4. Seluruh berkas akan diekstrak di server dalam hitungan detik.

### Menghubungkan FTP Client (FileZilla / WinSCP)
Jika Anda lebih terbiasa menggunakan FTP client:
- **Host / Server:** \`103.119.237.132\` (atau \`ftp.1slabs.my.id\`)
- **Username:** Sesuai akun FTP yang dibuat di tab *FTP Management*.
- **Password:** Password akun FTP Anda.
- **Port:** \`21\` (FTP standar dengan TLS/SSL Explicit).
`
      }
    ]
  },
  {
    id: 'frontend-deployment',
    title: '5. Frontend Deployment Guide',
    description: 'Panduan deploy website statis, React, Vue, Vite, Next.js static export, dan routing SPA.',
    iconName: 'Layout',
    articles: [
      {
        slug: 'deploy-react-vue-vite',
        title: 'Cara Deploy React, Vue & Vite ke 1sLabs',
        category: 'frontend-deployment',
        categoryTitle: 'Frontend Deployment',
        description: 'Langkah build production dan konfigurasi routing Single Page Application (SPA).',
        lastUpdated: '31 Oktober 2026',
        readingTime: '5 menit',
        keywords: ['deploy react', 'deploy vite', 'deploy vue', 'spa htaccess rewrite'],
        toc: [
          { id: 'build-production', title: '1. Build Production di Komputer Lokal' },
          { id: 'upload-dist', title: '2. Upload Isi Folder dist ke Server' },
          { id: 'spa-htaccess', title: '3. Konfigurasi .htaccess untuk Client-Side Routing' },
          { id: 'troubleshooting-404', title: '4. Troubleshooting 404 saat Halaman di-Refresh' }
        ],
        content: `
### 1. Build Production di Komputer Lokal
Sebelum mengunggah proyek React atau Vue yang dibuat dengan Vite:
1. Buka terminal di direktori proyek lokal Anda.
2. Jalankan perintah kompilasi produksi:

\`\`\`bash
npm run build
# atau
yarn build
# atau
pnpm build
\`\`\`

3. Proses ini akan menghasilkan folder bernama \`dist\` (atau \`build\`) yang berisi berkas statis teroptimasi (\`index.html\`, file JavaScript, CSS, dan aset).

### 2. Upload Isi Folder dist ke Server
1. Masuk ke dalam folder \`dist\` lokal Anda.
2. Kompres **seluruh isi** di dalam folder \`dist\` (bukan folder \`dist\`-nya, melainkan isinya) menjadi berkas \`build.zip\`.
3. Buka **Customer Portal 1sLabs** > **File Manager** > buka folder document root domain Anda.
4. Unggah \`build.zip\` dan klik **Ekstrak Berkas Arsip**.
5. Pastikan \`index.html\` berada langsung di dalam root folder domain, bukan bersarang di subfolder \`dist\`.

### 3. Konfigurasi .htaccess untuk Client-Side Routing
Pada aplikasi SPA (React Router, Vue Router), jika pengunjung merefresh halaman seperti \`/about\` atau \`/portal\`, web server akan mencari file fisik \`/about.html\` dan menampilkan 404 jika aturan rewrite belum dipasang.

Buat file bernama \`.htaccess\` di folder document root dengan isi:

\`\`\`apache
Options +FollowSymLinks
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/ - [L]
  RewriteRule ^uploads/ - [L]
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
\`\`\`

### 4. Troubleshooting 404 saat Halaman di-Refresh
- Pastikan modul \`mod_rewrite\` aktif (pada server 1sLabs sudah aktif secara default).
- Pastikan nama file adalah \`.htaccess\` diawali titik (bukan \`htaccess.txt\`).
`
      }
    ]
  },
  {
    id: 'nodejs-application',
    title: '6. Node.js Application Manager',
    description: 'Panduan lengkap membuat API Express/Fastify, konfigurasi runtime, environment variables, dan restart.',
    iconName: 'Cpu',
    articles: [
      {
        slug: 'membuat-aplikasi-nodejs-cpanel',
        title: 'Membuat & Mengonfigurasi Aplikasi Node.js',
        category: 'nodejs-application',
        categoryTitle: 'Node.js Application',
        description: 'Panduan membuat REST API backend Node.js menggunakan CloudLinux Node.js Selector.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '6 menit',
        keywords: ['nodejs hosting indonesia', 'cloudlinux nodejs selector', 'express js cpanel'],
        toc: [
          { id: 'parameter-aplikasi', title: 'Parameter Konfigurasi Node.js' },
          { id: 'langkah-pembuatan', title: 'Langkah Membuat Aplikasi di Portal' },
          { id: 'startup-file', title: 'Aturan Startup File (index.js / server.js)' },
          { id: 'env-variables', title: 'Pengaturan Environment Variables (.env)' }
        ],
        content: `
### Parameter Konfigurasi Node.js
Pada platform 1sLabs, runtime Node.js dikelola langsung melalui CloudLinux Node.js Selector dengan web server Phusion Passenger. Berikut parameter penting yang harus dipahami:
- **Node.js Version:** Pilihan versi resmi LTS (Node.js 20, 22, atau 24).
- **Application Root:** Direktori fisik di server tempat kode Node.js Anda disimpan (contoh: \`api-backend\`).
- **Application URL:** Subdomain atau path URL tempat API diakses (contoh: \`api.domainanda.my.id\` atau \`/\`).
- **Startup File:** Berkas JavaScript entri utama yang mengekspor server Express/HTTP (biasanya \`index.js\` atau \`app.js\`).

### Langkah Membuat Aplikasi di Portal
1. Buka Customer Portal dan pilih tab **Node.js Apps**.
2. Klik tombol **Buat Aplikasi Node.js Baru**.
3. Masukkan **Nama Aplikasi** dan pilih **Domain** target.
4. Pilih **Versi Node.js** yang sesuai dengan dependensi Anda.
5. Klik **Deploy Aplikasi**. Sistem akan menginisiasi virtualenv, membuat berkas starter, dan mengaktifkan vhost.

### Aturan Startup File (index.js / server.js)
Pastikan aplikasi Express Anda mendengarkan port dari \`process.env.PORT\`:

\`\`\`javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
\`\`\`

### Pengaturan Environment Variables (.env)
Jangan pernah mengekspos token rahasia, JWT secret, atau database password ke repository publik. Gunakan tab **Kelola Konfigurasi & ENV** di menu Node.js Apps portal untuk memasukkan pasangan KEY dan VALUE secara aman.
`
      },
      {
        slug: 'npm-install-dan-restart-aplikasi',
        title: 'Instalasi Paket NPM & Restart Aplikasi',
        category: 'nodejs-application',
        categoryTitle: 'Node.js Application',
        description: 'Cara menjalankan npm install untuk dependensi dan me-restart worker Passenger.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['npm install cpanel', 'restart nodejs', 'restart.txt passenger'],
        toc: [
          { id: 'menjalankan-npm-install', title: 'Menjalankan npm install' },
          { id: 'cara-restart-aplikasi', title: 'Cara Restart Aplikasi Node.js' },
          { id: 'melihat-logs', title: 'Memeriksa Log Error (Logs Viewer)' }
        ],
        content: `
### Menjalankan npm install
Setelah Anda mengunggah berkas \`package.json\`:
1. Buka detail aplikasi Node.js Anda di Customer Portal.
2. Klik tombol **Run NPM Install**.
3. Sistem akan memicu instalasi dependensi di dalam isolasi virtualenv Node.js tanpa memakan resource pengguna lain.

### Cara Restart Aplikasi Node.js
Karena Passenger menjaga proses Node.js tetap hidup (daemon process) di latar belakang:
- Setiap kali Anda mengubah isi file JavaScript atau mengubah file \`.env\`, Anda wajib me-restart aplikasi.
- Klik tombol **Restart** pada kartu aplikasi di Customer Portal.
- Sistem akan otomatis mengeksekusi \`touch tmp/restart.txt\` dan memanggil CloudLinux Selector restart hook.

### Memeriksa Log Error (Logs Viewer)
Jika aplikasi mengembalikan HTTP 500 atau 503 Service Unavailable:
- Buka tombol **Lihat Log** pada tab Node.js Apps.
- Portal akan menampilkan 100 baris terakhir dari berkas \`stderr.log\` untuk melihat jejak stack trace error kode JavaScript Anda.
`
      }
    ]
  },
  {
    id: 'api-development',
    title: '7. API Development & Integration',
    description: 'Panduan arsitektur REST API, CORS configuration, database connection, dan security headers.',
    iconName: 'Code',
    articles: [
      {
        slug: 'koneksi-database-mysql-nodejs',
        title: 'Menghubungkan Database MySQL ke Node.js',
        category: 'api-development',
        categoryTitle: 'API Development',
        description: 'Praktik terbaik pooling koneksi mysql2 dan pencegahan SQL Injection.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '5 menit',
        keywords: ['mysql nodejs', 'connection pool mysql2', 'sql injection prevention'],
        toc: [
          { id: 'konfigurasi-pool', title: 'Membuat Connection Pool (mysql2)' },
          { id: 'parameterized-queries', title: 'Query Terparameter (Anti SQL-Injection)' },
          { id: 'cors-configuration', title: 'Konfigurasi Cross-Origin Resource Sharing (CORS)' }
        ],
        content: `
### Membuat Connection Pool (mysql2)
Gunakan connection pool untuk performa backend yang stabil:

\`\`\`javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
\`\`\`

### Query Terparameter (Anti SQL-Injection)
Jangan pernah menggabungkan variabel input langsung ke dalam string query SQL. Selalu gunakan placeholder tanda tanya (\`?\`):

\`\`\`javascript
// CONTOH BENAR (AMAN):
const [rows] = await pool.query(
  'SELECT id, email, name FROM users WHERE email = ? AND status = ?',
  [inputEmail, 'active']
);
\`\`\`

### Konfigurasi Cross-Origin Resource Sharing (CORS)
Jika frontend Anda berada di domain yang berbeda dengan backend API (misalnya frontend di \`web.com\` dan API di \`api.web.com\`), pasang middleware cors:

\`\`\`javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://domainanda.com', 'https://www.domainanda.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
\`\`\`
`
      }
    ]
  },
  {
    id: 'billing-payment',
    title: '8. Billing, Invoices & Payments',
    description: 'Metode pembayaran QRIS, konfirmasi transfer otomatis, dan pencatatan invoice resmi.',
    iconName: 'Receipt',
    articles: [
      {
        slug: 'alur-pembayaran-dan-verifikasi',
        title: 'Alur Pembayaran QRIS & Verifikasi Invoice',
        category: 'billing-payment',
        categoryTitle: 'Billing & Payment',
        description: 'Cara menyelesaikan pesanan hosting dengan QRIS dan mengunduh invoice resmi.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '3 menit',
        keywords: ['pembayaran qris', 'invoice hosting 1slabs', 'konfirmasi transfer'],
        toc: [
          { id: 'proses-checkout', title: 'Proses Checkout & Pembuatan Tagihan' },
          { id: 'pembayaran-qris', title: 'Pembayaran Menggunakan QRIS' },
          { id: 'verifikasi-dan-aktivasi', title: 'Verifikasi & Aktivasi Layanan' }
        ],
        content: `
### Proses Checkout & Pembuatan Tagihan
1. Pilih paket hosting atau ajukan perpanjangan domain di website 1sLabs.
2. Masukkan rincian domain Anda di halaman checkout.
3. Sistem akan menghasilkan nomor pesanan resmi (\`ORD-YYYYMMDD-XXXX\`) dan mengunci domain tersebut selama 24 jam.

### Pembayaran Menggunakan QRIS
- Halaman pembayaran (\`/payment/ORD-...\`) akan menampilkan kode QRIS dinamis berstandar Bank Indonesia.
- Buka aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, Dana, ShopeePay).
- Pindai kode QRIS dan selesaikan transaksi sesuai nominal yang tertera.
- Unggah bukti transfer pada form yang disediakan untuk proses rekonsiliasi cepat.

### Verifikasi & Aktivasi Layanan
- Setelah pembayaran diverifikasi oleh tim finance / sistem otomatis, invoice resmi bertanda status **PAID** akan dikirimkan ke email Anda.
- Layanan hosting Anda akan langsung berstatus **ACTIVE** dan kredensial akses dapat dilihat di Customer Portal.
`
      }
    ]
  },
  {
    id: 'website-maintenance',
    title: '9. Annual Website Maintenance',
    description: 'Program pemeliharaan website tahunan, lingkup kerja, bug fixing, dan assessment teknis.',
    iconName: 'Wrench',
    articles: [
      {
        slug: 'layanan-maintenance-website-tahunan',
        title: 'Lingkup Layanan Annual Website Maintenance',
        category: 'website-maintenance',
        categoryTitle: 'Website Maintenance',
        description: 'Pahami apa saja yang dicakup dalam program pemeliharaan website profesional 1sLabs.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '5 menit',
        keywords: ['jasa maintenance website', 'perawatan website tahunan', 'bug fixing website'],
        toc: [
          { id: 'mengapa-perlu-maintenance', title: 'Mengapa Website Membutuhkan Maintenance Rutin?' },
          { id: 'lingkup-pekerjaan', title: 'Lingkup Pekerjaan Kontrak Tahunan' },
          { id: 'website-dari-pihak-lain', title: 'Pengajuan Website Buatan Pihak Lain' },
          { id: 'alur-assessment', title: 'Alur Assessment Teknis Awal' }
        ],
        content: `
### Mengapa Website Membutuhkan Maintenance Rutin?
Website bukanlah produk statis yang bisa ditinggalkan setelah selesai dibuat. Setiap bulan muncul update keamanan browser, patch celah pada pustaka dependensi, potensi kebocoran SSL, dan degradasi performa akibat akumulasi database. Tanpa maintenance rutin, website berisiko diretas atau mengalami penurunan peringkat Google.

### Lingkup Pekerjaan Kontrak Tahunan
Layanan Annual Website Maintenance 1sLabs mencakup:
1. **Security & Vulnerability Patching:** Pemeriksaan berkala terhadap malware, patching framework, dan audit dependency CVE.
2. **Performance Optimization:** Pembersihan cache, optimasi query database, kompresi aset gambar, dan penyesuaian Core Web Vitals.
3. **Backup Management & Recovery:** Pencadangan berkala database dan berkas ke penyimpanan offsite yang aman serta gladi simulasi disaster recovery.
4. **Bug Fixing & Minor Adjustments:** Perbaikan kendala visual responsif di perangkat baru, perbaikan formulir kontak, dan perubahan teks informasi bisnis.
5. **Uptime Monitoring 24/7:** Pemantauan respons server secara real-time dengan notifikasi instan jika terjadi downtime.

### Pengajuan Website Buatan Pihak Lain
Website Anda sebelumnya dibuat oleh agensi atau freelancer lain? **Bisa diajukan.** 
Tim engineer 1sLabs dapat mengambil alih pemeliharaan website berbasis React, Vue, WordPress, Laravel, atau static site setelah melalui tahapan assessment teknis.

### Alur Assessment Teknis Awal
1. Kirimkan inquiry melalui halaman Kontak atau formulir di \`/it-consulting\`.
2. Tim engineer kami akan melakukan audit awal terhadap struktur kode, hosting existing, dan riwayat keamanan.
3. Kami menyusun proposal rekomendasi perbaikan dan estimasi paket kontrak tahunan yang transparan.
`
      }
    ]
  },
  {
    id: 'account-security',
    title: '10. Account Security & Privacy',
    description: 'Praktik keamanan akun, enkripsi password bcrypt, session management, dan perlindungan privasi.',
    iconName: 'Shield',
    articles: [
      {
        slug: 'keamanan-akun-dan-privasi-data',
        title: 'Kebijakan Keamanan Akun & Privasi Data',
        category: 'account-security',
        categoryTitle: 'Account & Security',
        description: 'Standar pengamanan kata sandi, proteksi brute force, dan isolasi data pelanggan.',
        lastUpdated: '31 Oktober 2026',
        readingTime: '4 menit',
        keywords: ['keamanan akun', 'enkripsi password', 'kebijakan privasi 1slabs'],
        toc: [
          { id: 'enkripsi-kata-sandi', title: 'Enkripsi Kata Sandi (Bcrypt Hashing)' },
          { id: 'session-dan-token', title: 'Manajemen Session & Token JWT' },
          { id: 'rekomendasi-keamanan', title: 'Rekomendasi Keamanan Pengguna' }
        ],
        content: `
### Enkripsi Kata Sandi (Bcrypt Hashing)
1sLabs menerapkan standar keamanan tinggi:
- Seluruh kata sandi pelanggan di-hash menggunakan algoritma **bcrypt** dengan salt round yang kuat sebelum disimpan ke database MySQL.
- Administrator maupun engineer 1sLabs tidak memiliki akses untuk melihat kata sandi asli (plaintext) pelanggan.

### Manajemen Session & Token JWT
- Autentikasi portal menggunakan JSON Web Token (JWT) dengan signature secret berkekuatan tinggi.
- Token memiliki masa berlaku terbatas dan diverifikasi pada setiap request API yang membutuhkan otorisasi kepemilikan (Ownership Check).
- Seluruh transmisi API dilindungi enkripsi SSL/TLS 256-bit.

### Rekomendasi Keamanan Pengguna
1. Gunakan kombinasi password unik yang terdiri dari huruf besar, huruf kecil, angka, dan simbol.
2. Jangan pernah membagikan kredensial login atau API token kepada orang lain.
3. Segera ubah password jika Anda mencurigai aktivitas mencurigakan pada akun email Anda.
`
      }
    ]
  }
];

export const ALL_DOC_ARTICLES = DOCS_CATEGORIES.flatMap((c) => c.articles);

