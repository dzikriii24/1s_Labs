# Panduan Deployment 1sLabs Website ke Server Hosting

## 1. Apa Saja yang Di-upload ke Hosting?

Untuk website berbasis **Vite + React (SPA)**, yang di-upload ke folder web hosting Anda (`public_html/1slabs.my.id/`) adalah **seluruh isi folder `dist/`**, yaitu:

1. **`index.html`**
   - File HTML utama yang memuat root aplikasi, seluruh meta tag SEO (`title`, `meta description`, Open Graph, Twitter Cards), dan Schema.org JSON-LD.
2. **Folder `assets/`**
   - Berisi file JavaScript (`.js`), CSS (`.css`), dan gambar (`.png`) yang sudah di-compile, di-minify, dan dioptimasi oleh Vite untuk kecepatan loading maksimal.
3. **`.htaccess`** (Sangat Penting!)
   - Berisi modul *rewrite rules* Apache agar routing React Router (seperti `/jasa-pembuatan-website`, `/software-development`, `/it-consulting`, `/hosting`) dapat diakses langsung dan di-refresh tanpa muncul error 404 Not Found.
4. **`robots.txt`**
   - Memberikan izin crawling bagi Googlebot dan mengarahkan ke lokasi `sitemap.xml`.
5. **`sitemap.xml`**
   - Peta situs resmi berformat XML yang berisi daftar seluruh URL halaman kanonikal 1sLabs untuk diindeks oleh Google.

> **Catatan Penting:** 
> Folder sistem bawaan server seperti `.well-known` (digunakan untuk auto-renewal sertifikat SSL Let's Encrypt) dan `cgi-bin` **tidak boleh dihapus**.

---

## 2. Cara Deploy Otomatis (1 Perintah)

Semua proses build dan upload telah diotomatisasi melalui script di folder `deploy/`. Kapan pun Anda melakukan perubahan kode di masa mendatang, cukup jalankan perintah berikut di terminal:

```bash
npm run deploy
```

Atau langsung menjalankan script Python:
```bash
python deploy/deploy_to_server.py
```

Script ini akan:
1. Menjalankan `npm run build` untuk menghasilkan bundle produksi terbaru di `dist/`.
2. Melakukan koneksi SSH & SFTP ke server `194.233.65.45` menggunakan kredensial SSH key `id_rsa`.
3. Mengunggah `index.html`, `assets/`, `.htaccess`, `robots.txt`, dan `sitemap.xml` ke `public_html/1slabs.my.id/`.
4. Mengatur permission file menjadi aman (`0644`).

---

## 3. Cara Deploy Manual (Alternatif via FileZilla / cPanel File Manager)

Jika Anda ingin mengunggah secara manual:
1. Jalankan `npm run build` di terminal lokal.
2. Buka folder `c:\Users\dzikri\Downloads\1sLabs-website\dist`.
3. Buka FileZilla / cPanel File Manager, masuk ke direktori:
   ```
   /home/u1zh8984/public_html/1slabs.my.id/
   ```
4. Copy/Upload seluruh isi folder `dist/` (termasuk file tersembunyi `.htaccess`) langsung ke dalam direktori tersebut.
5. Pastikan struktur di server adalah:
   ```
   public_html/1slabs.my.id/
   ├── .htaccess
   ├── assets/
   │   ├── himatif-DAEgUZKk.png
   │   ├── index-[hash].css
   │   ├── index-[hash].js
   │   └── lazismu-DGVfFA68.png
   ├── index.html
   ├── robots.txt
   └── sitemap.xml
   ```
