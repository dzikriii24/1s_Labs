# Proposal Produk Digital Interaktif — Exclusive Fashion Commerce

Dokumen ini merupakan paket proposal komersial dan presentasi produk digital interaktif untuk pengembangan **Platform E-Commerce Fashion Eksklusif & Independent Streetwear**, disusun oleh **1sLabs Digital Product Studio**.

---

## 1. Struktur Direktori (`product_1slabs/docs/`)

```text
product_1slabs/docs/
├── proposal.html        # File utama proposal HTML5/CSS3/JS mandiri (14 bagian + 6 prototipe interaktif)
├── README.md            # Panduan penggunaan, kustomisasi harga/ketentuan, dan ekspor PDF
└── assets/              # Aset fotografi kampanye & studio produk lokal (rasio 4:5 & hero banner)
    ├── hero-campaign.png
    ├── prod-hoodie-front.png
    ├── prod-hoodie-back.png
    ├── prod-jacket-front.png
    ├── prod-jacket-back.png
    ├── prod-tee-front.png
    ├── prod-tee-back.png
    ├── prod-pants-front.png
    ├── prod-pants-back.png
    ├── prod-jersey-front.png
    ├── prod-jersey-back.png
    ├── prod-denim-front.png
    └── prod-denim-back.png
```

---

## 2. Cara Membuka & Mempresentasikan Proposal di Browser

1. Buka file [`proposal.html`](./proposal.html) secara langsung menggunakan browser modern (**Google Chrome**, **Microsoft Edge**, **Brave**, atau **Safari**).
2. Gunakan **Bilah Navigasi Atas (Sticky Topbar)** untuk:
   - Melompat cepat ke salah satu dari **14 Bagian Proposal (`01 — Cover` hingga `14 — Penutup`)**.
   - Membuka tautan **Live Demo Storefront** (`https://nocturne.1slabs.my.id`).
   - Mengaktifkan **MODE EDIT** untuk menyesuaikan nama klien, tanggal, estimasi durasi, dan nominal harga.
   - Mengekspor dokumen ke **PDF (`EXPORT PDF / PRINT`)**.

---

## 3. Cara Menggunakan Prototipe Website Interaktif (Section 05)

Pada **Section 05 — Prototipe Website Interaktif**, Anda dapat mendemonstrasikan 6 layar utama langsung di hadapan klien:

- **Layar A — Homepage (`A. HOMEPAGE`):** Menampilkan *Hero Campaign Layout A* (*Full-Bleed Bottom-Left Editorial Anchor*), lencana rilis terbatas, dan grid produk unggulan (arahkan kursor ke kartu produk untuk melihat efek *flip* dari tampak depan ke tampak belakang).
- **Layar B — Product Catalog (`B. PRODUCT CATALOG`):** Coba fitur pencarian kata kunci secara langsung (*live search*), filter berdasarkan kategori pakaian di sisi kiri, filter status stok, serta pengurutan harga.
- **Layar C — Product Detail (`C. PRODUCT DETAIL`):** Klik foto *thumbnail* untuk mengganti sudut pandang produk, pilih ukuran (*S, M, L, XL*), buka/tutup tabel **Size Guide Master**, atur kuantitas, dan klik **Add to Cart** atau **Buy It Now**.
- **Layar D — Cart & Checkout (`D. CART & CHECKOUT`):** Ubah jumlah unit barang di keranjang atau ganti kota tujuan pengiriman untuk melihat kalkulasi otomatis berat paket (gram ke kg), tarif ongkos kirim, dan total tagihan Xendit.
- **Layar E — Customer Profile (`E. CUSTOMER PROFILE`):** Menampilkan informasi akun pelanggan terverifikasi, tabel riwayat pesanan beserta nomor resi pengiriman, dan *Saved Wishlist*.
- **Layar F — Community Lookbook (`F. COMMUNITY LOOKBOOK`):** Menampilkan galeri foto *outfit* pelanggan bergaya editorial lengkap dengan tautan produk yang dikenakan.

---

## 4. Cara Mengubah Nama Klien, Penyesuaian Timeline, & Harga (Mode Edit)

1. Klik tombol **`MODE EDIT: OFF`** pada bilah navigasi atas hingga berubah menjadi **`MODE EDIT: ON`**.
2. Seluruh bagian teks dan angka yang dapat diedit akan ditandai dengan garis batas putus-putus merah (`#E52323`):
   - **Section 01 (Cover):** Klik langsung pada `[Nama Brand / Pemilik Brand]`, tanggal, atau versi proposal untuk mengetikkan nama klien tujuan.
   - **Section 10 (Roadmap & Timeline):** Secara bawaan tertulis **Didiskusikan Bersama Sesuai Kebutuhan Brand**; Anda dapat mengklik kolom jadwal pada setiap fase (`Phase 01` s/d `Phase 06`) untuk menuliskan kesepakatan tanggal atau durasi sesuai hasil diskusi dengan klien.
   - **Section 11 (Investment & Pricing):** Paket investasi keseluruhan ditetapkan sebesar **Rp 6.500.000 (All-In Package)** yang mencakup ke-6 komponen pengembangan (`UI/UX Design & Brand Customization`, `Frontend Storefront Development`, `Backend Development & API`, `Admin Dashboard & Master CMS`, `Payment Gateway Integration`, `QA, Deployment & Handover`) dengan fleksibilitas kustomisasi sesuai identitas brand. Apabila Anda mengubah nominal alokasi pada salah satu baris, nilai total pada banner atas dan bagian bawah tabel akan dihitung ulang secara otomatis.
   - **Section 13 (Terms & Conditions):** Klik pada klausul syarat & ketentuan untuk menyesuaikan persentase termin pembayaran, batas revisi, atau masa garansi sesuai hasil negosiasi.
3. Setelah selesai mengedit, klik kembali tombol **`MODE EDIT`** untuk mematikan garis bantu sebelum melakukan presentasi atau mencetak ke PDF.

---

## 5. Cara Mengekspor Proposal menjadi Dokumen PDF Profesional

1. Klik tombol **`EXPORT PDF / PRINT`** di sudut kanan atas halaman (atau tekan pintasan keyboard `Ctrl + P` di Windows / `Cmd + P` di macOS).
2. Pada jendela dialog cetak browser (disarankan menggunakan **Google Chrome** atau **Microsoft Edge**), pastikan pengaturan berikut dipilih:
   - **Destination / Tujuan:** `Save as PDF` (Simpan sebagai PDF)
   - **Paper Size / Ukuran Kertas:** `A4`
   - **Layout / Orientasi:** `Portrait` (Tegak)
   - **Margins / Margin:** `Default`
   - **Background Graphics / Grafis Latar Belakang:** **Centang / Aktifkan (`Checked`)** agar latar hitam editorial, warna *swatch*, dan fotografi sampul tercetak secara presisi.
   - **Headers and Footers:** **Jangan dicentang (`Unchecked`)** agar tampilan dokumen bersih dari URL/tanggal bawaan browser.
3. Klik **Save** untuk menyimpan file PDF.

> **Catatan Cetak Otomatis (`@media print`):**
> Saat diekspor ke PDF, bilah navigasi interaktif atas akan disembunyikan secara otomatis, setiap bagian utama akan dimulai pada halaman baru secara rapi, dan **keenam layar prototipe pada Section 05 (`A` hingga `F`) akan dicetak seluruhnya secara berurutan** sehingga klien tetap dapat meninjau seluruh desain halaman di dalam file PDF.

